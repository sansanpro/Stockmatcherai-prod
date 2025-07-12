-- First, clean up all the incorrect entries from healthcare_stocks
DELETE FROM healthcare_stocks WHERE ticker IN (
  'AXP', 'BAC', 'BK', 'BLK', 'C', 'CFG', 'COF', 'GS', 'HBAN', 'JPM', 'MS', 'NTRS', 'PNC', 'RF', 'SCHW', 'STT', 'TFC', 'USB', 'WFC', 'FITB'
);

-- Remove healthcare stocks that are incorrectly in other sector tables
DELETE FROM technology_stocks WHERE ticker IN (
  'ABBV', 'ABT', 'AMGN', 'BIIB', 'BMY', 'CI', 'CVS', 'HUM', 'ISRG', 'JNJ', 'LLY', 'MDT', 'MRK', 'PFE', 'REGN', 'TMO', 'UNH', 'VRTX'
);

-- Add missing healthcare stocks that don't exist yet
INSERT INTO healthcare_stocks (id, ticker, company_name, ceo_name, ceo_highlights, pe_ratio, market_cap, one_year_return, risk_level, price_per_share, dividend_yield, esg_score)
SELECT 'IQV', 'IQV', 'IQVIA Holdings Inc', 'Ari Bousbib', '10+ years leading healthcare data and analytics revolution. Focus on clinical research and real-world evidence solutions.', 22.1, '$35B', 15.7, 'medium', 185.60, 0, 75
WHERE NOT EXISTS (SELECT 1 FROM healthcare_stocks WHERE ticker = 'IQV');

INSERT INTO healthcare_stocks (id, ticker, company_name, ceo_name, ceo_highlights, pe_ratio, market_cap, one_year_return, risk_level, price_per_share, dividend_yield, esg_score)
SELECT 'MTD', 'MTD', 'Mettler-Toledo International Inc', 'Olivier Filliol', '15+ years leading precision instruments for life sciences. Focus on laboratory and industrial weighing solutions for pharmaceutical research.', 42.3, '$25B', 13.8, 'medium', 1245.30, 0.8, 76
WHERE NOT EXISTS (SELECT 1 FROM healthcare_stocks WHERE ticker = 'MTD');

-- Remove finance stocks from wrong sectors
DELETE FROM consumer_stocks WHERE ticker IN ('ALLY', 'CFG', 'FIS', 'FITB', 'HBAN', 'MA', 'PYPL', 'SYF', 'V');
DELETE FROM finance_stocks WHERE ticker IN ('HD', 'LOW', 'MCD', 'NKE', 'SBUX', 'TJX');

-- Remove energy/consumer stocks from wrong sectors  
DELETE FROM energy_stocks WHERE ticker IN ('CAG', 'GIS', 'HSY', 'K', 'MDLZ');
DELETE FROM consumer_stocks WHERE ticker IN ('COP', 'EOG', 'OXY', 'SLB');
DELETE FROM energy_stocks WHERE ticker IN ('COST', 'DIS', 'KO', 'PEP', 'PG', 'TGT', 'WMT');

-- Remove utilities stocks from wrong sectors
DELETE FROM utilities_stocks WHERE ticker IN ('APA', 'DVN', 'EPD', 'ET', 'FANG', 'HES', 'KMI', 'MPC', 'OKE', 'WMB', 'NEE');
DELETE FROM energy_stocks WHERE ticker = 'NEE';