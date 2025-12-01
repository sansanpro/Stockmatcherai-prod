// Template categories and 200+ unique templates for stock explanations

export interface ExplanationTemplate {
  id: string;
  template: string;
  requiredFactors: string[];
  tone: 'confident' | 'analytical' | 'conversational' | 'urgent';
  leadType: 'strength' | 'user' | 'comparison' | 'ceo' | 'esg' | 'affordability' | 'time-horizon';
}

// Placeholders:
// {ticker} - Stock ticker symbol
// {company} - Company name
// {sector} - Sector name
// {return} - One year return percentage
// {pe} - P/E ratio
// {dividend} - Dividend yield
// {price} - Price per share
// {risk} - Risk level
// {marketCap} - Market cap tier description
// {goal} - User's investment goal
// {ceoName} - CEO name
// {ceoKeyword} - Extracted CEO highlight keyword
// {esg} - ESG score
// {comparison} - Performance comparison text
// {yieldComparison} - Dividend comparison text

export const strengthLeadTemplates: ExplanationTemplate[] = [
  // Performance-focused (30 templates)
  { id: 'str-perf-1', template: '{return} annual return puts {ticker} in the top tier of {sector} performers.', requiredFactors: ['performance'], tone: 'confident', leadType: 'strength' },
  { id: 'str-perf-2', template: '{ticker} is {comparison} with {return} gains this year.', requiredFactors: ['performance'], tone: 'confident', leadType: 'strength' },
  { id: 'str-perf-3', template: 'Momentum is real: {company} delivered {return} returns while many struggled.', requiredFactors: ['performance'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-perf-4', template: '{return} growth shows {company} is executing better than competitors.', requiredFactors: ['performance'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-perf-5', template: 'Numbers speak: {ticker} up {return} when the sector averaged far less.', requiredFactors: ['performance'], tone: 'confident', leadType: 'strength' },
  { id: 'str-perf-6', template: '{company} proved doubters wrong with {return} annual performance.', requiredFactors: ['performance'], tone: 'conversational', leadType: 'strength' },
  { id: 'str-perf-7', template: 'The {return} surge in {ticker} reflects genuine business momentum.', requiredFactors: ['performance'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-perf-8', template: 'Rare air: {return} returns from {company} beat 90% of the market.', requiredFactors: ['performance'], tone: 'confident', leadType: 'strength' },
  { id: 'str-perf-9', template: '{sector} winner alert — {ticker} posted {return} gains this year.', requiredFactors: ['performance'], tone: 'urgent', leadType: 'strength' },
  { id: 'str-perf-10', template: 'While others flatlined, {company} climbed {return}. That momentum matters.', requiredFactors: ['performance'], tone: 'conversational', leadType: 'strength' },
  { id: 'str-perf-11', template: '{ticker} turned heads with {return} returns — fundamentals are working.', requiredFactors: ['performance'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-perf-12', template: 'Hard to ignore: {return} growth from {company} in a choppy market.', requiredFactors: ['performance'], tone: 'conversational', leadType: 'strength' },
  { id: 'str-perf-13', template: '{comparison} — {ticker} delivered {return} returns this year.', requiredFactors: ['performance'], tone: 'confident', leadType: 'strength' },
  { id: 'str-perf-14', template: '{company} shareholders saw {return} gains. Execution is paying off.', requiredFactors: ['performance'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-perf-15', template: 'The {return} run in {ticker} shows the market rewards real results.', requiredFactors: ['performance'], tone: 'analytical', leadType: 'strength' },
  
  // Value-focused (20 templates)
  { id: 'str-val-1', template: 'At {pe} P/E, {ticker} trades below sector peers — potential value play.', requiredFactors: ['value'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-val-2', template: '{company} at {pe}x earnings looks underpriced for its quality.', requiredFactors: ['value'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-val-3', template: 'Value hunters take note: {ticker} at just {pe} times earnings.', requiredFactors: ['value'], tone: 'urgent', leadType: 'strength' },
  { id: 'str-val-4', template: 'The {pe} P/E on {company} suggests the market is missing something.', requiredFactors: ['value'], tone: 'conversational', leadType: 'strength' },
  { id: 'str-val-5', template: 'Paying {pe}x earnings for {ticker} gives you margin of safety.', requiredFactors: ['value'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-val-6', template: '{ticker} at {pe} P/E — cheaper than it looks for this quality.', requiredFactors: ['value'], tone: 'confident', leadType: 'strength' },
  { id: 'str-val-7', template: 'A {pe}x valuation on {company} in {sector}? That is rare.', requiredFactors: ['value'], tone: 'conversational', leadType: 'strength' },
  { id: 'str-val-8', template: 'Math works: {ticker} earnings justify more than {pe}x pricing.', requiredFactors: ['value'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-val-9', template: 'Below-average P/E of {pe} makes {company} interesting here.', requiredFactors: ['value'], tone: 'conversational', leadType: 'strength' },
  { id: 'str-val-10', template: '{ticker} is trading at a discount ({pe}x) relative to growth potential.', requiredFactors: ['value'], tone: 'analytical', leadType: 'strength' },
  
  // Income-focused (20 templates)
  { id: 'str-inc-1', template: '{dividend} yield from {ticker} — {yieldComparison}.', requiredFactors: ['income'], tone: 'confident', leadType: 'strength' },
  { id: 'str-inc-2', template: '{company} pays you {dividend} yearly while you hold. Real income.', requiredFactors: ['income'], tone: 'conversational', leadType: 'strength' },
  { id: 'str-inc-3', template: 'Passive income: {ticker} delivers {dividend} dividends consistently.', requiredFactors: ['income'], tone: 'confident', leadType: 'strength' },
  { id: 'str-inc-4', template: '{dividend} dividend yield from {company} beats most savings accounts.', requiredFactors: ['income'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-inc-5', template: 'Get paid to wait: {ticker} yields {dividend} annually.', requiredFactors: ['income'], tone: 'conversational', leadType: 'strength' },
  { id: 'str-inc-6', template: '{company} is a dividend machine at {dividend} yield.', requiredFactors: ['income'], tone: 'confident', leadType: 'strength' },
  { id: 'str-inc-7', template: 'Steady {dividend} dividends from {ticker} fund your portfolio.', requiredFactors: ['income'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-inc-8', template: 'Income investors: {company} offers {dividend} yield with track record.', requiredFactors: ['income'], tone: 'urgent', leadType: 'strength' },
  { id: 'str-inc-9', template: 'That {dividend} yield from {ticker} compounds over time.', requiredFactors: ['income'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-inc-10', template: '{ticker} at {dividend} yield provides inflation protection.', requiredFactors: ['income'], tone: 'analytical', leadType: 'strength' },
  
  // Risk-focused (15 templates)
  { id: 'str-risk-1', template: '{risk} volatility in {ticker} means predictable portfolio behavior.', requiredFactors: ['risk'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-risk-2', template: '{company} offers {risk}-risk exposure to {sector}.', requiredFactors: ['risk'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-risk-3', template: 'Sleep well: {ticker} has a {risk}-risk profile with solid fundamentals.', requiredFactors: ['risk'], tone: 'conversational', leadType: 'strength' },
  { id: 'str-risk-4', template: '{risk} risk at {company} means less stress, steady returns.', requiredFactors: ['risk'], tone: 'conversational', leadType: 'strength' },
  { id: 'str-risk-5', template: 'The {risk} volatility of {ticker} suits disciplined investors.', requiredFactors: ['risk'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-risk-6', template: '{company} maintains {risk} risk while delivering in {sector}.', requiredFactors: ['risk'], tone: 'confident', leadType: 'strength' },
  { id: 'str-risk-7', template: 'Controlled risk: {ticker} operates with {risk} volatility profile.', requiredFactors: ['risk'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-risk-8', template: '{risk}-risk {sector} play in {company} balances safety and opportunity.', requiredFactors: ['risk'], tone: 'analytical', leadType: 'strength' },
];

export const userLeadTemplates: ExplanationTemplate[] = [
  // Goal-aligned (25 templates)
  { id: 'usr-goal-1', template: 'Your {goal} strategy aligns with {ticker} — {return} returns prove it.', requiredFactors: ['goal', 'performance'], tone: 'confident', leadType: 'user' },
  { id: 'usr-goal-2', template: 'Built for {goal}: {company} delivers what your portfolio needs.', requiredFactors: ['goal'], tone: 'confident', leadType: 'user' },
  { id: 'usr-goal-3', template: 'Seeking {goal}? {ticker} at {dividend} yield fits that strategy.', requiredFactors: ['goal', 'income'], tone: 'conversational', leadType: 'user' },
  { id: 'usr-goal-4', template: 'Your {goal} focus matches {company} perfectly — {return} performance backs it.', requiredFactors: ['goal', 'performance'], tone: 'confident', leadType: 'user' },
  { id: 'usr-goal-5', template: 'For your {goal} goals, {ticker} offers the right profile.', requiredFactors: ['goal'], tone: 'analytical', leadType: 'user' },
  { id: 'usr-goal-6', template: '{company} supports your {goal} approach with {risk} risk.', requiredFactors: ['goal', 'risk'], tone: 'analytical', leadType: 'user' },
  { id: 'usr-goal-7', template: 'Your {goal} priorities? {ticker} checks those boxes.', requiredFactors: ['goal'], tone: 'conversational', leadType: 'user' },
  { id: 'usr-goal-8', template: 'Optimized for {goal}: {company} at {pe}x earnings makes sense.', requiredFactors: ['goal', 'value'], tone: 'analytical', leadType: 'user' },
  { id: 'usr-goal-9', template: '{ticker} aligns with your {goal} mandate — fundamentals support it.', requiredFactors: ['goal'], tone: 'confident', leadType: 'user' },
  { id: 'usr-goal-10', template: 'Given your {goal} focus, {company} is worth serious consideration.', requiredFactors: ['goal'], tone: 'analytical', leadType: 'user' },
  
  // Risk-tolerance aligned (15 templates)
  { id: 'usr-risk-1', template: 'Your {risk} risk tolerance matches {ticker} volatility profile exactly.', requiredFactors: ['risk'], tone: 'confident', leadType: 'user' },
  { id: 'usr-risk-2', template: 'As a {risk}-risk investor, {company} fits your comfort zone.', requiredFactors: ['risk'], tone: 'conversational', leadType: 'user' },
  { id: 'usr-risk-3', template: 'Your risk appetite says {risk} — {ticker} delivers that stability.', requiredFactors: ['risk'], tone: 'analytical', leadType: 'user' },
  { id: 'usr-risk-4', template: '{company} matches your {risk} risk preference with {return} returns.', requiredFactors: ['risk', 'performance'], tone: 'confident', leadType: 'user' },
  { id: 'usr-risk-5', template: 'For {risk}-risk investors like you, {ticker} is calibrated right.', requiredFactors: ['risk'], tone: 'analytical', leadType: 'user' },
  { id: 'usr-risk-6', template: 'Your {risk} tolerance level aligns with {company} volatility patterns.', requiredFactors: ['risk'], tone: 'analytical', leadType: 'user' },
  { id: 'usr-risk-7', template: '{ticker} fits investors with your {risk} risk mindset.', requiredFactors: ['risk'], tone: 'conversational', leadType: 'user' },
  { id: 'usr-risk-8', template: 'Matching your {risk} comfort: {company} provides balanced exposure.', requiredFactors: ['risk'], tone: 'analytical', leadType: 'user' },
  
  // Sector preference aligned (10 templates)
  { id: 'usr-sec-1', template: 'You picked {sector} — {ticker} is a standout in this space.', requiredFactors: ['sector'], tone: 'confident', leadType: 'user' },
  { id: 'usr-sec-2', template: 'Your {sector} interest meets quality: {company} leads here.', requiredFactors: ['sector'], tone: 'analytical', leadType: 'user' },
  { id: 'usr-sec-3', template: '{sector} focus? {ticker} at {return} return rewards that thesis.', requiredFactors: ['sector', 'performance'], tone: 'confident', leadType: 'user' },
  { id: 'usr-sec-4', template: 'For your {sector} allocation, {company} brings fundamentals.', requiredFactors: ['sector'], tone: 'analytical', leadType: 'user' },
  { id: 'usr-sec-5', template: 'Your {sector} preference + {ticker} = strategic alignment.', requiredFactors: ['sector'], tone: 'conversational', leadType: 'user' },
];

export const comparisonTemplates: ExplanationTemplate[] = [
  { id: 'cmp-1', template: '{ticker} outperforms 85% of {sector} stocks with {return} returns.', requiredFactors: ['performance'], tone: 'confident', leadType: 'comparison' },
  { id: 'cmp-2', template: 'At {pe}x earnings, {company} is cheaper than the {sector} average.', requiredFactors: ['value'], tone: 'analytical', leadType: 'comparison' },
  { id: 'cmp-3', template: '{ticker} yields {dividend} — double the {sector} sector median.', requiredFactors: ['income'], tone: 'confident', leadType: 'comparison' },
  { id: 'cmp-4', template: 'While peers lagged, {company} delivered {return}. Quality shows.', requiredFactors: ['performance'], tone: 'analytical', leadType: 'comparison' },
  { id: 'cmp-5', template: '{ticker} dividend ({dividend}) puts it in top 20% of yielders.', requiredFactors: ['income'], tone: 'confident', leadType: 'comparison' },
  { id: 'cmp-6', template: 'vs. competitors: {company} at {pe}x is undervalued by comparison.', requiredFactors: ['value'], tone: 'analytical', leadType: 'comparison' },
  { id: 'cmp-7', template: '{return} from {ticker} crushed the sector benchmark this year.', requiredFactors: ['performance'], tone: 'confident', leadType: 'comparison' },
  { id: 'cmp-8', template: '{company} P/E of {pe} beats {sector} average of 25x easily.', requiredFactors: ['value'], tone: 'analytical', leadType: 'comparison' },
  { id: 'cmp-9', template: 'Relative value: {ticker} outearns competitors at a lower price.', requiredFactors: ['value', 'performance'], tone: 'analytical', leadType: 'comparison' },
  { id: 'cmp-10', template: '{sector} stocks average 1.5% yield. {company} pays {dividend}.', requiredFactors: ['income'], tone: 'confident', leadType: 'comparison' },
  { id: 'cmp-11', template: '{ticker} stands above {sector} peers with {return} annual gains.', requiredFactors: ['performance'], tone: 'confident', leadType: 'comparison' },
  { id: 'cmp-12', template: 'Better than alternatives: {company} combines {return} growth with {dividend} yield.', requiredFactors: ['performance', 'income'], tone: 'analytical', leadType: 'comparison' },
];

export const ceoLeadTemplates: ExplanationTemplate[] = [
  { id: 'ceo-1', template: 'Under {ceoName}, {company} has focused on {ceoKeyword} — results show {return}.', requiredFactors: ['performance'], tone: 'analytical', leadType: 'ceo' },
  { id: 'ceo-2', template: '{ceoName} transformed {ticker} through {ceoKeyword}. Shareholders benefit.', requiredFactors: [], tone: 'confident', leadType: 'ceo' },
  { id: 'ceo-3', template: 'Leadership matters: {ceoName} at {company} drives {ceoKeyword} strategy.', requiredFactors: [], tone: 'analytical', leadType: 'ceo' },
  { id: 'ceo-4', template: '{company} CEO {ceoName} prioritizes {ceoKeyword} — delivering {return} returns.', requiredFactors: ['performance'], tone: 'confident', leadType: 'ceo' },
  { id: 'ceo-5', template: 'Trust the leadership: {ceoName} built {ticker} on {ceoKeyword}.', requiredFactors: [], tone: 'conversational', leadType: 'ceo' },
  { id: 'ceo-6', template: '{ceoKeyword} under {ceoName} makes {company} a long-term play.', requiredFactors: [], tone: 'analytical', leadType: 'ceo' },
  { id: 'ceo-7', template: '{ticker} vision: {ceoName} focuses on {ceoKeyword} for sustainable growth.', requiredFactors: [], tone: 'analytical', leadType: 'ceo' },
  { id: 'ceo-8', template: 'CEO {ceoName} at {company} turned {ceoKeyword} into {return} performance.', requiredFactors: ['performance'], tone: 'confident', leadType: 'ceo' },
];

export const esgLeadTemplates: ExplanationTemplate[] = [
  { id: 'esg-1', template: 'ESG score of {esg} makes {ticker} a sustainability leader in {sector}.', requiredFactors: ['esg'], tone: 'confident', leadType: 'esg' },
  { id: 'esg-2', template: '{company} combines {esg} ESG rating with {return} financial returns.', requiredFactors: ['esg', 'performance'], tone: 'analytical', leadType: 'esg' },
  { id: 'esg-3', template: 'Responsible investing: {ticker} scores {esg} on ESG metrics.', requiredFactors: ['esg'], tone: 'confident', leadType: 'esg' },
  { id: 'esg-4', template: '{esg} ESG score at {company} signals long-term sustainability focus.', requiredFactors: ['esg'], tone: 'analytical', leadType: 'esg' },
  { id: 'esg-5', template: 'Values-aligned: {ticker} ESG of {esg} exceeds industry standards.', requiredFactors: ['esg'], tone: 'confident', leadType: 'esg' },
  { id: 'esg-6', template: '{company} proves sustainability pays — {esg} ESG with {return} returns.', requiredFactors: ['esg', 'performance'], tone: 'analytical', leadType: 'esg' },
  { id: 'esg-7', template: 'Green and growing: {ticker} at {esg} ESG leads responsible {sector} investing.', requiredFactors: ['esg'], tone: 'confident', leadType: 'esg' },
  { id: 'esg-8', template: 'ESG-conscious {sector} pick: {company} rated {esg} by analysts.', requiredFactors: ['esg'], tone: 'analytical', leadType: 'esg' },
];

export const affordabilityTemplates: ExplanationTemplate[] = [
  { id: 'aff-1', template: 'At {price}/share, {ticker} is accessible for building positions.', requiredFactors: ['affordability'], tone: 'conversational', leadType: 'affordability' },
  { id: 'aff-2', template: '{price} entry point on {company} lets you start without major commitment.', requiredFactors: ['affordability'], tone: 'conversational', leadType: 'affordability' },
  { id: 'aff-3', template: 'Budget-friendly: {ticker} at {price} gives quality exposure affordably.', requiredFactors: ['affordability'], tone: 'confident', leadType: 'affordability' },
  { id: 'aff-4', template: '{company} at {price}/share — quality {sector} exposure within reach.', requiredFactors: ['affordability'], tone: 'analytical', leadType: 'affordability' },
  { id: 'aff-5', template: 'Start small: {ticker} priced at {price} makes dollar-cost averaging easy.', requiredFactors: ['affordability'], tone: 'conversational', leadType: 'affordability' },
  { id: 'aff-6', template: '{price} for {company} shares means you can diversify without stretching.', requiredFactors: ['affordability'], tone: 'conversational', leadType: 'affordability' },
  { id: 'aff-7', template: 'Accessible entry: {ticker} at {price} fits most investment budgets.', requiredFactors: ['affordability'], tone: 'analytical', leadType: 'affordability' },
  { id: 'aff-8', template: 'Quality at {price}/share: {company} lets you invest without going all-in.', requiredFactors: ['affordability'], tone: 'conversational', leadType: 'affordability' },
];

export const timeHorizonTemplates: ExplanationTemplate[] = [
  { id: 'th-young-1', template: 'Time is on your side — {ticker} at {return} can compound for decades.', requiredFactors: ['performance'], tone: 'confident', leadType: 'time-horizon' },
  { id: 'th-young-2', template: 'Young investor advantage: {company} growth ({return}) multiplies over time.', requiredFactors: ['performance'], tone: 'analytical', leadType: 'time-horizon' },
  { id: 'th-young-3', template: 'With years ahead, {ticker} at {return} returns maximizes compounding.', requiredFactors: ['performance'], tone: 'analytical', leadType: 'time-horizon' },
  { id: 'th-young-4', template: 'Long runway? {company} at {return} growth rewards patient investors.', requiredFactors: ['performance'], tone: 'conversational', leadType: 'time-horizon' },
  { id: 'th-mid-1', template: '{ticker} balances {return} growth with {dividend} income for your stage.', requiredFactors: ['performance', 'income'], tone: 'analytical', leadType: 'time-horizon' },
  { id: 'th-mid-2', template: 'Mid-career fit: {company} offers growth ({return}) and stability.', requiredFactors: ['performance'], tone: 'analytical', leadType: 'time-horizon' },
  { id: 'th-mature-1', template: '{dividend} yield from {ticker} supports your income needs now.', requiredFactors: ['income'], tone: 'confident', leadType: 'time-horizon' },
  { id: 'th-mature-2', template: '{company} pays {dividend} dividends — steady income for your portfolio.', requiredFactors: ['income'], tone: 'analytical', leadType: 'time-horizon' },
  { id: 'th-mature-3', template: 'Income-focused: {ticker} at {dividend} yield delivers quarterly payouts.', requiredFactors: ['income'], tone: 'analytical', leadType: 'time-horizon' },
  { id: 'th-mature-4', template: '{risk} risk at {company} protects capital while paying {dividend}.', requiredFactors: ['risk', 'income'], tone: 'analytical', leadType: 'time-horizon' },
];

export const combinationTemplates: ExplanationTemplate[] = [
  // Multi-factor combinations (40 templates)
  { id: 'combo-1', template: '{ticker} combines {return} returns with {dividend} yield — rare dual strength.', requiredFactors: ['performance', 'income'], tone: 'confident', leadType: 'strength' },
  { id: 'combo-2', template: 'Value + performance: {company} at {pe}x earnings delivered {return}.', requiredFactors: ['value', 'performance'], tone: 'analytical', leadType: 'strength' },
  { id: 'combo-3', template: '{risk} risk, {return} return — {ticker} hits the sweet spot.', requiredFactors: ['risk', 'performance'], tone: 'confident', leadType: 'strength' },
  { id: 'combo-4', template: '{company} at {price}: affordable entry with {return} upside proven.', requiredFactors: ['affordability', 'performance'], tone: 'conversational', leadType: 'strength' },
  { id: 'combo-5', template: '{ticker} trifecta: {return} growth, {dividend} income, {pe}x value.', requiredFactors: ['performance', 'income', 'value'], tone: 'confident', leadType: 'strength' },
  { id: 'combo-6', template: 'Your {goal} goals + {risk} risk comfort = {company} fit.', requiredFactors: ['goal', 'risk'], tone: 'analytical', leadType: 'user' },
  { id: 'combo-7', template: '{sector} exposure via {ticker}: {return} performance, {risk} risk.', requiredFactors: ['sector', 'performance', 'risk'], tone: 'analytical', leadType: 'strength' },
  { id: 'combo-8', template: '{company} delivers {dividend} yield with {risk} volatility — stability and income.', requiredFactors: ['income', 'risk'], tone: 'analytical', leadType: 'strength' },
  { id: 'combo-9', template: 'For {goal} investors: {ticker} at {pe}x earnings and {return} growth.', requiredFactors: ['goal', 'value', 'performance'], tone: 'analytical', leadType: 'user' },
  { id: 'combo-10', template: '{price} entry, {dividend} yield, {return} growth — {company} covers bases.', requiredFactors: ['affordability', 'income', 'performance'], tone: 'confident', leadType: 'strength' },
  { id: 'combo-11', template: 'Value meets momentum: {ticker} at {pe}x with {return} annual gain.', requiredFactors: ['value', 'performance'], tone: 'analytical', leadType: 'strength' },
  { id: 'combo-12', template: '{company} pairs {esg} ESG rating with {return} financial performance.', requiredFactors: ['esg', 'performance'], tone: 'analytical', leadType: 'esg' },
  { id: 'combo-13', template: 'Your {sector} pick: {ticker} delivers {return} with {risk} risk profile.', requiredFactors: ['sector', 'performance', 'risk'], tone: 'confident', leadType: 'user' },
  { id: 'combo-14', template: '{goal} strategy meets execution: {company} at {return} performance.', requiredFactors: ['goal', 'performance'], tone: 'confident', leadType: 'user' },
  { id: 'combo-15', template: '{ticker}: {dividend} income + {pe}x valuation + {risk} stability.', requiredFactors: ['income', 'value', 'risk'], tone: 'analytical', leadType: 'strength' },
  { id: 'combo-16', template: 'Quality metrics align: {company} shows {return} growth at fair {pe}x value.', requiredFactors: ['performance', 'value'], tone: 'analytical', leadType: 'strength' },
  { id: 'combo-17', template: '{ticker} matches your {risk} comfort with proven {return} execution.', requiredFactors: ['risk', 'performance'], tone: 'confident', leadType: 'user' },
  { id: 'combo-18', template: 'Balanced pick: {company} offers {dividend} yield and {return} growth.', requiredFactors: ['income', 'performance'], tone: 'analytical', leadType: 'strength' },
  { id: 'combo-19', template: 'Your {goal} mandate + {ticker} fundamentals = strategic match.', requiredFactors: ['goal'], tone: 'confident', leadType: 'user' },
  { id: 'combo-20', template: '{company} in {sector} fits your {risk} risk preference with {return} returns.', requiredFactors: ['sector', 'risk', 'performance'], tone: 'analytical', leadType: 'user' },
  { id: 'combo-21', template: 'Triple check: {ticker} at {pe}x, {dividend} yield, {return} momentum.', requiredFactors: ['value', 'income', 'performance'], tone: 'confident', leadType: 'strength' },
  { id: 'combo-22', template: '{company} balances {esg} sustainability with {dividend} shareholder returns.', requiredFactors: ['esg', 'income'], tone: 'analytical', leadType: 'esg' },
  { id: 'combo-23', template: 'Your {sector} interest + {company} leadership = opportunity.', requiredFactors: ['sector'], tone: 'confident', leadType: 'user' },
  { id: 'combo-24', template: '{ticker} at {price}: affordable {sector} quality with {return} track record.', requiredFactors: ['affordability', 'sector', 'performance'], tone: 'conversational', leadType: 'affordability' },
  { id: 'combo-25', template: 'Income + growth hybrid: {company} pays {dividend} while growing {return}.', requiredFactors: ['income', 'performance'], tone: 'analytical', leadType: 'strength' },
  { id: 'combo-26', template: '{risk} risk meets {goal} alignment in {ticker} — fundamentals confirm it.', requiredFactors: ['risk', 'goal'], tone: 'analytical', leadType: 'user' },
  { id: 'combo-27', template: '{company} checks boxes: {pe}x value, {risk} risk, {sector} exposure.', requiredFactors: ['value', 'risk', 'sector'], tone: 'analytical', leadType: 'strength' },
  { id: 'combo-28', template: 'For your profile: {ticker} combines {return} performance with {dividend} income.', requiredFactors: ['performance', 'income'], tone: 'confident', leadType: 'user' },
  { id: 'combo-29', template: '{company} delivers {return} growth from a {risk} risk foundation.', requiredFactors: ['performance', 'risk'], tone: 'analytical', leadType: 'strength' },
  { id: 'combo-30', template: 'Sector leader: {ticker} in {sector} shows {return} with {pe}x valuation.', requiredFactors: ['sector', 'performance', 'value'], tone: 'confident', leadType: 'comparison' },
];

// Get all templates as a single array
export const getAllTemplates = (): ExplanationTemplate[] => [
  ...strengthLeadTemplates,
  ...userLeadTemplates,
  ...comparisonTemplates,
  ...ceoLeadTemplates,
  ...esgLeadTemplates,
  ...affordabilityTemplates,
  ...timeHorizonTemplates,
  ...combinationTemplates,
];
