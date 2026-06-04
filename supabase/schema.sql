-- ────────────────────────────────────────────────────────────────────────────
-- snsdays — database schema (Supabase / Postgres 17)
--
-- Verified against the live project on 2026-06-04 via the Supabase MCP
-- (pg_indexes / pg_constraint / pg_get_functiondef). This mirrors production.
--
-- Notes that differ from a "tidy" design (kept here because they are the truth):
--   • `stall` columns are plain text with NO foreign key to stalls(slug). Deleting
--     a stall does NOT cascade — orphan players/scores rows must be cleaned up by
--     hand (e.g. `delete from players where stall = '<slug>'`).
--   • `scores.score` has no >= 0 check at the DB level; the API enforces range.
--   • RLS is enabled on all three tables, but the API uses the service-role key,
--     which bypasses RLS. (No app traffic relies on client-side policies.)
--
-- Tables: stalls, players, scores.  RPC: upsert_score_if_higher.
-- ────────────────────────────────────────────────────────────────────────────

-- Stalls (event booths). Codes are validated server-side (api/stall.js) and are
-- editable live with no redeploy. `code` is matched case-insensitively.
create table if not exists stalls (
  id         bigint generated always as identity primary key,
  slug       text not null unique,   -- e.g. 'stall-1' (matches STALL_SLUGS in src/data.js)
  name       text not null,          -- display name, e.g. 'Stall 1'
  code       text not null unique,   -- entry code, e.g. 'STALL1'
  created_at timestamptz not null default now()
);

-- Players: one registration per (device, stall) and per (username, stall).
-- The per-IP block was intentionally removed (shared venue Wi-Fi NATs everyone
-- behind one IP). Identity is the device fingerprint, scoped to a stall.
create table if not exists players (
  id          bigserial primary key,
  username    text not null,
  fingerprint text not null,
  ip          text,
  stall       text not null,         -- references a stalls.slug (not FK-enforced)
  created_at  timestamptz not null default now()
);

create unique index if not exists uq_players_fp_stall       on players (fingerprint, stall);
create unique index if not exists uq_players_user_stall_ci  on players (lower(username), stall);
create index        if not exists idx_players_ip            on players (ip);

-- Scores: one row per (username, stall, game); the value is the player's best.
create table if not exists scores (
  id         bigserial primary key,
  username   text not null,
  stall      text not null,          -- references a stalls.slug (not FK-enforced)
  game       text not null check (game in ('quiz', 'wordsearch')),
  score      integer not null,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_scores_user_stall_game_ci on scores (lower(username), stall, game);
create index        if not exists idx_scores_game_score        on scores (game, score desc);

-- Keep-the-highest upsert, called by api/score.js. Inserts a new best, or keeps
-- the existing row when the incoming score is not higher.
create or replace function upsert_score_if_higher(
  p_username text,
  p_stall    text,
  p_game     text,
  p_score    integer
) returns void
language plpgsql
security definer
as $$
begin
  insert into scores (username, stall, game, score)
  values (lower(p_username), p_stall, p_game, p_score)
  on conflict (lower(username), stall, game)
  do update set score = greatest(scores.score, excluded.score);
end;
$$;

-- Seed the three stalls (replace names/codes with the real ones).
insert into stalls (slug, name, code) values
  ('stall-1', 'Stall 1', 'STALL1'),
  ('stall-2', 'Stall 2', 'STALL2'),
  ('stall-3', 'Stall 3', 'STALL3')
on conflict (slug) do nothing;
