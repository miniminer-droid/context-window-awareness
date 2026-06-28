"use client";

import { useState, useRef, useCallback } from "react";
import type { UnscrambleResponse } from "@/lib/unscramble";
import Results from "./Results";

interface Filters {
  startsWith: string;
  endsWith: string;
  contains: string;
  minLength: string;
  maxLength: string;
}

const EMPTY: Filters = {
  startsWith: "",
  endsWith: "",
  contains: "",
  minLength: "",
  maxLength: "",
};

export default function Unscrambler({
  initialLetters = "",
  scoring = "scrabble",
}: {
  initialLetters?: string;
  scoring?: "scrabble" | "wwf";
}) {
  const [letters, setLetters] = useState(initialLetters);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [showFilters, setShowFilters] = useState(false);
  const [data, setData] = useState<UnscrambleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const clean = letters.replace(/[^a-z?*]/gi, "");
      if (!clean) {
        setError("Enter some letters (use ? or * for blank tiles).");
        setData(null);
        return;
      }
      setError(null);
      setLoading(true);
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      const params = new URLSearchParams({ letters: clean });
      if (filters.startsWith) params.set("startsWith", filters.startsWith);
      if (filters.endsWith) params.set("endsWith", filters.endsWith);
      if (filters.contains) params.set("contains", filters.contains);
      if (filters.minLength) params.set("minLength", filters.minLength);
      if (filters.maxLength) params.set("maxLength", filters.maxLength);

      try {
        const res = await fetch(`/api/unscramble?${params}`, { signal: ac.signal });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? "Something went wrong.");
        }
        setData(await res.json());
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message);
          setData(null);
        }
      } finally {
        setLoading(false);
      }
    },
    [letters, filters],
  );

  const setF = (k: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFilters((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="tool">
      <form onSubmit={run} className="tool-form">
        <label htmlFor="letters" className="sr-only">
          Your letters
        </label>
        <div className="input-row">
          <input
            id="letters"
            name="letters"
            value={letters}
            onChange={(e) => setLetters(e.target.value)}
            placeholder="Enter letters (e.g. listen or pl?net)"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={15}
            inputMode="text"
            aria-describedby="letters-help"
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Unscrambling…" : "Unscramble"}
          </button>
        </div>
        <p id="letters-help" className="hint">
          Up to 15 letters. Use <code>?</code> or <code>*</code> for blank tiles.
        </p>

        <button
          type="button"
          className="filters-toggle"
          onClick={() => setShowFilters((s) => !s)}
          aria-expanded={showFilters}
        >
          {showFilters ? "− Hide advanced filters" : "+ Advanced filters"}
        </button>

        {showFilters && (
          <div className="filters">
            <label>
              Starts with
              <input value={filters.startsWith} onChange={setF("startsWith")} maxLength={15} />
            </label>
            <label>
              Ends with
              <input value={filters.endsWith} onChange={setF("endsWith")} maxLength={15} />
            </label>
            <label>
              Contains
              <input value={filters.contains} onChange={setF("contains")} maxLength={15} />
            </label>
            <label>
              Min length
              <input type="number" min={1} max={15} value={filters.minLength} onChange={setF("minLength")} />
            </label>
            <label>
              Max length
              <input type="number" min={1} max={15} value={filters.maxLength} onChange={setF("maxLength")} />
            </label>
          </div>
        )}
      </form>

      {error && <p className="error" role="alert">{error}</p>}
      {data && <Results data={data} scoring={scoring} />}
    </div>
  );
}
