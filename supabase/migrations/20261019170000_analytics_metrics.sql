-- Go/no-go metrics for Release 1, computed from analytics_events. Lives in a private schema
-- the API doesn't expose; query it with the CLI or the SQL editor.
-- Test traffic (install ids starting with 'e2e-') is excluded.
CREATE SCHEMA IF NOT EXISTS analytics;

-- One row per install
CREATE OR REPLACE VIEW analytics.installs AS
WITH events AS (
  SELECT * FROM public.analytics_events WHERE anonymous_id NOT LIKE 'e2e-%'
), firsts AS (
  SELECT anonymous_id,
         min(created_at) AS installed_at,
         min(created_at) FILTER (WHERE event = 'onboarding_complete') AS onboarding_completed_at,
         min(created_at) FILTER (WHERE event = 'first_like') AS first_like_at,
         max(user_id::text)::uuid AS user_id,
         min(props->>'version') FILTER (WHERE event = 'onboarding_complete') AS onboarding_version
  FROM events
  GROUP BY anonymous_id
)
SELECT f.*,
       extract(epoch FROM f.first_like_at - f.installed_at)::int AS seconds_to_first_like,
       EXISTS (SELECT 1 FROM events e WHERE e.anonymous_id = f.anonymous_id
               AND e.created_at >= f.installed_at + interval '1 day' AND e.created_at < f.installed_at + interval '2 days') AS active_day_1,
       EXISTS (SELECT 1 FROM events e WHERE e.anonymous_id = f.anonymous_id
               AND e.created_at >= f.installed_at + interval '7 days' AND e.created_at < f.installed_at + interval '8 days') AS active_day_7
FROM firsts f;

-- The Release 1 scorecard. Thresholds are the proposed starting points (confirm or change).
-- Day 7 retention only counts installs at least 8 days old.
CREATE OR REPLACE VIEW analytics.go_no_go AS
SELECT
  count(*) AS installs,
  round(100.0 * count(*) FILTER (WHERE onboarding_completed_at IS NOT NULL) / nullif(count(*), 0), 1) AS onboarding_completion_pct,
  60 AS onboarding_completion_target_pct,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY seconds_to_first_like) AS median_seconds_to_first_like,
  90 AS seconds_to_first_like_target,
  count(*) FILTER (WHERE installed_at < now() - interval '8 days') AS installs_old_enough_for_d7,
  round(100.0 * count(*) FILTER (WHERE active_day_7 AND installed_at < now() - interval '8 days')
        / nullif(count(*) FILTER (WHERE installed_at < now() - interval '8 days'), 0), 1) AS day_7_retention_pct,
  15 AS day_7_retention_target_pct,
  200 AS installs_needed
FROM analytics.installs;

REVOKE ALL ON SCHEMA analytics FROM anon, authenticated;
