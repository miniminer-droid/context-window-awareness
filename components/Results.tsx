import type { UnscrambleResponse } from "@/lib/unscramble";

interface ResultsProps {
  data: UnscrambleResponse;
  /** Which point system to surface on each chip. */
  scoring?: "scrabble" | "wwf";
}

/**
 * Presentational, server-safe rendering of unscramble results grouped by word
 * length (the layout players expect from a word finder). Used by both the SSR
 * landing pages and the interactive client tool.
 */
export default function Results({ data, scoring = "scrabble" }: ResultsProps) {
  if (data.total === 0) {
    return (
      <div className="results-empty">
        <p>No dictionary words found for those letters. Try adding a blank tile (?), removing a filter, or different letters.</p>
      </div>
    );
  }

  return (
    <div className="results">
      <p className="results-summary">
        Found <strong>{data.total.toLocaleString()}</strong>{" "}
        {data.total === 1 ? "word" : "words"}
        {data.results.length < data.total
          ? ` (showing the top ${data.results.length})`
          : ""}
        .
      </p>

      {data.byLength.map((group) => (
        <section key={group.length} className="length-group">
          <h3>
            {group.length}-letter words{" "}
            <span className="count">({group.words.length})</span>
          </h3>
          <ul className="word-grid">
            {group.words.map((w) => (
              <li key={w.word} className="word-chip">
                <span className="word">{w.word}</span>
                <span className="pts" title={scoring === "wwf" ? "Words With Friends points" : "Scrabble points"}>
                  {scoring === "wwf" ? w.wwf : w.scrabble}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
