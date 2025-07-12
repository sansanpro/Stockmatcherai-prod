-- Clean up duplicate and incorrectly categorized stocks

-- Remove all incorrect entries from healthcare_stocks (keeping only actual healthcare companies)
DELETE FROM healthcare_stocks WHERE ticker IN ('AXP', 'BAC', 'BK', 'BLK', 'C', 'CFG', 'COF', 'GS', 'HBAN', 'IQV', 'JPM', 'MTD', 'MS', 'NTRS', 'PNC', 'RF', 'SCHW', 'STT', 'TFC', 'USB', 'WFC');

-- Remove all incorrect entries from technology_stocks (keeping only actual tech companies)  
DELETE FROM technology_stocks WHERE ticker IN ('ABBV', 'ABT', 'AMGN', 'BIIB', 'BMY', 'CI', 'CVS', 'HUM', 'ISRG', 'JNJ', 'LLY', 'MDT', 'MRK', 'PFE', 'REGN', 'TMO', 'UNH', 'VRTX');

-- Remove all incorrect entries from consumer_stocks (keeping only actual consumer companies)
DELETE FROM consumer_stocks WHERE ticker IN ('ALLY', 'CFG', 'COP', 'EOG', 'FIS', 'FITB', 'HBAN', 'MA', 'OXY', 'PYPL', 'SLB', 'SYF', 'V');

-- Remove all incorrect entries from finance_stocks (keeping only actual finance companies)
DELETE FROM finance_stocks WHERE ticker IN ('DXCM', 'HD', 'IQV', 'LOW', 'MCD', 'MTD', 'NKE', 'SBUX', 'TJX');

-- Remove all incorrect entries from energy_stocks (keeping only actual energy companies)
DELETE FROM energy_stocks WHERE ticker IN ('CAG', 'COST', 'DIS', 'GIS', 'HSY', 'K', 'KO', 'MDLZ', 'PEP', 'PG', 'TGT', 'WMT');

-- Remove all incorrect entries from utilities_stocks (keeping only actual utilities companies)
DELETE FROM utilities_stocks WHERE ticker IN ('APA', 'DVN', 'EPD', 'ET', 'FANG', 'HES', 'KMI', 'MPC', 'NEE', 'OKE', 'WMB');

-- Add missing stocks to their correct sectors

-- Add missing healthcare stocks
INSERT INTO healthcare_stocks (id, ticker, company_name, ceo_name, ceo_highlights, pe_ratio, market_cap, one_year_return, risk_level, price_per_share, dividend_yield, esg_score)
VALUES 
('BSX', 'BSX', 'Boston Scientific Corp', 'Mike Mahoney', '15+ years leading medical device innovation. Focus on breakthrough technologies for complex medical conditions and minimally invasive procedures.', 28.4, '$70B', 14.2, 'medium', 54.85, 0, 78),
('CVS', 'CVS', 'CVS Health Corp', 'Karen Lynch', 'First female CEO leading CVS transformation into comprehensive healthcare company. Focus on integrated health services and pharmacy innovation.', 11.2, '$85B', 7.8, 'low', 65.40, 3.8, 74),
('CI', 'CI', 'Cigna Corp', 'David Cordani', '15+ years with Cigna leading healthcare services expansion. Focus on value-based care and personalized health solutions.', 13.4, '$75B', 9.6, 'low', 245.30, 1.8, 76),
('HUM', 'HUM', 'Humana Inc', 'Bruce Broussard', '10+ years as CEO transforming Humana into integrated care company. Focus on Medicare Advantage and value-based care models.', 18.6, '$60B', 12.4, 'medium', 465.20, 2.1, 79),
('DXCM', 'DXCM', 'DexCom Inc', 'Kevin Sayer', '15+ years leading continuous glucose monitoring innovation. Revolutionizing diabetes management with real-time glucose tracking technology.', 45.2, '$45B', 28.5, 'medium', 125.75, 0, 82),
('EW', 'EW', 'Edwards Lifesciences Corp', 'Michael Mussallem', '20+ years as CEO pioneering heart valve technologies. Leading company through transcatheter valve innovations and structural heart therapies.', 35.8, '$55B', 18.3, 'medium', 88.95, 0.8, 81),
('HOLX', 'HOLX', 'Hologic Inc', 'Stephen MacMillan', '10+ years leading women''s health technology innovation. Focus on diagnostic and surgical solutions for women''s health and wellness.', 16.4, '$18B', 11.2, 'medium', 72.40, 0, 77),
('IQV', 'IQV', 'IQVIA Holdings Inc', 'Ari Bousbib', '10+ years leading healthcare data and analytics revolution. Focus on clinical research and real-world evidence solutions.', 22.1, '$35B', 15.7, 'medium', 185.60, 0, 75),
('MDT', 'MDT', 'Medtronic PLC', 'Geoff Martha', '30+ years with Medtronic leading medical technology innovation. Focus on therapy innovation and healthcare value-based solutions.', 24.8, '$105B', 8.9, 'low', 78.50, 3.2, 80),
('MTD', 'MTD', 'Mettler-Toledo International Inc', 'Olivier Filliol', '15+ years leading precision instruments for life sciences. Focus on laboratory and industrial weighing solutions for pharmaceutical research.', 42.3, '$25B', 13.8, 'medium', 1245.30, 0.8, 76),
('REGN', 'REGN', 'Regeneron Pharmaceuticals Inc', 'Leonard Schleifer', 'Co-founder leading breakthrough drug development for 35+ years. Pioneer in monoclonal antibody therapies and genetic medicines.', 18.7, '$95B', 22.4, 'medium', 845.75, 0, 83),
('SYK', 'SYK', 'Stryker Corporation', 'Kevin Lobo', '10+ years as CEO leading orthopedic and medical technology innovation. Focus on surgical equipment and implant technologies.', 28.9, '$85B', 16.5, 'medium', 365.80, 0.9, 78),
('VRTX', 'VRTX', 'Vertex Pharmaceuticals Inc', 'Reshma Kewalramani', 'Leading rare disease drug development with focus on cystic fibrosis and other genetic disorders. Pioneer in precision medicine approaches.', 28.1, '$115B', 34.2, 'medium', 445.90, 0, 84),
('ZBH', 'ZBH', 'Zimmer Biomet Holdings Inc', 'Ivan Tornos', '30+ years in medical device industry leading orthopedic innovation. Focus on joint replacement and surgical technologies.', 19.4, '$15B', 8.7, 'medium', 115.25, 2.4, 77);

-- Ensure NextEra Energy is only in utilities (it was duplicated in energy)
DELETE FROM energy_stocks WHERE ticker = 'NEE';

-- Add missing energy stocks to replace those moved
INSERT INTO energy_stocks (id, ticker, company_name, ceo_name, ceo_highlights, pe_ratio, market_cap, one_year_return, risk_level, price_per_share, dividend_yield, esg_score)
VALUES 
('SLB', 'SLB', 'Schlumberger NV', 'Olivier Le Peuch', '25+ years with Schlumberger leading oilfield services innovation. Focus on digital transformation and sustainable energy technologies.', 15.8, '$65B', 14.3, 'medium', 45.60, 2.2, 67),
('VLO', 'VLO', 'Valero Energy Corporation', 'Joe Gorder', '15+ years as CEO leading refining operations. Focus on renewable diesel production and low-carbon fuel initiatives.', 11.2, '$35B', 18.9, 'medium', 125.40, 4.1, 69),
('PSX', 'PSX', 'Phillips 66', 'Mark Lashier', '30+ years in energy industry leading refining and chemicals operations. Focus on sustainable fuels and circular economy initiatives.', 12.5, '$40B', 16.7, 'medium', 135.75, 3.8, 68);

-- Add missing consumer stocks  
INSERT INTO consumer_stocks (id, ticker, company_name, ceo_name, ceo_highlights, pe_ratio, market_cap, one_year_return, risk_level, price_per_share, dividend_yield, esg_score)
VALUES
('ABNB', 'ABNB', 'Airbnb Inc', 'Brian Chesky', 'Co-founder revolutionizing travel and hospitality industry. Leading platform transformation and global expansion into experiences and long-term stays.', 22.4, '$85B', 24.6, 'high', 135.20, 0, 73),
('BKNG', 'BKNG', 'Booking Holdings Inc', 'Glenn Fogel', '20+ years with Booking leading online travel revolution. Focus on technology-driven travel solutions and global market expansion.', 18.9, '$140B', 19.3, 'medium', 3450.80, 0, 75),
('COST', 'COST', 'Costco Wholesale Corp', 'Craig Jelinek', '35+ years with Costco leading membership warehouse innovation. Focus on bulk retail and member value with international expansion.', 42.5, '$350B', 11.8, 'low', 785.90, 0.8, 84),
('DIS', 'DIS', 'Walt Disney Company', 'Bob Iger', 'Returning CEO leading Disney through streaming transformation. Focus on content creation, theme parks, and direct-to-consumer entertainment.', 65.4, '$180B', 5.2, 'medium', 95.75, 0.8, 79),
('LOW', 'LOW', 'Lowe''s Companies Inc', 'Marvin Ellison', '5+ years as CEO leading home improvement retail transformation. Focus on supply chain optimization and professional customer growth.', 22.1, '$125B', 9.7, 'medium', 185.65, 2.0, 78),
('MCD', 'MCD', 'McDonald''s Corporation', 'Chris Kempczinski', '25+ years with McDonald''s leading global restaurant operations. Focus on digital transformation and menu innovation.', 25.8, '$210B', 8.4, 'low', 285.45, 2.3, 76),
('NKE', 'NKE', 'Nike Inc', 'John Donahoe', 'Former eBay CEO leading Nike''s digital transformation. Focus on direct-to-consumer sales and sustainable manufacturing.', 28.7, '$165B', 13.2, 'medium', 105.80, 1.1, 81),
('SBUX', 'SBUX', 'Starbucks Corporation', 'Laxman Narasimhan', 'Former Reckitt CEO leading Starbucks global expansion. Focus on premium coffee experience and sustainability initiatives.', 24.3, '$95B', 6.9, 'medium', 82.50, 2.8, 83),
('TGT', 'TGT', 'Target Corporation', 'Brian Cornell', '10+ years as CEO leading retail transformation. Focus on omnichannel shopping experience and exclusive brand partnerships.', 15.2, '$75B', 7.1, 'medium', 165.30, 3.2, 80),
('TJX', 'TJX', 'The TJX Companies Inc', 'Ernie Herrman', '35+ years with TJX leading off-price retail innovation. Focus on treasure hunt shopping experience and global expansion.', 26.1, '$95B', 12.5, 'low', 108.95, 1.8, 77);

-- Add missing finance stocks
INSERT INTO finance_stocks (id, ticker, company_name, ceo_name, ceo_highlights, pe_ratio, market_cap, one_year_return, risk_level, price_per_share, dividend_yield, esg_score)
VALUES
('AXP', 'AXP', 'American Express Company', 'Stephen Squeri', '25+ years with American Express leading premium financial services. Focus on travel rewards and business payment solutions.', 17.4, '$125B', 14.8, 'medium', 165.40, 1.3, 78),
('BK', 'BK', 'The Bank of New York Mellon Corporation', 'Robin Vince', '25+ years in banking leading investment services and wealth management. Focus on digital transformation and custody services.', 12.8, '$35B', 11.2, 'medium', 48.75, 3.1, 74),
('COF', 'COF', 'Capital One Financial Corporation', 'Richard Fairbank', 'Co-founder leading digital banking transformation for 30+ years. Pioneer in data-driven credit decisions and technology innovation.', 8.9, '$45B', 16.3, 'medium', 135.85, 1.9, 73),
('MS', 'MS', 'Morgan Stanley', 'James Gorman', '14+ years as CEO transforming investment bank into wealth management leader. Focus on financial advisory and investment services.', 14.2, '$140B', 18.7, 'medium', 85.60, 3.4, 76),
('NTRS', 'NTRS', 'Northern Trust Corporation', 'Michael O''Grady', '35+ years with Northern Trust leading wealth management services. Focus on ultra-high-net-worth clients and institutional services.', 16.8, '$18B', 9.3, 'low', 88.30, 3.7, 75),
('PNC', 'PNC', 'PNC Financial Services Group Inc', 'William Demchak', '10+ years as CEO leading regional banking transformation. Focus on technology-driven banking solutions and corporate services.', 13.5, '$55B', 12.8, 'medium', 135.70, 3.2, 77),
('RF', 'RF', 'Regions Financial Corporation', 'John Turner', '5+ years as CEO leading regional banking modernization. Focus on digital banking and small business lending.', 10.4, '$18B', 15.2, 'medium', 19.85, 4.8, 72),
('SCHW', 'SCHW', 'Charles Schwab Corp', 'Walt Bettinger', '15+ years as CEO leading discount brokerage revolution. Focus on commission-free trading and financial advisory services.', 19.7, '$125B', 22.4, 'medium', 68.90, 1.4, 79),
('STT', 'STT', 'State Street Corp', 'Ronald O''Hanley', '5+ years as CEO leading institutional investment services. Focus on ETF management and custody services for institutional clients.', 11.8, '$25B', 13.6, 'medium', 72.45, 3.8, 74),
('TFC', 'TFC', 'Truist Financial Corp', 'William Rogers', '5+ years as CEO leading bank merger integration. Focus on digital banking transformation and commercial lending.', 11.2, '$65B', 8.9, 'medium', 48.60, 4.1, 73),
('USB', 'USB', 'U.S. Bancorp', 'Andy Cecere', '5+ years as CEO leading Midwest banking operations. Focus on payment processing and commercial banking services.', 13.7, '$70B', 10.5, 'medium', 46.25, 3.9, 75),
('WFC', 'WFC', 'Wells Fargo & Company', 'Charlie Scharf', '4+ years as CEO leading bank recovery and transformation. Focus on risk management improvement and operational efficiency.', 12.1, '$155B', 19.8, 'medium', 42.85, 2.8, 71);

-- Clean up any remaining duplicates
DELETE FROM utilities_stocks WHERE ticker = 'NEE' AND company_name != 'NextEra Energy, Inc.';
DELETE FROM consumer_stocks WHERE ticker = 'CVX';
DELETE FROM energy_stocks WHERE ticker = 'CVX' AND company_name != 'Chevron Corporation';