-- Add missing consumer stocks
INSERT INTO consumer_stocks (id, ticker, company_name, ceo_name, ceo_highlights, pe_ratio, market_cap, one_year_return, risk_level, price_per_share, dividend_yield, esg_score)
SELECT 'ABNB', 'ABNB', 'Airbnb Inc', 'Brian Chesky', 'Co-founder revolutionizing travel and hospitality industry. Leading platform transformation and global expansion into experiences and long-term stays.', 22.4, '$85B', 24.6, 'high', 135.20, 0, 73
WHERE NOT EXISTS (SELECT 1 FROM consumer_stocks WHERE ticker = 'ABNB')
UNION ALL
SELECT 'BKNG', 'BKNG', 'Booking Holdings Inc', 'Glenn Fogel', '20+ years with Booking leading online travel revolution. Focus on technology-driven travel solutions and global market expansion.', 18.9, '$140B', 19.3, 'medium', 3450.80, 0, 75
WHERE NOT EXISTS (SELECT 1 FROM consumer_stocks WHERE ticker = 'BKNG')
UNION ALL
SELECT 'COST', 'COST', 'Costco Wholesale Corp', 'Craig Jelinek', '35+ years with Costco leading membership warehouse innovation. Focus on bulk retail and member value with international expansion.', 42.5, '$350B', 11.8, 'low', 785.90, 0.8, 84
WHERE NOT EXISTS (SELECT 1 FROM consumer_stocks WHERE ticker = 'COST')
UNION ALL
SELECT 'DIS', 'DIS', 'Walt Disney Company', 'Bob Iger', 'Returning CEO leading Disney through streaming transformation. Focus on content creation, theme parks, and direct-to-consumer entertainment.', 65.4, '$180B', 5.2, 'medium', 95.75, 0.8, 79
WHERE NOT EXISTS (SELECT 1 FROM consumer_stocks WHERE ticker = 'DIS')
UNION ALL  
SELECT 'LOW', 'LOW', 'Lowe''s Companies Inc', 'Marvin Ellison', '5+ years as CEO leading home improvement retail transformation. Focus on supply chain optimization and professional customer growth.', 22.1, '$125B', 9.7, 'medium', 185.65, 2.0, 78
WHERE NOT EXISTS (SELECT 1 FROM consumer_stocks WHERE ticker = 'LOW')
UNION ALL
SELECT 'MCD', 'MCD', 'McDonald''s Corporation', 'Chris Kempczinski', '25+ years with McDonald''s leading global restaurant operations. Focus on digital transformation and menu innovation.', 25.8, '$210B', 8.4, 'low', 285.45, 2.3, 76
WHERE NOT EXISTS (SELECT 1 FROM consumer_stocks WHERE ticker = 'MCD')
UNION ALL
SELECT 'NKE', 'NKE', 'Nike Inc', 'John Donahoe', 'Former eBay CEO leading Nike''s digital transformation. Focus on direct-to-consumer sales and sustainable manufacturing.', 28.7, '$165B', 13.2, 'medium', 105.80, 1.1, 81
WHERE NOT EXISTS (SELECT 1 FROM consumer_stocks WHERE ticker = 'NKE')
UNION ALL
SELECT 'SBUX', 'SBUX', 'Starbucks Corporation', 'Laxman Narasimhan', 'Former Reckitt CEO leading Starbucks global expansion. Focus on premium coffee experience and sustainability initiatives.', 24.3, '$95B', 6.9, 'medium', 82.50, 2.8, 83
WHERE NOT EXISTS (SELECT 1 FROM consumer_stocks WHERE ticker = 'SBUX')
UNION ALL
SELECT 'TGT', 'TGT', 'Target Corporation', 'Brian Cornell', '10+ years as CEO leading retail transformation. Focus on omnichannel shopping experience and exclusive brand partnerships.', 15.2, '$75B', 7.1, 'medium', 165.30, 3.2, 80
WHERE NOT EXISTS (SELECT 1 FROM consumer_stocks WHERE ticker = 'TGT')
UNION ALL
SELECT 'TJX', 'TJX', 'The TJX Companies Inc', 'Ernie Herrman', '35+ years with TJX leading off-price retail innovation. Focus on treasure hunt shopping experience and global expansion.', 26.1, '$95B', 12.5, 'low', 108.95, 1.8, 77
WHERE NOT EXISTS (SELECT 1 FROM consumer_stocks WHERE ticker = 'TJX');

-- Add missing energy stocks
INSERT INTO energy_stocks (id, ticker, company_name, ceo_name, ceo_highlights, pe_ratio, market_cap, one_year_return, risk_level, price_per_share, dividend_yield, esg_score)
SELECT 'SLB', 'SLB', 'Schlumberger NV', 'Olivier Le Peuch', '25+ years with Schlumberger leading oilfield services innovation. Focus on digital transformation and sustainable energy technologies.', 15.8, '$65B', 14.3, 'medium', 45.60, 2.2, 67
WHERE NOT EXISTS (SELECT 1 FROM energy_stocks WHERE ticker = 'SLB')
UNION ALL
SELECT 'VLO', 'VLO', 'Valero Energy Corporation', 'Joe Gorder', '15+ years as CEO leading refining operations. Focus on renewable diesel production and low-carbon fuel initiatives.', 11.2, '$35B', 18.9, 'medium', 125.40, 4.1, 69
WHERE NOT EXISTS (SELECT 1 FROM energy_stocks WHERE ticker = 'VLO')
UNION ALL
SELECT 'PSX', 'PSX', 'Phillips 66', 'Mark Lashier', '30+ years in energy industry leading refining and chemicals operations. Focus on sustainable fuels and circular economy initiatives.', 12.5, '$40B', 16.7, 'medium', 135.75, 3.8, 68
WHERE NOT EXISTS (SELECT 1 FROM energy_stocks WHERE ticker = 'PSX');

-- Ensure NextEra Energy is in utilities only
INSERT INTO utilities_stocks (id, ticker, company_name, ceo_name, ceo_highlights, pe_ratio, market_cap, one_year_return, risk_level, price_per_share, dividend_yield, esg_score)
SELECT 'NEE', 'NEE', 'NextEra Energy, Inc.', 'John Ketchum', '25+ years with NextEra, leading renewable energy expansion. Largest generator of wind and solar energy in North America.', 22.8, '$160B', 8.4, 'low', 78.95, 2.8, 85
WHERE NOT EXISTS (SELECT 1 FROM utilities_stocks WHERE ticker = 'NEE');