# context-window-awareness

A Claude Code plugin that gives the **assistant** the same situational awareness you already have: how full the context window is, when a natural break point arrives, whether there's uncommitted work, and whether tool calls are failing in a burst.

## The problem

Claude Code shows *you* a context-window meter, lets you see tool errors as they happen, and renders your git state in your terminal. But none of that is sent back to the model on the next turn — the assistant has to guess from session shape. That's why long sessions drift past clean break points, why a forced `/compact` sometimes drops uncommitted work from view, and why a confused assistant keeps retrying through a burst of tool errors instead of pausing to reassess.

This plugin closes the loop. On every prompt it reads the active session's transcript, computes signals locally, and — when something crosses a configured threshold — injects a `<system-reminder>` into the next turn so the model sees the same picture you do.

## Four signals (each toggleable)

| Signal              | Fires when…                                                                     |
|---------------------|---------------------------------------------------------------------------------|
| **Context meter**   | Token usage crosses 40%, 60%, 75%, 85%, or 92% of the configured window.        |
| **Compact nudge**   | Context ≥ 75% **and** the recent transcript shows a natural completion (a `git commit`, "all tests pass", a deploy/ship/merge phrase). Suggests `/compact` at a clean break. |
| **Uncommitted guard** | Context ≥ 75% **and** `git status` in the project shows uncommitted files. Warns to commit/stash before any compact so in-flight work isn't dropped. |
| **Error burst**     | ≥ 5 tool errors in the last 50 transcript entries. Encourages a pause to reassess instead of bashing on. |

Each signal fires **once per condition per session**. No spam.

## Install (plugin marketplace — one command)

In Claude Code:

```
/plugin marketplace add https://github.com/miniminer-droid/context-window-awareness
/plugin install context-window-awareness@context-window-awareness
```

That's it. The hook activates immediately. Optionally install `tiktoken` for a more accurate token count:

```bash
pip install --user tiktoken
```

Without `tiktoken`, the script falls back to a chars-per-token heuristic that you can fine-tune (see **Calibration** below).

## Install (manual — without the marketplace)

If you don't want to add a marketplace, clone the repo and wire the hook into `~/.claude/settings.json` directly:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "/absolute/path/to/context-window-awareness/plugins/context-window-awareness/hooks/context_meter.py"
          }
        ]
      }
    ]
  }
}
```

## Calibration (fine-tune the estimate)

The default heuristic estimates ~5–10% high. To match what your CLI's `/context` actually shows:

1. In Claude Code, run `/context` and note the actual token count.
2. Run:
   ```bash
   python3 ~/.../context-window-awareness/plugins/context-window-awareness/hooks/context_meter.py --calibrate 73600
   ```
   (replacing `73600` with whatever `/context` reported).
3. The script reads your most recent transcript, compares its estimate to the value you provided, and writes a `correction_factor` to `~/.config/context-window-awareness/config.json`. Future runs apply the factor automatically.

Re-run whenever the gap drifts (e.g. after switching models or window sizes).

## Configure

Configuration is layered. Three places, highest priority wins:

1. **Project config** — `.context-window-awareness.json` in the working directory. Use this when one project needs different settings (e.g. an Opus 1M project vs a Sonnet 200K project). Project keys override global keys; the `features` block is merged shallowly, so you can disable a single signal without re-listing the others.
2. **Global config** — `~/.config/context-window-awareness/config.json`. Applies to every session that doesn't have a project file.
3. **Auto-detection** — when no `context_window` is set in either config, the hook scans the transcript for the model variant. `[1m]` markers (e.g. `claude-opus-4-7[1m]`) → 1M window; any other Claude model → 200K. Falls back to 200K if nothing matches.

The fields below apply to either config:

```json
{
  "context_window": 1000000,
  "thresholds": [40, 60, 75, 85, 92],
  "chars_per_token": 3.5,
  "correction_factor": 1.0,
  "quiet_under_pct": 30,
  "features": {
    "context_meter": true,
    "compact_nudge": true,
    "uncommitted_guard": true,
    "error_burst": true
  },
  "compact_nudge_threshold_pct": 75,
  "uncommitted_guard_threshold_pct": 75,
  "error_burst_window": 50,
  "error_burst_threshold": 5
}
```

| Field | Default | Notes |
|-------|---------|-------|
| `context_window` | auto-detected | If set, takes precedence over auto-detection. `1000000` for Opus 4.7 1M; `200000` for standard Sonnet/Haiku/Opus. Omit to let the hook infer from transcript. |
| `thresholds` | `[40, 60, 75, 85, 92]` | Percentages that trigger meter reminders. |
| `chars_per_token` | `3.5` | Used only when `tiktoken` isn't installed. |
| `correction_factor` | `1.0` | Set automatically by `--calibrate`. Multiplies the raw estimate. |
| `quiet_under_pct` | `30` | Skip work entirely below this percentage (cheap idle path). |
| `features.*` | all `true` | Disable any signal you don't want. |
| `compact_nudge_threshold_pct` | `75` | Minimum context % before a completion signal triggers a compact nudge. |
| `uncommitted_guard_threshold_pct` | `75` | Minimum context % before checking `git status`. |
| `error_burst_window` | `50` | Number of recent transcript entries to scan for errors. |
| `error_burst_threshold` | `5` | Errors within the window required to trigger the alert. |

State (per-session "already reported" flags) is kept under `~/.cache/context-window-awareness/`. Delete that directory to reset.

## Verify

```bash
python3 ~/.../context_meter.py --selftest
```

Expect a JSON envelope on stdout with one or more `[context-window-awareness] …` lines inside `additionalContext`.

## How it works

1. Claude Code fires `UserPromptSubmit` hooks on every user message and passes a JSON payload (including `transcript_path`, `cwd`, `session_id`) on stdin.
2. The hook reads the transcript `.jsonl`, estimates tokens (`tiktoken` or chars/N), and runs each enabled signal.
3. For each signal that triggers, it appends a line to a buffer.
4. The hook prints a JSON envelope:
   ```json
   {"hookSpecificOutput": {"hookEventName": "UserPromptSubmit", "additionalContext": "..."}}
   ```
   Claude Code injects the `additionalContext` into the model's view for that turn.
5. Per-session state files prevent re-firing once a threshold/condition is reported.

## Caveats

- **Token count is an estimate.** Even with `tiktoken` it differs from Anthropic's server-side tokenizer. Use `--calibrate` to fit it to your reality.
- **Reminders are advisory.** The assistant decides what to do with them. If you want hard behaviour ("always compact at 80%"), put that in your `CLAUDE.md`.
- **The compact nudge uses regex pattern-matching** for completion signals. False positives are harmless (an extra nudge); false negatives mean an occasional missed nudge — fine.
- **Latency added per prompt:** typically 50–200 ms depending on transcript size and whether `tiktoken` is loaded.

## Why this exists

The pattern is general: the assistant working *inside* a system is blind to its own blind spots. The runtime knows things it doesn't tell the model — context %, tool errors, working-tree state. This plugin is one small example of routing local awareness back into the model's view so it can act on what's true.

If you find more signals that fit the same pattern (things you can see locally that the model can't), open an issue or PR.

## License

MIT — see [LICENSE](LICENSE).
