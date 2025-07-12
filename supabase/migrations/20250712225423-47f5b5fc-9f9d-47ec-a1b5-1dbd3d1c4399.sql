-- Remove the redundant daily-stock-update cron job
SELECT cron.unschedule('daily-stock-update');