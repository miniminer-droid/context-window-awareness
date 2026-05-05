#!/usr/bin/env python3
"""Context-window awareness hook for Claude Code.

Reads the active session's transcript, estimates how much of the
context window has been consumed, and — when usage crosses a
configured threshold — prints a system-reminder to stdout. Claude
Code feeds the hook's stdout into the model's context, so the
assistant gains the same awareness of context pressure that the
user already has from the on-screen meter.

Wire it up via Claude Code's UserPromptSubmit hook. See README.

Zero required dependencies. If `tiktoken` is installed the token
estimate is more accurate; otherwise we fall back to a
characters-per-token heuristic.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Defaults — override via ~/.config/context-window-awareness/config.json
# ---------------------------------------------------------------------------

DEFAULT_WINDOW = 200_000          # tokens; Sonnet/Haiku default
DEFAULT_THRESHOLDS = (40, 60, 75, 85, 92)
DEFAULT_CHARS_PER_TOKEN = 3.5     # conservative fallback when tiktoken absent

CONFIG_PATH = Path(
    os.environ.get(
        "CONTEXT_WINDOW_AWARENESS_CONFIG",
        Path.home() / ".config" / "context-window-awareness" / "config.json",
    )
)
STATE_DIR = Path(
    os.environ.get(
        "CONTEXT_WINDOW_AWARENESS_STATE",
        Path.home() / ".cache" / "context-window-awareness",
    )
)


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        return {}
    try:
        return json.loads(CONFIG_PATH.read_text())
    except (json.JSONDecodeError, OSError):
        return {}


def estimate_tokens(text: str, chars_per_token: float) -> int:
    """Best-effort token count. tiktoken if available, else char ratio."""
    try:
        import tiktoken  # type: ignore

        enc = tiktoken.get_encoding("cl100k_base")
        return len(enc.encode(text, disallowed_special=()))
    except Exception:
        return int(len(text) / chars_per_token)


def transcript_payload(path: Path) -> str:
    """Concatenate transcript lines into one blob for token counting.

    We serialize each JSONL entry back to a string so tool-call args,
    tool results, and message content all contribute. This slightly
    over-counts compared to what the server tokenizes, which is the
    safer direction — better to warn early than late.
    """
    chunks: list[str] = []
    try:
        with path.open() as f:
            for line in f:
                line = line.strip()
                if line:
                    chunks.append(line)
    except OSError:
        return ""
    return "\n".join(chunks)


def pick_threshold(pct: float, thresholds: list[int]) -> int | None:
    crossed = [t for t in thresholds if pct >= t]
    return max(crossed) if crossed else None


def emit_reminder(pct: float, tokens: int, window: int, threshold: int) -> str:
    remaining = max(window - tokens, 0)
    advice = {
        40: "still plenty of room.",
        60: "past halfway — start thinking about a clean break point.",
        75: "approaching the danger zone — wrap the current sub-task and consider /compact.",
        85: "high pressure — compact at the next safe checkpoint.",
        92: "near the auto-compact limit — finish the current step and compact NOW to avoid a forced compact.",
    }
    # Pick the closest known advice line for the actual threshold crossed
    nearest = min(advice.keys(), key=lambda k: abs(k - threshold))
    note = advice[nearest]
    return (
        f"<system-reminder>\n"
        f"[context-window-awareness] Approximate context usage: {pct:.0f}% "
        f"(~{tokens:,} of {window:,} tokens, ~{remaining:,} remaining). "
        f"Crossed the {threshold}% threshold — {note}\n"
        f"</system-reminder>"
    )


def main() -> int:
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError:
        return 0  # Don't break the user's prompt because we couldn't parse

    transcript_path = payload.get("transcript_path")
    session_id = payload.get("session_id") or "default"
    if not transcript_path:
        return 0
    tp = Path(transcript_path)
    if not tp.exists():
        return 0

    cfg = load_config()
    window = int(cfg.get("context_window", DEFAULT_WINDOW))
    thresholds = sorted({int(t) for t in cfg.get("thresholds", DEFAULT_THRESHOLDS)})
    chars_per_token = float(cfg.get("chars_per_token", DEFAULT_CHARS_PER_TOKEN))
    quiet_under = int(cfg.get("quiet_under_pct", thresholds[0] if thresholds else 0))

    text = transcript_payload(tp)
    if not text:
        return 0
    tokens = estimate_tokens(text, chars_per_token)
    pct = (tokens / window) * 100 if window > 0 else 0
    if pct < quiet_under:
        return 0

    crossed = pick_threshold(pct, thresholds)
    if crossed is None:
        return 0

    STATE_DIR.mkdir(parents=True, exist_ok=True)
    state_file = STATE_DIR / f"{session_id}.txt"
    last_reported = 0
    if state_file.exists():
        try:
            last_reported = int(state_file.read_text().strip() or 0)
        except (ValueError, OSError):
            last_reported = 0

    if crossed <= last_reported:
        return 0  # Already reported this threshold (or higher) for this session

    try:
        state_file.write_text(str(crossed))
    except OSError:
        pass  # Non-fatal — worst case we re-report next turn

    sys.stdout.write(emit_reminder(pct, tokens, window, crossed) + "\n")
    return 0


if __name__ == "__main__":
    # --selftest: run a smoke test with synthetic stdin so users can verify
    # the script is wired up before depending on it during a real session.
    if len(sys.argv) > 1 and sys.argv[1] == "--selftest":
        import tempfile

        with tempfile.NamedTemporaryFile("w", suffix=".jsonl", delete=False) as f:
            for _ in range(2000):
                f.write(json.dumps({"role": "user", "content": "x" * 200}) + "\n")
            transcript = f.name
        sys.stdin = open(os.devnull)  # main() reads stdin — replace it
        os.environ["CONTEXT_WINDOW_AWARENESS_STATE"] = tempfile.mkdtemp()
        # Build a synthetic payload and re-invoke main via a string-IO shim
        import io

        sys.stdin = io.StringIO(json.dumps({
            "transcript_path": transcript,
            "session_id": "selftest",
        }))
        rc = main()
        print(f"\n[selftest] exit code: {rc}", file=sys.stderr)
        sys.exit(rc)
    sys.exit(main())
