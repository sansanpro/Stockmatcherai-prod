-- Add missing finance stocks to finance_stocks table
INSERT INTO finance_stocks (id, ticker, company_name, ceo_name, ceo_highlights, pe_ratio, market_cap, one_year_return, risk_level, price_per_share, dividend_yield, esg_score)
SELECT 'AXP', 'AXP', 'American Express Company', 'Stephen Squeri', '25+ years with American Express leading premium financial services. Focus on travel rewards and business payment solutions.', 17.4, '$125B', 14.8, 'medium', 165.40, 1.3, 78
WHERE NOT EXISTS (SELECT 1 FROM finance_stocks WHERE ticker = 'AXP')
UNION ALL
SELECT 'BK', 'BK', 'The Bank of New York Mellon Corporation', 'Robin Vince', '25+ years in banking leading investment services and wealth management. Focus on digital transformation and custody services.', 12.8, '$35B', 11.2, 'medium', 48.75, 3.1, 74
WHERE NOT EXISTS (SELECT 1 FROM finance_stocks WHERE ticker = 'BK')
UNION ALL  
SELECT 'COF', 'COF', 'Capital One Financial Corporation', 'Richard Fairbank', 'Co-founder leading digital banking transformation for 30+ years. Pioneer in data-driven credit decisions and technology innovation.', 8.9, '$45B', 16.3, 'medium', 135.85, 1.9, 73
WHERE NOT EXISTS (SELECT 1 FROM finance_stocks WHERE ticker = 'COF')
UNION ALL
SELECT 'MS', 'MS', 'Morgan Stanley', 'James Gorman', '14+ years as CEO transforming investment bank into wealth management leader. Focus on financial advisory and investment services.', 14.2, '$140B', 18.7, 'medium', 85.60, 3.4, 76  
WHERE NOT EXISTS (SELECT 1 FROM finance_stocks WHERE ticker = 'MS')
UNION ALL
SELECT 'NTRS', 'NTRS', 'Northern Trust Corporation', 'Michael O''Grady', '35+ years with Northern Trust leading wealth management services. Focus on ultra-high-net-worth clients and institutional services.', 16.8, '$18B', 9.3, 'low', 88.30, 3.7, 75
WHERE NOT EXISTS (SELECT 1 FROM finance_stocks WHERE ticker = 'NTRS')
UNION ALL
SELECT 'PNC', 'PNC', 'PNC Financial Services Group Inc', 'William Demchak', '10+ years as CEO leading regional banking transformation. Focus on technology-driven banking solutions and corporate services.', 13.5, '$55B', 12.8, 'medium', 135.70, 3.2, 77
WHERE NOT EXISTS (SELECT 1 FROM finance_stocks WHERE ticker = 'PNC')
UNION ALL
SELECT 'RF', 'RF', 'Regions Financial Corporation', 'John Turner', '5+ years as CEO leading regional banking modernization. Focus on digital banking and small business lending.', 10.4, '$18B', 15.2, 'medium', 19.85, 4.8, 72
WHERE NOT EXISTS (SELECT 1 FROM finance_stocks WHERE ticker = 'RF')
UNION ALL
SELECT 'SCHW', 'SCHW', 'Charles Schwab Corp', 'Walt Bettinger', '15+ years as CEO leading discount brokerage revolution. Focus on commission-free trading and financial advisory services.', 19.7, '$125B', 22.4, 'medium', 68.90, 1.4, 79
WHERE NOT EXISTS (SELECT 1 FROM finance_stocks WHERE ticker = 'SCHW')
UNION ALL
SELECT 'STT', 'STT', 'State Street Corp', 'Ronald O''Hanley', '5+ years as CEO leading institutional investment services. Focus on ETF management and custody services for institutional clients.', 11.8, '$25B', 13.6, 'medium', 72.45, 3.8, 74
WHERE NOT EXISTS (SELECT 1 FROM finance_stocks WHERE ticker = 'STT')
UNION ALL
SELECT 'TFC', 'TFC', 'Truist Financial Corp', 'William Rogers', '5+ years as CEO leading bank merger integration. Focus on digital banking transformation and commercial lending.', 11.2, '$65B', 8.9, 'medium', 48.60, 4.1, 73
WHERE NOT EXISTS (SELECT 1 FROM finance_stocks WHERE ticker = 'TFC')
UNION ALL
SELECT 'USB', 'USB', 'U.S. Bancorp', 'Andy Cecere', '5+ years as CEO leading Midwest banking operations. Focus on payment processing and commercial banking services.', 13.7, '$70B', 10.5, 'medium', 46.25, 3.9, 75
WHERE NOT EXISTS (SELECT 1 FROM finance_stocks WHERE ticker = 'USB')
UNION ALL
SELECT 'WFC', 'WFC', 'Wells Fargo & Company', 'Charlie Scharf', '4+ years as CEO leading bank recovery and transformation. Focus on risk management improvement and operational efficiency.', 12.1, '$155B', 19.8, 'medium', 42.85, 2.8, 71
WHERE NOT EXISTS (SELECT 1 FROM finance_stocks WHERE ticker = 'WFC');