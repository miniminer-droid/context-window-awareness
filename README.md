# context-window-awareness

A small Claude Code hook that gives the **assistant** the same view of context-window usage that you already see in the CLI meter or desktop status bar.

## The problem

Claude Code shows you, the human, how full the context window is — there's a percentage in the status line, a `/context` command, and a meter on the desktop app. But that number is computed locally and is **never sent back to the model**. So the assistant has no native way to know "I'm at 60% — I should suggest a compact at the next break point." It can only guess from session shape.

This hook closes the loop: it reads the active session's transcript, estimates token usage, and — when usage crosses a configured threshold (40%, 60%, 75%, 85%, 92%) — injects a `<system-reminder>` into the next turn so the assistant sees the same number you do.

## What the assistant sees

When usage crosses a threshold, the next turn's context gains a line like:

```
<system-reminder>
[context-window-awareness] Approximate context usage: 62%
(~124,000 of 200,000 tokens, ~76,000 remaining). Crossed the 60%
threshold — past halfway — start thinking about a clean break point.
</system-reminder>
```

The reminder fires **once per threshold per session** — you won't get spammed every turn.

## Install

```bash
git clone https://github.com/<you>/context-window-awareness.git ~/.claude-hooks/context-window-awareness
chmod +x ~/.claude-hooks/context-window-awareness/context_meter.py
```

(Optional, for more accurate token counts:)

```bash
pip install --user tiktoken
```

Without `tiktoken` the script uses a chars-per-token heuristic. The estimate is close enough to be useful but a few percent off — that's fine for a "you're getting heavy" signal, not fine for cost accounting.

## Configure

Add a `UserPromptSubmit` hook to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "/Users/YOU/.claude-hooks/context-window-awareness/context_meter.py"
          }
        ]
      }
    ]
  }
}
```

Replace `/Users/YOU/...` with the absolute path you cloned to. The hook fires on every user message, computes usage, and stays silent unless a new threshold has been crossed.

### Customize thresholds and window size

Create `~/.config/context-window-awareness/config.json`:

```json
{
  "context_window": 200000,
  "thresholds": [40, 60, 75, 85, 92],
  "chars_per_token": 3.5,
  "quiet_under_pct": 30
}
```

| Field | Default | What it does |
|-------|---------|--------------|
| `context_window` | `200000` | Total window in tokens. Set to `1000000` for Opus 1M, `200000` for Sonnet/Haiku. |
| `thresholds` | `[40, 60, 75, 85, 92]` | Percentages that trigger a reminder. The hook fires on the highest threshold crossed and remembers the level so it doesn't repeat. |
| `chars_per_token` | `3.5` | Fallback ratio when `tiktoken` isn't installed. Lower = more conservative (over-estimates tokens). |
| `quiet_under_pct` | First threshold | Skip the work entirely below this percentage — saves a few ms on light sessions. |

State is kept under `~/.cache/context-window-awareness/<session_id>.txt`. Delete that directory to reset.

## Verify it works

```bash
python3 ~/.claude-hooks/context-window-awareness/context_meter.py --selftest
```

You should see a synthetic reminder printed to stdout. If you see nothing, the script isn't finding tiktoken or the heuristic — re-check your install.

## How it works

1. Claude Code fires `UserPromptSubmit` hooks before sending your message to the model. Each hook receives a JSON payload on stdin including `transcript_path` (a `.jsonl` file with the full session) and `session_id`.
2. The hook concatenates every transcript line and either tokenizes with `tiktoken` (preferred) or falls back to `len(text) / chars_per_token`.
3. It compares the count to the configured window, finds the highest threshold crossed, and checks a per-session state file to see if that level has already been reported.
4. If it's a new threshold, the script writes a `<system-reminder>` to stdout. Claude Code appends hook stdout to the model's context for that turn — that's how the assistant "sees" the meter.
5. Anything below the lowest threshold is silent. No output, no overhead beyond reading the transcript.

## Caveats

- **The token count is an estimate.** The Claude server tokenizes differently from `cl100k_base`. Expect ±5% accuracy. This is fine for "should I compact?" decisions; it's not fine for billing.
- **The reminder is advisory.** The assistant decides what to do with it — usually that's "suggest a compact at a natural break point" rather than "compact immediately." If you want hard behaviour, write that into your `CLAUDE.md`.
- **Per-session state is keyed by `session_id`.** If Claude Code rotates session IDs (e.g. after a compact), the thresholds reset, which is usually what you want — a fresh window deserves fresh reminders.
- **The hook adds ~50–200ms per prompt** depending on transcript size and whether `tiktoken` is loaded. Negligible in practice.

## License

MIT — see [LICENSE](LICENSE).
