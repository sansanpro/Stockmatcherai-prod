
-- Disable RLS on all sector stock tables to allow data insertion
ALTER TABLE technology_stocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare_stocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE finance_stocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE energy_stocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE consumer_stocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE utilities_stocks DISABLE ROW LEVEL SECURITY;
