// Template categories and comprehensive templates for stock explanations
// Now with enhanced personalization for salary, investment goals, risk, sector, and trajectory

export interface ExplanationTemplate {
  id: string;
  template: string;
  requiredFactors: string[];
  tone: 'confident' | 'analytical' | 'conversational' | 'urgent';
  leadType: 'strength' | 'user' | 'comparison' | 'ceo' | 'affordability' | 'time-horizon' | 'personal' | 'trajectory';
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
// {comparison} - Performance comparison text
// {yieldComparison} - Dividend comparison text
// NEW PERSONAL PLACEHOLDERS:
// {salaryContext} - Context based on user's salary
// {incomeLevel} - Descriptive income level
// {riskProfile} - User's risk profile description
// {trajectoryContext} - Stock trajectory analysis
// {sectorInterest} - Why user's sector choice matters
// {investorType} - Descriptive investor type based on profile
// {affordabilityContext} - How price relates to user's budget
// {goalReason} - Why this stock fits their specific goal

export const strengthLeadTemplates: ExplanationTemplate[] = [
  // Performance-focused with trajectory
  { id: 'str-perf-1', template: '{return} annual return puts {ticker} in the top tier of {sector} performers — {trajectoryContext}.', requiredFactors: ['performance'], tone: 'confident', leadType: 'strength' },
  { id: 'str-perf-2', template: '{ticker} is {comparison} with {return} gains this year, showing {trajectoryContext}.', requiredFactors: ['performance'], tone: 'confident', leadType: 'strength' },
  { id: 'str-perf-3', template: 'Momentum is real: {company} delivered {return} returns. {trajectoryContext}.', requiredFactors: ['performance'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-perf-4', template: '{return} growth shows {company} is executing better than competitors — {trajectoryContext}.', requiredFactors: ['performance'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-perf-5', template: 'Numbers speak: {ticker} up {return} when the sector averaged far less. {trajectoryContext}.', requiredFactors: ['performance'], tone: 'confident', leadType: 'strength' },
  { id: 'str-perf-6', template: '{company} proved doubters wrong with {return} annual performance and {trajectoryContext}.', requiredFactors: ['performance'], tone: 'conversational', leadType: 'strength' },
  { id: 'str-perf-7', template: 'The {return} surge in {ticker} reflects genuine business momentum — {trajectoryContext}.', requiredFactors: ['performance'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-perf-8', template: 'Rare air: {return} returns from {company} beat 90% of the market. {trajectoryContext}.', requiredFactors: ['performance'], tone: 'confident', leadType: 'strength' },
  { id: 'str-perf-9', template: '{sector} winner alert — {ticker} posted {return} gains this year with {trajectoryContext}.', requiredFactors: ['performance'], tone: 'urgent', leadType: 'strength' },
  { id: 'str-perf-10', template: 'While others flatlined, {company} climbed {return}. {trajectoryContext}.', requiredFactors: ['performance'], tone: 'conversational', leadType: 'strength' },
  
  // Value-focused
  { id: 'str-val-1', template: 'At {pe} P/E, {ticker} trades below sector peers — potential value play for your {goal} strategy.', requiredFactors: ['value', 'goal'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-val-2', template: '{company} at {pe}x earnings looks underpriced for its quality — {trajectoryContext}.', requiredFactors: ['value'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-val-3', template: 'Value hunters take note: {ticker} at just {pe} times earnings with {trajectoryContext}.', requiredFactors: ['value'], tone: 'urgent', leadType: 'strength' },
  { id: 'str-val-4', template: 'The {pe} P/E on {company} suggests the market is missing something. {trajectoryContext}.', requiredFactors: ['value'], tone: 'conversational', leadType: 'strength' },
  { id: 'str-val-5', template: 'Paying {pe}x earnings for {ticker} gives you margin of safety for your {goal} goals.', requiredFactors: ['value', 'goal'], tone: 'analytical', leadType: 'strength' },
  
  // Income-focused
  { id: 'str-inc-1', template: '{dividend} yield from {ticker} — {yieldComparison}. {goalReason}.', requiredFactors: ['income', 'goal'], tone: 'confident', leadType: 'strength' },
  { id: 'str-inc-2', template: '{company} pays you {dividend} yearly while you hold. {goalReason}.', requiredFactors: ['income', 'goal'], tone: 'conversational', leadType: 'strength' },
  { id: 'str-inc-3', template: 'Passive income: {ticker} delivers {dividend} dividends consistently — perfect for {goal} investors.', requiredFactors: ['income', 'goal'], tone: 'confident', leadType: 'strength' },
  { id: 'str-inc-4', template: '{dividend} dividend yield from {company} beats most savings accounts. {affordabilityContext}.', requiredFactors: ['income', 'affordability'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-inc-5', template: 'Get paid to wait: {ticker} yields {dividend} annually — {goalReason}.', requiredFactors: ['income', 'goal'], tone: 'conversational', leadType: 'strength' },
  
  // Risk-focused
  { id: 'str-risk-1', template: '{risk} volatility in {ticker} means predictable portfolio behavior — {riskProfile}.', requiredFactors: ['risk'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-risk-2', template: '{company} offers {risk}-risk exposure to {sector}. {riskProfile}.', requiredFactors: ['risk'], tone: 'analytical', leadType: 'strength' },
  { id: 'str-risk-3', template: 'Sleep well: {ticker} has a {risk}-risk profile with solid fundamentals. {riskProfile}.', requiredFactors: ['risk'], tone: 'conversational', leadType: 'strength' },
  { id: 'str-risk-4', template: '{risk} risk at {company} means less stress, steady returns — {riskProfile}.', requiredFactors: ['risk'], tone: 'conversational', leadType: 'strength' },
];

export const userLeadTemplates: ExplanationTemplate[] = [
  // Goal-aligned with personal context
  { id: 'usr-goal-1', template: 'Your {goal} strategy aligns perfectly with {ticker}. {goalReason}, and {return} returns prove the thesis.', requiredFactors: ['goal', 'performance'], tone: 'confident', leadType: 'user' },
  { id: 'usr-goal-2', template: 'Built for {goal}: {company} delivers exactly what your portfolio needs. {trajectoryContext}.', requiredFactors: ['goal'], tone: 'confident', leadType: 'user' },
  { id: 'usr-goal-3', template: 'Seeking {goal}? {ticker} at {dividend} yield fits that strategy. {affordabilityContext}.', requiredFactors: ['goal', 'income', 'affordability'], tone: 'conversational', leadType: 'user' },
  { id: 'usr-goal-4', template: 'Your {goal} focus matches {company} perfectly. {goalReason}, backed by {return} performance.', requiredFactors: ['goal', 'performance'], tone: 'confident', leadType: 'user' },
  { id: 'usr-goal-5', template: 'For your {goal} goals, {ticker} offers the right profile. {trajectoryContext}.', requiredFactors: ['goal'], tone: 'analytical', leadType: 'user' },
  { id: 'usr-goal-6', template: '{company} supports your {goal} approach with {risk} risk. {riskProfile}.', requiredFactors: ['goal', 'risk'], tone: 'analytical', leadType: 'user' },
  { id: 'usr-goal-7', template: 'As a {investorType}, {ticker} checks your {goal} boxes. {trajectoryContext}.', requiredFactors: ['goal'], tone: 'conversational', leadType: 'user' },
  
  // Risk-tolerance aligned with profile
  { id: 'usr-risk-1', template: 'Your {risk} risk tolerance matches {ticker} volatility profile exactly. {riskProfile}.', requiredFactors: ['risk'], tone: 'confident', leadType: 'user' },
  { id: 'usr-risk-2', template: 'As a {riskProfile} investor, {company} fits your comfort zone with {return} returns.', requiredFactors: ['risk', 'performance'], tone: 'conversational', leadType: 'user' },
  { id: 'usr-risk-3', template: 'Your risk appetite says {risk} — {ticker} delivers that stability. {goalReason}.', requiredFactors: ['risk', 'goal'], tone: 'analytical', leadType: 'user' },
  { id: 'usr-risk-4', template: '{riskProfile} looking for {goal}? {company} matches both with {return} returns.', requiredFactors: ['risk', 'performance', 'goal'], tone: 'confident', leadType: 'user' },
  { id: 'usr-risk-5', template: 'For {risk}-risk investors like you, {ticker} is calibrated right. {trajectoryContext}.', requiredFactors: ['risk'], tone: 'analytical', leadType: 'user' },
  
  // Sector preference aligned with reasoning
  { id: 'usr-sec-1', template: 'You picked {sector} — {ticker} is a standout in this space. {sectorInterest}.', requiredFactors: ['sector'], tone: 'confident', leadType: 'user' },
  { id: 'usr-sec-2', template: 'Your {sector} interest meets quality: {company} leads here. {sectorInterest}.', requiredFactors: ['sector'], tone: 'analytical', leadType: 'user' },
  { id: 'usr-sec-3', template: '{sector} focus? {ticker} at {return} return rewards that thesis. {sectorInterest}.', requiredFactors: ['sector', 'performance'], tone: 'confident', leadType: 'user' },
  { id: 'usr-sec-4', template: 'For your {sector} allocation, {company} brings fundamentals. {sectorInterest}.', requiredFactors: ['sector'], tone: 'analytical', leadType: 'user' },
  { id: 'usr-sec-5', template: 'Your {sector} preference + {ticker} = strategic alignment. {goalReason}.', requiredFactors: ['sector', 'goal'], tone: 'conversational', leadType: 'user' },
];

// NEW: Personal financial context templates
export const personalLeadTemplates: ExplanationTemplate[] = [
  { id: 'per-1', template: 'At {price}/share, {ticker} is {affordabilityContext}. {goalReason} as a {investorType}.', requiredFactors: ['affordability', 'goal'], tone: 'conversational', leadType: 'personal' },
  { id: 'per-2', template: '{affordabilityContext} — {company} fits your budget while delivering {return} returns for your {goal} strategy.', requiredFactors: ['affordability', 'performance', 'goal'], tone: 'confident', leadType: 'personal' },
  { id: 'per-3', template: 'As a {investorType}, {ticker} at {price} aligns with your financial comfort zone. {trajectoryContext}.', requiredFactors: ['affordability'], tone: 'analytical', leadType: 'personal' },
  { id: 'per-4', template: 'Your {goal} goals meet {risk} risk tolerance: {company} delivers both. {riskProfile}.', requiredFactors: ['goal', 'risk'], tone: 'confident', leadType: 'personal' },
  { id: 'per-5', template: '{riskProfile} focused on {goal}? {ticker} combines {return} performance with your preferred {sector} sector.', requiredFactors: ['risk', 'goal', 'sector', 'performance'], tone: 'analytical', leadType: 'personal' },
  { id: 'per-6', template: 'Given your {investorType} profile, {company} offers the right mix: {risk} risk, {return} returns, {sectorInterest}.', requiredFactors: ['risk', 'performance', 'sector'], tone: 'analytical', leadType: 'personal' },
  { id: 'per-7', template: '{salaryContext}. {ticker} at {price} is accessible for building your {goal} portfolio.', requiredFactors: ['affordability', 'goal'], tone: 'conversational', leadType: 'personal' },
  { id: 'per-8', template: 'Your investment budget suggests {ticker} at {price} is a smart entry point. {goalReason}.', requiredFactors: ['affordability', 'goal'], tone: 'analytical', leadType: 'personal' },
];

// NEW: Trajectory-focused templates
export const trajectoryTemplates: ExplanationTemplate[] = [
  { id: 'trj-1', template: '{trajectoryContext}: {ticker} momentum suggests continued opportunity. {goalReason}.', requiredFactors: ['performance', 'goal'], tone: 'confident', leadType: 'trajectory' },
  { id: 'trj-2', template: '{company} trajectory shows {trajectoryContext}. For your {goal} strategy, timing looks favorable.', requiredFactors: ['performance', 'goal'], tone: 'analytical', leadType: 'trajectory' },
  { id: 'trj-3', template: 'Looking at {ticker} trajectory: {trajectoryContext}. {riskProfile} should note the {risk} risk level.', requiredFactors: ['performance', 'risk'], tone: 'analytical', leadType: 'trajectory' },
  { id: 'trj-4', template: '{return} returns with {trajectoryContext} — {company} fits your {goal} goals. {sectorInterest}.', requiredFactors: ['performance', 'goal', 'sector'], tone: 'confident', leadType: 'trajectory' },
  { id: 'trj-5', template: 'Stock trajectory analysis: {trajectoryContext}. {ticker} aligns with your {risk} risk tolerance.', requiredFactors: ['performance', 'risk'], tone: 'analytical', leadType: 'trajectory' },
  { id: 'trj-6', template: '{company} is on an upward trajectory with {return} gains. {goalReason}, making this a strong match.', requiredFactors: ['performance', 'goal'], tone: 'confident', leadType: 'trajectory' },
];

export const comparisonTemplates: ExplanationTemplate[] = [
  { id: 'cmp-1', template: '{ticker} outperforms 85% of {sector} stocks with {return} returns. {sectorInterest} — {goalReason}.', requiredFactors: ['performance', 'sector', 'goal'], tone: 'confident', leadType: 'comparison' },
  { id: 'cmp-2', template: 'At {pe}x earnings, {company} is cheaper than the {sector} average. {affordabilityContext}.', requiredFactors: ['value', 'affordability'], tone: 'analytical', leadType: 'comparison' },
  { id: 'cmp-3', template: '{ticker} yields {dividend} — double the {sector} sector median. {goalReason}.', requiredFactors: ['income', 'goal'], tone: 'confident', leadType: 'comparison' },
  { id: 'cmp-4', template: 'While peers lagged, {company} delivered {return}. {trajectoryContext} — {goalReason}.', requiredFactors: ['performance', 'goal'], tone: 'analytical', leadType: 'comparison' },
  { id: 'cmp-5', template: '{ticker} dividend ({dividend}) puts it in top 20% of yielders. {affordabilityContext}.', requiredFactors: ['income', 'affordability'], tone: 'confident', leadType: 'comparison' },
  { id: 'cmp-6', template: 'vs. competitors: {company} at {pe}x is undervalued by comparison. {sectorInterest}.', requiredFactors: ['value', 'sector'], tone: 'analytical', leadType: 'comparison' },
  { id: 'cmp-7', template: '{return} from {ticker} crushed the sector benchmark this year. {riskProfile}.', requiredFactors: ['performance', 'risk'], tone: 'confident', leadType: 'comparison' },
  { id: 'cmp-8', template: '{company} P/E of {pe} beats {sector} average of 25x easily. {goalReason}.', requiredFactors: ['value', 'goal'], tone: 'analytical', leadType: 'comparison' },
];

export const ceoLeadTemplates: ExplanationTemplate[] = [
  { id: 'ceo-1', template: 'Under {ceoName}, {company} has focused on {ceoKeyword} — {trajectoryContext} with {return} results.', requiredFactors: ['performance'], tone: 'analytical', leadType: 'ceo' },
  { id: 'ceo-2', template: '{ceoName} transformed {ticker} through {ceoKeyword}. {goalReason} — shareholders benefit.', requiredFactors: ['goal'], tone: 'confident', leadType: 'ceo' },
  { id: 'ceo-3', template: 'Leadership matters: {ceoName} at {company} drives {ceoKeyword} strategy. {riskProfile}.', requiredFactors: ['risk'], tone: 'analytical', leadType: 'ceo' },
  { id: 'ceo-4', template: '{company} CEO {ceoName} prioritizes {ceoKeyword} — delivering {return} returns for {goal} investors.', requiredFactors: ['performance', 'goal'], tone: 'confident', leadType: 'ceo' },
  { id: 'ceo-5', template: 'Trust the leadership: {ceoName} built {ticker} on {ceoKeyword}. {trajectoryContext}.', requiredFactors: [], tone: 'conversational', leadType: 'ceo' },
];

export const affordabilityTemplates: ExplanationTemplate[] = [
  { id: 'aff-1', template: 'At {price}/share, {ticker} is {affordabilityContext}. {goalReason}.', requiredFactors: ['affordability', 'goal'], tone: 'conversational', leadType: 'affordability' },
  { id: 'aff-2', template: '{price} entry point on {company} lets you start without major commitment. {trajectoryContext}.', requiredFactors: ['affordability'], tone: 'conversational', leadType: 'affordability' },
  { id: 'aff-3', template: 'Budget-friendly: {ticker} at {price} gives quality exposure affordably. {riskProfile}.', requiredFactors: ['affordability', 'risk'], tone: 'confident', leadType: 'affordability' },
  { id: 'aff-4', template: '{company} at {price}/share — {affordabilityContext}. {sectorInterest}.', requiredFactors: ['affordability', 'sector'], tone: 'analytical', leadType: 'affordability' },
  { id: 'aff-5', template: 'Start small: {ticker} priced at {price} makes dollar-cost averaging easy for your {goal} strategy.', requiredFactors: ['affordability', 'goal'], tone: 'conversational', leadType: 'affordability' },
  { id: 'aff-6', template: '{salaryContext}. {ticker} at {price} is accessible for building positions. {goalReason}.', requiredFactors: ['affordability', 'goal'], tone: 'conversational', leadType: 'affordability' },
];

export const timeHorizonTemplates: ExplanationTemplate[] = [
  // Young investors (< 35) with personal context
  { id: 'time-young-1', template: 'With decades ahead, {ticker} growth potential of {return} compounds nicely. {goalReason}.', requiredFactors: ['performance', 'goal'], tone: 'confident', leadType: 'time-horizon' },
  { id: 'time-young-2', template: 'Your long runway makes {company} volatility manageable for {return} upside. {riskProfile}.', requiredFactors: ['performance', 'risk'], tone: 'analytical', leadType: 'time-horizon' },
  { id: 'time-young-3', template: 'Time is your ally: {ticker} {risk} volatility smooths over years. {trajectoryContext}.', requiredFactors: ['risk'], tone: 'conversational', leadType: 'time-horizon' },
  
  // Mid-career (35-50) with personal context
  { id: 'time-mid-1', template: 'At your stage, {company} balances growth ({return}) with stability ({risk} risk). {goalReason}.', requiredFactors: ['performance', 'risk', 'goal'], tone: 'analytical', leadType: 'time-horizon' },
  { id: 'time-mid-2', template: 'Building wealth? {ticker} offers {goal}-friendly returns with {risk} risk. {trajectoryContext}.', requiredFactors: ['goal', 'risk'], tone: 'conversational', leadType: 'time-horizon' },
  { id: 'time-mid-3', template: 'Your career prime + {company} {return} returns = wealth acceleration. {sectorInterest}.', requiredFactors: ['performance', 'sector'], tone: 'confident', leadType: 'time-horizon' },
  
  // Mature investors (50+) with personal context
  { id: 'time-mature-1', template: '{dividend} yield from {ticker} supports income needs. {goalReason} with {risk} risk.', requiredFactors: ['income', 'goal', 'risk'], tone: 'analytical', leadType: 'time-horizon' },
  { id: 'time-mature-2', template: 'Capital preservation matters: {company} {risk} risk suits your timeline. {riskProfile}.', requiredFactors: ['risk'], tone: 'analytical', leadType: 'time-horizon' },
  { id: 'time-mature-3', template: 'Steady income priority? {ticker} at {dividend} yield delivers. {affordabilityContext}.', requiredFactors: ['income', 'affordability'], tone: 'confident', leadType: 'time-horizon' },
];

export const combinationTemplates: ExplanationTemplate[] = [
  { id: 'combo-1', template: '{ticker} delivers {return} performance with {risk} risk — {riskProfile}. {trajectoryContext}.', requiredFactors: ['performance', 'risk'], tone: 'analytical', leadType: 'comparison' },
  { id: 'combo-2', template: 'Performance ({return}) meets value ({pe}x) in {company}. {goalReason} — {trajectoryContext}.', requiredFactors: ['performance', 'value', 'goal'], tone: 'confident', leadType: 'comparison' },
  { id: 'combo-3', template: '{ticker} {dividend} yield plus {return} growth = total return. {goalReason} as a {investorType}.', requiredFactors: ['income', 'performance', 'goal'], tone: 'analytical', leadType: 'comparison' },
  { id: 'combo-4', template: '{company} checks multiple boxes: {return} returns, {risk} risk, {pe}x value. {sectorInterest}.', requiredFactors: ['performance', 'risk', 'value', 'sector'], tone: 'confident', leadType: 'comparison' },
  { id: 'combo-5', template: 'For your {goal} goals with {risk} tolerance: {ticker} at {price} hits the mark. {trajectoryContext}.', requiredFactors: ['goal', 'risk', 'affordability'], tone: 'conversational', leadType: 'comparison' },
  { id: 'combo-6', template: '{riskProfile} seeking {goal}? {company} delivers: {return} returns, {sectorInterest}, {affordabilityContext}.', requiredFactors: ['risk', 'goal', 'performance', 'sector', 'affordability'], tone: 'analytical', leadType: 'comparison' },
];

export const getAllTemplates = (): ExplanationTemplate[] => [
  ...personalLeadTemplates,      // Prioritize personal context
  ...trajectoryTemplates,        // Trajectory reasoning
  ...strengthLeadTemplates,
  ...userLeadTemplates,
  ...comparisonTemplates,
  ...ceoLeadTemplates,
  ...affordabilityTemplates,
  ...timeHorizonTemplates,
  ...combinationTemplates,
];