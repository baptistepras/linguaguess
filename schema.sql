-- LinguaGuess leaderboard schema (Cloudflare D1).
-- Apply with:
--   npx wrangler d1 execute linguaguess --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS scores (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  mode       TEXT    NOT NULL,   -- slavic | romance | nordic
  difficulty TEXT    NOT NULL,   -- easy | hard
  name       TEXT    NOT NULL,
  score      INTEGER NOT NULL,   -- 0 to 1000, already time-adjusted
  ms         INTEGER NOT NULL,   -- match duration, breaks ties in favour of speed
  created_at INTEGER NOT NULL    -- epoch milliseconds
);

-- Covers the only query the board ever runs: one ordered slice per mode and difficulty.
CREATE INDEX IF NOT EXISTS idx_scores_board
  ON scores (mode, difficulty, score DESC, ms ASC, id ASC);
