#!/usr/bin/env python3
"""context-window-awareness — Claude Code UserPromptSubmit hook.

Surfaces signals the user can see locally but the model can't:

  1. Context-window % usage    — fires when crossing thresholds (40/60/75/85/92)
  2. Compact nudge              — at high context + a "natural completion" signal
  3. Uncommitted-work guard     — at high context + a dirty git tree in cwd
  4. Error-burst detector       — when tool errors spike in the last N entries

Each signal is independently toggleable in config and uses per-session state
so reminders fire once per condition rather than every turn.

Calibration: `python3 context_meter.py --calibrate <actual_tokens>` after
checking your CLI's /context value. Saves a correction factor that future
runs apply to the heuristic, closing the gap to ~±1%.

Self-test:   `python3 context_meter.py --selftest`
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Defaults — override via ~/.config/context-window-awareness/config.json
# ---------------------------------------------------------------------------

DEFAULT_WINDOW = 200_000
DEFAULT_THRESHOLDS = (40, 60, 75, 85, 92)
DEFAULT_CHARS_PER_TOKEN = 3.5
DEFAULT_CORRECTION = 1.0

DEFAULT_FEATURES = {
    "context_meter": True,
    "compact_nudge": True,
    "uncommitted_guard": True,
    "error_burst": True,
}
DEFAULT_COMPACT_NUDGE_PCT = 75
DEFAULT_UNCOMMITTED_GUARD_PCT = 75
DEFAULT_ERROR_BURST_WINDOW = 50
DEFAULT_ERROR_BURST_THRESHOLD = 5

def _config_path() -> Path:
    return Path(
        os.environ.get(
            "CONTEXT_WINDOW_AWARENESS_CONFIG",
            Path.home() / ".config" / "context-window-awareness" / "config.json",
        )
    )


def _state_dir() -> Path:
    return Path(
        os.environ.get(
            "CONTEXT_WINDOW_AWARENESS_STATE",
            Path.home() / ".cache" / "context-window-awareness",
        )
    )

# Strong "natural completion" signals — kept narrow on purpose. The hook
# only nudges /compact when one of these appears in the recent transcript
# AND context is already past the configured threshold, so false positives
# only cost an unnecessary nudge — never a forced compact.
COMPLETION_PATTERNS = [
    re.compile(r"\bgit commit -m", re.IGNORECASE),
    re.compile(r"\ball tests pass", re.IGNORECASE),
    re.compile(r"\b\d+ passed,?\s*0 failed", re.IGNORECASE),
    re.compile(r"\bdeployed (to|on)\b", re.IGNORECASE),
    re.compile(r"\bshipped\b", re.IGNORECASE),
    re.compile(r"\bmerged (the )?(pr|pull request)", re.IGNORECASE),
]

# tool_result entries set is_error:true on failed tool calls.
ERROR_PATTERN = re.compile(r'"is_error"\s*:\s*true', re.IGNORECASE)


# ---------------------------------------------------------------------------
# Config / state
# ---------------------------------------------------------------------------


def load_config() -> dict:
    if not _config_path().exists():
        return {}
    try:
        return json.loads(_config_path().read_text())
    except (json.JSONDecodeError, OSError):
        return {}


def load_project_config(cwd: str | None) -> dict:
    """Read .context-window-awareness.json from the project's cwd, if present.

    Project config wins over global config — useful when one project uses
    Opus 1M and another uses Sonnet 200K.
    """
    if not cwd:
        return {}
    proj = Path(cwd) / ".context-window-awareness.json"
    if not proj.exists():
        return {}
    try:
        return json.loads(proj.read_text())
    except (json.JSONDecodeError, OSError):
        return {}


def save_config(cfg: dict) -> None:
    _config_path().parent.mkdir(parents=True, exist_ok=True)
    _config_path().write_text(json.dumps(cfg, indent=2))


# ---------------------------------------------------------------------------
# Model detection — infer window size from transcript when not configured
# ---------------------------------------------------------------------------

# Variant suffixes that signal a non-default window. The Opus 4.7 [1m] variant
# uses a 1M window even though the message-level model field reports the
# family alias ("claude-opus-4-7") without the suffix; the suffix appears in
# the system prompt env block so a substring scan over the whole transcript
# catches it. Add new variants here as Anthropic ships them.
LARGE_CONTEXT_VARIANT_MARKERS = ("[1m]",)
LARGE_CONTEXT_WINDOW = 1_000_000

CLAUDE_MODEL_RE = re.compile(r"claude-[a-z]+-\d+(?:-\d+)?", re.IGNORECASE)


def detect_model_window(transcript_text: str) -> int | None:
    """Best-effort window inference from transcript text. None if no signal."""
    if any(marker in transcript_text for marker in LARGE_CONTEXT_VARIANT_MARKERS):
        return LARGE_CONTEXT_WINDOW
    if CLAUDE_MODEL_RE.search(transcript_text):
        return 200_000
    return None


# ---------------------------------------------------------------------------
# Token estimation
# ---------------------------------------------------------------------------


def estimate_tokens(text: str, chars_per_token: float, correction: float) -> int:
    """tiktoken if installed, otherwise chars/N. Multiplied by *correction*
    so users can fit the heuristic to what their CLI meter actually shows."""
    try:
        import tiktoken  # type: ignore

        enc = tiktoken.get_encoding("cl100k_base")
        raw = len(enc.encode(text, disallowed_special=()))
    except Exception:
        raw = int(len(text) / chars_per_token)
    return int(raw * correction)


def transcript_lines(path: Path) -> list[str]:
    try:
        with path.open() as f:
            return [line.strip() for line in f if line.strip()]
    except OSError:
        return []


# ---------------------------------------------------------------------------
# Signal detectors
# ---------------------------------------------------------------------------


def detect_completion(recent_lines: list[str]) -> str | None:
    """Return the matched pattern label, or None."""
    blob = "\n".join(recent_lines)
    for pat in COMPLETION_PATTERNS:
        m = pat.search(blob)
        if m:
            return m.group(0)
    return None


def count_errors(recent_lines: list[str]) -> int:
    return sum(1 for line in recent_lines if ERROR_PATTERN.search(line))


def git_dirty_summary(cwd: str) -> str | None:
    """Return a short summary of uncommitted changes, or None if clean / not a repo."""
    try:
        result = subprocess.run(
            ["git", "-C", cwd, "status", "--porcelain"],
            capture_output=True, text=True, timeout=3,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    if result.returncode != 0:
        return None
    lines = [l for l in result.stdout.splitlines() if l.strip()]
    if not lines:
        return None
    return f"{len(lines)} uncommitted file(s)"


# ---------------------------------------------------------------------------
# Message builders
# ---------------------------------------------------------------------------


def meter_message(pct: float, tokens: int, window: int, threshold: int) -> str:
    advice = {
        40: "still plenty of room.",
        60: "past halfway — start thinking about a clean break point.",
        75: "approaching the danger zone — wrap the current sub-task and consider /compact.",
        85: "high pressure — compact at the next safe checkpoint.",
        92: "near the auto-compact limit — finish the current step and compact NOW to avoid a forced compact.",
    }
    nearest = min(advice.keys(), key=lambda k: abs(k - threshold))
    remaining = max(window - tokens, 0)
    return (
        f"[context-window-awareness] Approximate context usage: {pct:.0f}% "
        f"(~{tokens:,} of {window:,} tokens, ~{remaining:,} remaining). "
        f"Crossed the {threshold}% threshold — {advice[nearest]}"
    )


def compact_nudge_message(pct: float, signal: str) -> str:
    return (
        f"[context-window-awareness] Context at {pct:.0f}% AND a natural break point "
        f"was just hit (matched: {signal!r}). This is a clean moment to suggest "
        f"`/compact` to the user before context fills further."
    )


def uncommitted_message(summary: str, pct: float) -> str:
    return (
        f"[context-window-awareness] WARNING: context at {pct:.0f}% and the working "
        f"directory has {summary}. Encourage the user to commit or stash before any "
        f"`/compact` so in-flight work isn't dropped from view."
    )


def error_burst_message(n: int, window: int) -> str:
    return (
        f"[context-window-awareness] Error burst detected: {n} tool errors in the "
        f"last {window} transcript entries. Consider pausing to reassess approach "
        f"rather than retrying — repeated failures usually mean a wrong assumption."
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def emit(text: str | None) -> None:
    """Print the JSON envelope Claude Code expects from a UserPromptSubmit hook."""
    out: dict = {}
    if text:
        out = {
            "hookSpecificOutput": {
                "hookEventName": "UserPromptSubmit",
                "additionalContext": text,
            }
        }
    sys.stdout.write(json.dumps(out))


def calibrate(actual_tokens: int) -> int:
    """One-shot calibration. Reads the most recent transcript file under
    ~/.claude/projects/, estimates tokens with current settings, computes
    correction = actual / estimate, persists it to config."""
    projects = Path.home() / ".claude" / "projects"
    if not projects.exists():
        sys.stderr.write(
            "calibrate: ~/.claude/projects not found — can't locate a transcript\n"
        )
        return 1
    candidates = sorted(
        projects.rglob("*.jsonl"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    if not candidates:
        sys.stderr.write("calibrate: no .jsonl transcripts found under ~/.claude/projects\n")
        return 1
    transcript = candidates[0]
    cfg = load_config()
    cpt = float(cfg.get("chars_per_token", DEFAULT_CHARS_PER_TOKEN))
    text = "\n".join(transcript_lines(transcript))
    raw_estimate = estimate_tokens(text, cpt, correction=1.0)
    if raw_estimate <= 0:
        sys.stderr.write("calibrate: empty transcript — nothing to estimate against\n")
        return 1
    correction = actual_tokens / raw_estimate
    cfg["correction_factor"] = round(correction, 4)
    save_config(cfg)
    sys.stderr.write(
        f"calibrate: transcript={transcript.name}\n"
        f"           raw estimate = {raw_estimate:,} tokens\n"
        f"           you reported = {actual_tokens:,} tokens\n"
        f"           correction_factor = {correction:.4f} (saved to {_config_path()})\n"
    )
    return 0


def main() -> int:
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError:
        emit(None)
        return 0

    transcript_path = payload.get("transcript_path")
    cwd = payload.get("cwd") or os.getcwd()
    session_id = payload.get("session_id") or "default"
    if not transcript_path:
        emit(None)
        return 0
    tp = Path(transcript_path)
    if not tp.exists():
        emit(None)
        return 0

    # Layered config: project (.context-window-awareness.json in cwd) wins
    # over global (~/.config/...). Features dicts are merged shallowly so a
    # project file can disable a single signal without re-listing the rest.
    global_cfg = load_config()
    project_cfg = load_project_config(cwd)
    cfg: dict = {**global_cfg, **project_cfg}
    cfg["features"] = {
        **(global_cfg.get("features") or {}),
        **(project_cfg.get("features") or {}),
    }

    thresholds = sorted({int(t) for t in cfg.get("thresholds", DEFAULT_THRESHOLDS)})
    cpt = float(cfg.get("chars_per_token", DEFAULT_CHARS_PER_TOKEN))
    correction = float(cfg.get("correction_factor", DEFAULT_CORRECTION))
    features = {**DEFAULT_FEATURES, **cfg.get("features", {})}
    compact_pct = int(cfg.get("compact_nudge_threshold_pct", DEFAULT_COMPACT_NUDGE_PCT))
    uncommitted_pct = int(cfg.get("uncommitted_guard_threshold_pct", DEFAULT_UNCOMMITTED_GUARD_PCT))
    burst_window = int(cfg.get("error_burst_window", DEFAULT_ERROR_BURST_WINDOW))
    burst_thresh = int(cfg.get("error_burst_threshold", DEFAULT_ERROR_BURST_THRESHOLD))

    lines = transcript_lines(tp)
    if not lines:
        emit(None)
        return 0
    text = "\n".join(lines)

    # Window resolution order:
    #   1. explicit `context_window` from project or global config
    #   2. detected from transcript model ID (e.g. "[1m]" → 1M, otherwise 200K)
    #   3. DEFAULT_WINDOW
    if "context_window" in cfg:
        window = int(cfg["context_window"])
    else:
        window = detect_model_window(text) or DEFAULT_WINDOW

    tokens = estimate_tokens(text, cpt, correction)
    pct = (tokens / window) * 100 if window > 0 else 0.0

    _state_dir().mkdir(parents=True, exist_ok=True)
    messages: list[str] = []

    # 1) Context meter
    if features["context_meter"]:
        crossed = max((t for t in thresholds if pct >= t), default=None)
        if crossed is not None:
            sf = _state_dir() / f"{session_id}.threshold"
            last = 0
            if sf.exists():
                try:
                    last = int(sf.read_text().strip() or 0)
                except (ValueError, OSError):
                    last = 0
            if crossed > last:
                try:
                    sf.write_text(str(crossed))
                except OSError:
                    pass
                messages.append(meter_message(pct, tokens, window, crossed))

    # 2) Compact nudge — high context + completion signal
    if features["compact_nudge"] and pct >= compact_pct:
        signal = detect_completion(lines[-30:])
        if signal:
            sf = _state_dir() / f"{session_id}.compact_nudge"
            if not sf.exists():
                try:
                    sf.write_text("1")
                except OSError:
                    pass
                messages.append(compact_nudge_message(pct, signal))

    # 3) Uncommitted-work guard — high context + dirty repo
    if features["uncommitted_guard"] and pct >= uncommitted_pct:
        summary = git_dirty_summary(cwd)
        if summary:
            sf = _state_dir() / f"{session_id}.uncommitted"
            if not sf.exists():
                try:
                    sf.write_text("1")
                except OSError:
                    pass
                messages.append(uncommitted_message(summary, pct))

    # 4) Error burst — independent of context
    if features["error_burst"]:
        n = count_errors(lines[-burst_window:])
        if n >= burst_thresh:
            sf = _state_dir() / f"{session_id}.errorburst"
            if not sf.exists():
                try:
                    sf.write_text(str(n))
                except OSError:
                    pass
                messages.append(error_burst_message(n, burst_window))

    emit("\n\n".join(messages) if messages else None)
    return 0


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--calibrate":
        if len(sys.argv) < 3:
            sys.stderr.write("usage: context_meter.py --calibrate <actual_tokens>\n")
            sys.exit(2)
        try:
            actual = int(sys.argv[2].replace(",", "").replace("_", ""))
        except ValueError:
            sys.stderr.write(f"calibrate: invalid integer: {sys.argv[2]}\n")
            sys.exit(2)
        sys.exit(calibrate(actual))

    if len(sys.argv) > 1 and sys.argv[1] == "--selftest":
        import io
        import tempfile

        with tempfile.NamedTemporaryFile("w", suffix=".jsonl", delete=False) as f:
            for _ in range(2000):
                f.write(json.dumps({"role": "user", "content": "x" * 200}) + "\n")
            for _ in range(6):  # trigger error-burst
                f.write(json.dumps({"role": "tool", "is_error": True, "content": "boom"}) + "\n")
            f.write(json.dumps({"role": "assistant", "content": "all tests pass — git commit -m 'done'"}) + "\n")
            transcript = f.name
        os.environ["CONTEXT_WINDOW_AWARENESS_STATE"] = tempfile.mkdtemp()
        sys.stdin = io.StringIO(json.dumps({
            "transcript_path": transcript,
            "session_id": "selftest",
            "cwd": os.getcwd(),
        }))
        rc = main()
        sys.stderr.write(f"\n[selftest] exit={rc}\n")
        sys.exit(rc)

    sys.exit(main())
