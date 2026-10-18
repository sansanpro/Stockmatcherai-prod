-- Replace stocks that no longer trade, so the price updater stops failing on them:
--   SPLK (Splunk)  - acquired by Cisco, Mar 2024   -> INTU (Intuit)
--   HOLX (Hologic) - taken private by Blackstone/TPG -> DHR (Danaher)
--   HES (Hess)     - acquired by Chevron, Jul 2025 -> HAL (Halliburton)
-- user_matches keeps its own stock_data snapshot, so existing matches are unaffected.
-- Market fields are placeholders: updated_at is set far in the past so the next
-- update-stock-data run refreshes these rows first with live Finnhub data.
DELETE FROM public.technology_stocks WHERE ticker = 'SPLK';
DELETE FROM public.healthcare_stocks WHERE ticker = 'HOLX';
DELETE FROM public.energy_stocks WHERE ticker = 'HES';

INSERT INTO public.technology_stocks
  (id, ticker, company_name, ceo_name, ceo_highlights, pe_ratio, market_cap, one_year_return, risk_level, price_per_share, dividend_yield, esg_score, updated_at, last_updated)
VALUES
  ('INTU', 'INTU', 'Intuit Inc.', 'Sasan Goodarzi',
   'CEO since 2019. Led the acquisitions of Credit Karma and Mailchimp and is pushing Intuit toward an AI-driven platform across TurboTax and QuickBooks.',
   0, '$0', 0, 'medium', 0, 0, 78, '2000-01-01', '2000-01-01')
ON CONFLICT (ticker) DO NOTHING;

INSERT INTO public.healthcare_stocks
  (id, ticker, company_name, ceo_name, ceo_highlights, pe_ratio, market_cap, one_year_return, risk_level, price_per_share, dividend_yield, esg_score, updated_at, last_updated)
VALUES
  ('DHR', 'DHR', 'Danaher Corporation', 'Rainer M. Blair',
   'CEO since 2020. Reshaped Danaher into a focused life sciences and diagnostics company, spinning off Veralto and growing its bioprocessing business.',
   0, '$0', 0, 'low', 0, 0, 77, '2000-01-01', '2000-01-01')
ON CONFLICT (ticker) DO NOTHING;

INSERT INTO public.energy_stocks
  (id, ticker, company_name, ceo_name, ceo_highlights, pe_ratio, market_cap, one_year_return, risk_level, price_per_share, dividend_yield, esg_score, updated_at, last_updated)
VALUES
  ('HAL', 'HAL', 'Halliburton Company', 'Jeff Miller',
   'CEO since 2017. Focused Halliburton on returns and capital discipline, growing its international business and digital and automated drilling technology.',
   0, '$0', 0, 'high', 0, 0, 62, '2000-01-01', '2000-01-01')
ON CONFLICT (ticker) DO NOTHING;
