// Today's thought: one real, sourced quote shown after the user finishes the day's deck (and its
// recap), chosen from their likes and profile, with a short educational note. Every quote was checked
// against the original text or a well-cited record (2026-10-30); misattributed favourites ("Let food
// be thy medicine", Einstein on compound interest) are deliberately left out. Notes teach an idea;
// they never recommend buying or selling, or promise results. Checks: node scripts/test-quotes.mjs
// No path aliases here, so the Node check script can import this file directly.

export type QuoteTheme =
  | 'beat_cancer' | 'live_healthier' | 'clean_energy' | 'keeping_safe' | 'mental_health' | 'clean_food' | 'clean_water'
  | 'risk_low' | 'risk_high' | 'patience' | 'learning' | 'beginner' | 'purpose' | 'income';

export interface Quote {
  id: string;
  text: string;
  author: string;
  source: string; // work, date and translator where it matters
  url?: string; // where the wording can be checked
  themes: QuoteTheme[];
  lesson: string; // the educational note
}

export const QUOTES: Quote[] = [
  // Stoics
  {
    id: 'seneca-craves-more', author: 'Seneca', source: 'Letters to Lucilius, Letter 2 (trans. Richard Gummere, 1917)',
    url: 'https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_2',
    text: 'It is not the man who has too little, but the man who craves more, that is poor.',
    themes: ['income', 'purpose', 'mental_health'],
    lesson: 'The gap between what you earn and what you spend is your savings rate. It is one of the few parts of investing that is fully in your hands.',
  },
  {
    id: 'seneca-imagination', author: 'Seneca', source: 'Letters to Lucilius, Letter 13 (trans. Richard Gummere, 1917)',
    url: 'https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_13',
    text: 'There are more things, Lucilius, likely to frighten us than there are to crush us; we suffer more often in imagination than in reality.',
    themes: ['risk_low', 'mental_health', 'beginner'],
    lesson: 'Researchers call it loss aversion: a loss tends to feel about twice as strong as a gain of the same size. Knowing that helps you notice when fear, not facts, is talking.',
  },
  {
    id: 'seneca-postponing', author: 'Seneca', source: 'Letters to Lucilius, Letter 1 (trans. Richard Gummere, 1917)',
    url: 'https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_1',
    text: 'While we are postponing, life speeds by.',
    themes: ['patience', 'beginner', 'learning'],
    lesson: 'Compounding means growth is earned on earlier growth, so time does much of the work. That is why many people start learning early, even with small amounts.',
  },
  {
    id: 'seneca-time', author: 'Seneca', source: 'Letters to Lucilius, Letter 1 (trans. Richard Gummere, 1917)',
    url: 'https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_1',
    text: 'Nothing, Lucilius, is ours, except time.',
    themes: ['patience', 'purpose'],
    lesson: 'Your time horizon is how long until you might need the money. It shapes how much ups and downs you can ride out, more than any single company does.',
  },
  {
    id: 'seneca-begin-to-live', author: 'Seneca', source: 'Letters to Lucilius, Letter 101 (trans. Richard Gummere, 1917)',
    url: 'https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_101',
    text: 'Begin at once to live, and count each separate day as a separate life.',
    themes: ['mental_health', 'purpose'],
    lesson: 'Checking prices less often is a known way to feel calmer as an investor. A long-term plan does not need daily attention to work.',
  },
  {
    id: 'marcus-swarm', author: 'Marcus Aurelius', source: 'Meditations, Book 6.54 (trans. George Long, 1862)',
    url: 'https://www.gutenberg.org/ebooks/15877',
    text: 'That which is not good for the swarm, neither is it good for the bee.',
    themes: ['keeping_safe', 'clean_water', 'purpose'],
    lesson: 'Economists call a cost that falls on others, like pollution, an externality. Values-based investors look at how a company affects people beyond its customers.',
  },
  {
    id: 'marcus-dyed', author: 'Marcus Aurelius', source: 'Meditations, Book 5.16 (trans. George Long, 1862)',
    url: 'https://www.gutenberg.org/ebooks/15877',
    text: 'Such as are thy habitual thoughts, such also will be the character of thy mind; for the soul is dyed by the thoughts.',
    themes: ['mental_health', 'learning'],
    lesson: 'What you read every day shapes how you judge risk. Steady, sourced information tends to lead to calmer decisions than headlines built to alarm.',
  },
  {
    id: 'marcus-very-little', author: 'Marcus Aurelius', source: 'Meditations, Book 7.67 (trans. George Long, 1862)',
    url: 'https://www.gutenberg.org/ebooks/15877',
    text: 'Very little indeed is necessary for living a happy life.',
    themes: ['income', 'mental_health'],
    lesson: 'An emergency fund, money set aside for surprises, is often the first step before investing. It makes it less likely that a bad month forces you to sell at a bad time.',
  },
  {
    id: 'marcus-be-such', author: 'Marcus Aurelius', source: 'Meditations, Book 10.16 (trans. George Long, 1862)',
    url: 'https://www.gutenberg.org/ebooks/15877',
    text: 'No longer talk at all about the kind of man that a good man ought to be, but be such.',
    themes: ['purpose', 'beginner'],
    lesson: 'Owning a share makes you a part-owner of a company. Most shares also carry a vote on some company decisions, usually at a yearly meeting.',
  },
  {
    id: 'marcus-loss-change', author: 'Marcus Aurelius', source: 'Meditations, Book 9.35 (trans. George Long, 1862)',
    url: 'https://www.gutenberg.org/ebooks/15877',
    text: 'Loss is nothing else than change.',
    themes: ['risk_high', 'risk_low', 'patience'],
    lesson: 'Volatility is how much a price swings. A price that has fallen is a change in what the market will pay today, which is not always a change in what the company does.',
  },
  {
    id: 'marcus-ten-thousand-years', author: 'Marcus Aurelius', source: 'Meditations, Book 4.17 (trans. George Long, 1862)',
    url: 'https://www.gutenberg.org/ebooks/15877',
    text: 'Do not act as if thou wert going to live ten thousand years. Death hangs over thee. While thou livest, while it is in thy power, be good.',
    themes: ['purpose', 'beat_cancer'],
    lesson: 'Impact investing means choosing companies partly for the good they do, not only for their returns. It starts with knowing what you want your money to support.',
  },
  {
    id: 'epictetus-power', author: 'Epictetus', source: 'Enchiridion 1 (trans. Thomas Wentworth Higginson, 1865)',
    url: 'https://www.gutenberg.org/ebooks/45109',
    text: 'There are things which are within our power, and there are things which are beyond our power.',
    themes: ['risk_low', 'risk_high', 'mental_health'],
    lesson: 'No one controls the market. What you do control is how much you put in, how long you stay and how spread out you are. That spreading is called diversification.',
  },
  {
    id: 'epictetus-views', author: 'Epictetus', source: 'Enchiridion 5 (trans. Thomas Wentworth Higginson, 1865)',
    url: 'https://www.gutenberg.org/ebooks/45109',
    text: 'Men are disturbed not by things, but by the views which they take of things.',
    themes: ['mental_health', 'risk_low'],
    lesson: 'Framing changes feelings: "down 5% today" and "up 20% over five years" can describe the same investment. Looking at the time frame that matches your goal keeps it in proportion.',
  },
  {
    id: 'epictetus-learn', author: 'Epictetus', source: 'Discourses, Book 2.17 (trans. George Long, 1877)',
    url: 'https://www.gutenberg.org/ebooks/10661',
    text: 'It is impossible for a man to begin to learn that which he thinks that he knows.',
    themes: ['beginner', 'learning'],
    lesson: 'Overconfidence is one of the best-studied investing mistakes: people who feel surest tend to trade most. Staying curious is a real advantage for a beginner.',
  },

  // Thinkers and writers
  {
    id: 'thoreau-heaven', author: 'Henry David Thoreau', source: 'Walden, "The Pond in Winter" (1854)',
    url: 'https://www.gutenberg.org/ebooks/205',
    text: 'Heaven is under our feet as well as over our heads.',
    themes: ['clean_food', 'clean_water'],
    lesson: 'Healthy soil and water are what economists call natural capital: resources that quietly support farming, food and whole industries.',
  },
  {
    id: 'thoreau-cost', author: 'Henry David Thoreau', source: 'Walden, "Economy" (1854)',
    url: 'https://www.gutenberg.org/ebooks/205',
    text: 'The cost of a thing is the amount of what I will call life which is required to be exchanged for it, immediately or in the long run.',
    themes: ['income', 'learning', 'purpose'],
    lesson: 'Economists call this opportunity cost: the value of what you give up when you choose something. Every dollar invested is a dollar not spent, and the other way round.',
  },
  {
    id: 'thoreau-truth', author: 'Henry David Thoreau', source: 'Walden, "Conclusion" (1854)',
    url: 'https://www.gutenberg.org/ebooks/205',
    text: 'Rather than love, than money, than fame, give me truth.',
    themes: ['learning', 'keeping_safe'],
    lesson: 'Public companies in the U.S. file reports with the Securities and Exchange Commission (SEC), including yearly results checked by outside auditors. Those filings hold the facts behind the headlines.',
  },
  {
    id: 'laozi-single-step', author: 'Laozi', source: 'Tao Te Ching, chapter 64 (trans. James Legge, 1891)',
    url: 'https://www.gutenberg.org/ebooks/216',
    text: 'The tree which fills the arms grew from the tiniest sprout; the journey of a thousand li commenced with a single step.',
    themes: ['beginner', 'patience', 'clean_food'],
    lesson: 'Many brokers let you buy a fraction of a share, so learning by doing no longer takes a large sum. Small, regular amounts are how many people begin.',
  },
  {
    id: 'laozi-water', author: 'Laozi', source: 'Tao Te Ching, chapter 8 (trans. James Legge, 1891)',
    url: 'https://www.gutenberg.org/ebooks/216',
    text: 'The highest excellence is like (that of) water. The excellence of water appears in its benefiting all things.',
    themes: ['clean_water', 'purpose'],
    lesson: 'Water utilities are often regulated: a public body sets the prices they may charge. That is one reason they tend to change slowly compared with other businesses.',
  },
  {
    id: 'laozi-knows-himself', author: 'Laozi', source: 'Tao Te Ching, chapter 33 (trans. James Legge, 1891)',
    url: 'https://www.gutenberg.org/ebooks/216',
    text: 'He who knows other men is discerning; he who knows himself is intelligent.',
    themes: ['mental_health', 'risk_low', 'risk_high'],
    lesson: 'Your risk tolerance is how much ups and downs you can live with, in money and in sleep. Knowing it honestly matters more than any forecast.',
  },
  {
    id: 'confucius-knowledge', author: 'Confucius', source: 'Analects 2.17 (trans. James Legge, 1861)',
    url: 'https://www.gutenberg.org/ebooks/3330',
    text: 'When you know a thing, to hold that you know it; and when you do not know a thing, to allow that you do not know it;-- this is knowledge.',
    themes: ['beginner', 'learning'],
    lesson: 'Investors sometimes speak of a "circle of competence": the industries you understand well enough to judge. Knowing where yours ends is part of knowing.',
  },
  {
    id: 'confucius-learning-thought', author: 'Confucius', source: 'Analects 2.15 (trans. James Legge, 1861)',
    url: 'https://www.gutenberg.org/ebooks/3330',
    text: 'Learning without thought is labour lost; thought without learning is perilous.',
    themes: ['learning', 'keeping_safe'],
    lesson: 'A price-to-earnings (P/E) ratio is a fact; what it means for a company takes thought. Numbers and judgment work best together.',
  },
  {
    id: 'socrates-unexamined', author: 'Socrates', source: "Plato's Apology 38a (trans. Benjamin Jowett, 1871)",
    url: 'https://www.gutenberg.org/ebooks/1656',
    text: 'The unexamined life is not worth living.',
    themes: ['learning', 'purpose'],
    lesson: 'Writing down why you like a company, in a sentence or two, is an investment thesis. Coming back to it later shows whether your reasons still hold.',
  },
  {
    id: 'smith-flourishing', author: 'Adam Smith', source: 'The Wealth of Nations, Book 1, chapter 8 (1776)',
    url: 'https://www.gutenberg.org/ebooks/3300',
    text: 'No society can surely be flourishing and happy, of which the far greater part of the members are poor and miserable.',
    themes: ['purpose', 'income', 'live_healthier'],
    lesson: 'Gross domestic product (GDP) measures what an economy produces, but not how widely the gains are shared. Economists track that separately, as inequality.',
  },
  {
    id: 'smith-fortune-of-others', author: 'Adam Smith', source: 'The Theory of Moral Sentiments, Part 1 (1759)',
    url: 'https://www.gutenberg.org/ebooks/67363',
    text: 'How selfish soever man may be supposed, there are evidently some principles in his nature, which interest him in the fortune of others.',
    themes: ['purpose', 'mental_health', 'beat_cancer'],
    lesson: 'The father of modern economics wrote about sympathy before he wrote about markets. Investing with your values joins the two.',
  },
  {
    id: 'smith-butcher', author: 'Adam Smith', source: 'The Wealth of Nations, Book 1, chapter 2 (1776)',
    url: 'https://www.gutenberg.org/ebooks/3300',
    text: 'It is not from the benevolence of the butcher, the brewer, or the baker that we expect our dinner, but from their regard to their own interest.',
    themes: ['clean_food', 'learning', 'income'],
    lesson: 'A business lasts by earning more than it spends: that surplus is profit. Companies that solve real problems well are the ones that can keep paying for the work.',
  },
  {
    id: 'james-overlook', author: 'William James', source: 'The Principles of Psychology, Vol. 2, chapter 22 (1890)',
    url: 'https://www.gutenberg.org/ebooks/57634',
    text: 'The art of being wise is the art of knowing what to overlook.',
    themes: ['mental_health', 'patience', 'risk_low'],
    lesson: 'Prices move every second for reasons that often fade within days. Investors call that short-term movement noise, and learning to look past it is a skill.',
  },
  {
    id: 'franklin-well-done', author: 'Benjamin Franklin', source: "Poor Richard's Almanack (1737)",
    text: 'Well done is better than well said.',
    themes: ['purpose', 'keeping_safe'],
    lesson: 'Companies publish sustainability promises, but audited results and independent ratings show what was actually done. Proof beats pledges.',
  },

  // Science and medicine
  {
    id: 'curie-remains', author: 'Marie Curie', source: 'Letter to her brother Józef (1894)',
    text: 'One never notices what has been done; one can only see what remains to be done.',
    themes: ['beat_cancer', 'patience'],
    lesson: 'A new medicine usually passes through three phases of clinical trials before approval, often over many years. Research companies live on that long timeline.',
  },
  {
    id: 'salk-hope', author: 'Jonas Salk', source: 'Address accepting the Nehru Award (1977)',
    text: 'Hope lies in dreams, in imagination and in the courage of those who dare to make dreams into reality.',
    themes: ['beat_cancer', 'live_healthier', 'purpose'],
    lesson: 'Biotech companies often spend for years before a product earns anything. That is why their share prices can swing on a single trial result.',
  },
  {
    id: 'salk-sun', author: 'Jonas Salk', source: "Asked who owned the polio vaccine's patent, See It Now, CBS (1955)",
    text: 'Well, the people, I would say. There is no patent. Could you patent the sun?',
    themes: ['live_healthier', 'beat_cancer', 'purpose'],
    lesson: 'A patent gives an inventor the sole right to sell an invention for a set time, often 20 years. Drug makers depend on patents, and on what happens when they expire.',
  },
  {
    id: 'pasteur-prepared', author: 'Louis Pasteur', source: 'Lecture at the University of Lille (1854)',
    text: 'In the fields of observation chance favours only the prepared mind.',
    themes: ['beat_cancer', 'learning', 'risk_high'],
    lesson: 'Understanding what a company does before its news arrives lets you judge the news calmly. Preparation turns surprises into information.',
  },
  {
    id: 'newton-giants', author: 'Isaac Newton', source: 'Letter to Robert Hooke (1676; spelling modernised)',
    text: 'If I have seen further it is by standing on the shoulders of Giants.',
    themes: ['beat_cancer', 'learning'],
    lesson: 'Much medical research is built on publicly funded science, which companies then turn into treatments. Progress is a relay, not a solo race.',
  },
  {
    id: 'hippocrates-art-long', author: 'Hippocrates', source: 'Aphorisms 1.1 (trans. Francis Adams, 1849)',
    text: 'Life is short, and Art long; the crisis fleeting; experience perilous, and decision difficult.',
    themes: ['live_healthier', 'learning', 'patience'],
    lesson: 'Healthcare spending tends to change slowly, because people need care in good times and bad. Investors call businesses like that defensive.',
  },
  {
    id: 'nightingale-nature', author: 'Florence Nightingale', source: 'Notes on Nursing (1860)',
    url: 'https://www.gutenberg.org/ebooks/12439',
    text: 'What nursing has to do in either case, is to put the patient in the best condition for nature to act upon him.',
    themes: ['live_healthier', 'mental_health'],
    lesson: 'Prevention, like clean air and early screening, often costs far less than treatment later. Some health companies build their whole business on that idea.',
  },
  {
    id: 'nightingale-apprehension', author: 'Florence Nightingale', source: 'Notes on Nursing (1860)',
    url: 'https://www.gutenberg.org/ebooks/12439',
    text: 'Apprehension, uncertainty, waiting, expectation, fear of surprise, do a patient more harm than any exertion.',
    themes: ['mental_health', 'live_healthier', 'risk_low'],
    lesson: 'Uncertainty is part of every investment, but a clear plan, such as how much you invest and for how long, takes much of the waiting and worry out of it.',
  },
  {
    id: 'feynman-fool', author: 'Richard Feynman', source: '"Cargo Cult Science", Caltech commencement address (1974)',
    text: 'The first principle is that you must not fool yourself — and you are the easiest person to fool.',
    themes: ['learning', 'risk_high', 'beginner'],
    lesson: 'Confirmation bias is the habit of noticing only what agrees with us. Reading the "things to know" about a company you like is a simple guard against it.',
  },
  {
    id: 'turing-short-distance', author: 'Alan Turing', source: '"Computing Machinery and Intelligence", Mind (1950)',
    text: 'We can only see a short distance ahead, but we can see plenty there that needs to be done.',
    themes: ['keeping_safe', 'learning', 'patience'],
    lesson: 'No one can forecast the market reliably, yet the problems companies are solving are plain to see. Following the work can be clearer than following the price.',
  },
  {
    id: 'darwin-endless-forms', author: 'Charles Darwin', source: 'On the Origin of Species (1859)',
    url: 'https://www.gutenberg.org/ebooks/1228',
    text: 'From so simple a beginning endless forms most beautiful and most wonderful have been, and are being, evolved.',
    themes: ['clean_food', 'beginner', 'patience'],
    lesson: 'Biodiversity, the variety of life, keeps farms resilient: varied crops and pollinators protect against a single pest or bad season. Investors call the same idea diversification.',
  },
  {
    id: 'sagan-pale-blue-dot', author: 'Carl Sagan', source: 'Pale Blue Dot (1994)',
    text: "To me, it underscores our responsibility to deal more kindly with one another, and to preserve and cherish the pale blue dot, the only home we've ever known.",
    themes: ['clean_energy', 'purpose'],
    lesson: 'Renewable energy comes from sources that refill, like sunlight and wind. Building it takes a lot of money up front, which is why investment plays such a large part.',
  },

  // Nature and the planet
  {
    id: 'muir-hitched', author: 'John Muir', source: 'My First Summer in the Sierra (1911)',
    url: 'https://www.gutenberg.org/ebooks/32540',
    text: 'When we try to pick out anything by itself, we find it hitched to everything else in the universe.',
    themes: ['clean_energy', 'clean_water', 'clean_food'],
    lesson: 'A supply chain is every step from raw material to finished product. A company is only as clean, or as safe, as its suppliers.',
  },
  {
    id: 'carson-strength', author: 'Rachel Carson', source: 'The Sense of Wonder (1965)',
    text: 'Those who contemplate the beauty of the earth find reserves of strength that will endure as long as life lasts.',
    themes: ['mental_health', 'clean_water', 'clean_energy'],
    lesson: "Rachel Carson's Silent Spring (1962) helped lead to the U.S. Environmental Protection Agency (EPA) in 1970. Rules like the ones it enforces shape whole industries.",
  },
  {
    id: 'carson-wonders', author: 'Rachel Carson', source: 'Speech (1954), in Lost Woods (1998)',
    text: 'The more clearly we can focus our attention on the wonders and realities of the universe about us, the less taste we shall have for destruction.',
    themes: ['clean_energy', 'clean_food', 'learning'],
    lesson: 'Companies are increasingly asked to report their environmental impact, such as greenhouse gas emissions. Clear numbers make it possible to compare claims.',
  },
  {
    id: 'maathai-consciousness', author: 'Wangari Maathai', source: 'Nobel Peace Prize lecture (2004)',
    url: 'https://www.nobelprize.org/prizes/peace/2004/maathai/lecture/',
    text: 'In the course of history, there comes a time when humanity is called to shift to a new level of consciousness, to reach a higher moral ground. A time when we have to shed our fear and give hope to each other. That time is now.',
    themes: ['clean_energy', 'purpose', 'mental_health'],
    lesson: 'Wangari Maathai started the Green Belt Movement, which has planted tens of millions of trees in Kenya. Big changes are often many small actions added together.',
  },
  {
    id: 'maathai-shift', author: 'Wangari Maathai', source: 'Nobel Peace Prize lecture (2004)',
    url: 'https://www.nobelprize.org/prizes/peace/2004/maathai/lecture/',
    text: 'Today we are faced with a challenge that calls for a shift in our thinking, so that humanity stops threatening its life-support system.',
    themes: ['clean_energy', 'clean_water'],
    lesson: 'The energy transition is the long shift from fossil fuels to cleaner sources. It touches power plants, grids, cars and buildings, so it spans many kinds of companies.',
  },
  {
    id: 'berry-agricultural-act', author: 'Wendell Berry', source: '"The Pleasures of Eating", in What Are People For? (1990)',
    text: 'Eating is an agricultural act.',
    themes: ['clean_food'],
    lesson: 'Food prices pass through many hands: farmers, processors, shippers and stores. Following that chain shows where a food company actually earns its money.',
  },
  {
    id: 'berry-care-earth', author: 'Wendell Berry', source: 'The Unsettling of America, chapter 7 (1977)',
    text: 'It is impossible to care for each other more or differently than we care for the earth.',
    themes: ['clean_food', 'clean_water', 'purpose'],
    lesson: 'Regenerative farming aims to rebuild soil rather than wear it out. Some food companies now measure soil health alongside sales.',
  },
  {
    id: 'pollan-eat-food', author: 'Michael Pollan', source: 'In Defense of Food (2008)',
    text: 'Eat food. Not too much. Mostly plants.',
    themes: ['clean_food', 'live_healthier'],
    lesson: 'Rules of thumb work in investing too: simple habits, kept for years, often matter more than clever moves made once.',
  },
  {
    id: 'auden-water', author: 'W. H. Auden', source: '"First Things First", in Homage to Clio (1960)',
    text: 'Thousands have lived without love, not one without water.',
    themes: ['clean_water'],
    lesson: 'Much of the water infrastructure in the U.S. is decades old, and replacing pipes and treatment plants is a long, costly job. That work is the business of many water companies.',
  },
  {
    id: 'franklin-well', author: 'Benjamin Franklin', source: "Poor Richard's Almanack (1746)",
    url: 'https://founders.archives.gov/documents/Franklin/01-03-02-0025',
    text: "When the Well's dry, we know the Worth of Water.",
    themes: ['clean_water', 'risk_low'],
    lesson: 'Scarcity pushes prices up: when something essential runs short, what people will pay for it rises. Economists call this supply and demand.',
  },

  // Safety
  {
    id: 'franklin-prevention', author: 'Benjamin Franklin', source: 'Pennsylvania Gazette, on protecting towns from fire (1735)',
    url: 'https://founders.archives.gov/documents/Franklin/01-02-02-0002',
    text: 'An Ounce of Prevention is worth a Pound of Cure.',
    themes: ['keeping_safe', 'live_healthier', 'risk_low'],
    lesson: "Franklin's fire letter led to Philadelphia's first volunteer fire company in 1736. Insurance and safety businesses still run on the same idea: preventing loss is cheaper than paying for it.",
  },
  {
    id: 'schneier-process', author: 'Bruce Schneier', source: 'Crypto-Gram newsletter (May 2000)',
    url: 'https://www.schneier.com/crypto-gram/archives/2000/0515.html',
    text: 'Security is a process, not a product.',
    themes: ['keeping_safe', 'patience'],
    lesson: 'Cybersecurity companies often sell subscriptions rather than one-time products, because threats keep changing. Repeat revenue like that is called recurring revenue.',
  },
  {
    id: 'shedd-ship', author: 'John A. Shedd', source: 'Salt from My Attic (1928)',
    text: 'A ship in harbor is safe, but that is not what ships are built for.',
    themes: ['risk_high', 'beginner', 'keeping_safe'],
    lesson: 'Every investment trades some safety for some chance of growth. Cash feels safe, but rising prices, called inflation, slowly shrink what it can buy.',
  },

  // Investing
  {
    id: 'graham-worst-enemy', author: 'Benjamin Graham', source: 'The Intelligent Investor, chapter 8 (1973 edition)',
    text: "The investor's chief problem — and even his worst enemy — is likely to be himself.",
    themes: ['risk_high', 'risk_low', 'mental_health'],
    lesson: 'Behavioral finance studies how emotions like fear and excitement steer money decisions. Swiping with your values, not the day\'s mood, is one way to keep them in check.',
  },
  {
    id: 'graham-margin', author: 'Benjamin Graham', source: 'The Intelligent Investor, chapter 20, "Margin of Safety" (1973 edition)',
    text: 'The margin of safety is always dependent on the price paid.',
    themes: ['risk_low', 'learning'],
    lesson: 'A margin of safety is the cushion between what you pay and what you believe something is worth. The same company can be a calm or a risky purchase depending on its price.',
  },
  {
    id: 'buffett-price-value', author: 'Warren Buffett, quoting Benjamin Graham', source: 'Berkshire Hathaway shareholder letter (2008)',
    url: 'https://www.berkshirehathaway.com/letters/2008ltr.pdf',
    text: 'Price is what you pay; value is what you get.',
    themes: ['learning', 'income', 'beginner'],
    lesson: "A share price is what the market will pay today. A company's value depends on what it can earn over many years, and the two can drift far apart.",
  },
  {
    id: 'frankl-freedom', author: 'Viktor Frankl', source: "Man's Search for Meaning (1946)",
    text: "Everything can be taken from a man but one thing: the last of the human freedoms — to choose one's attitude in any given set of circumstances, to choose one's own way.",
    themes: ['mental_health', 'risk_high', 'purpose'],
    lesson: 'Downturns are a normal part of investing, and how long recoveries take has varied widely, from months to many years. How you respond to a fall is a choice you can plan before it happens.',
  },
];

// Which quote themes each profile answer brings in
const RISK_THEME: Record<string, QuoteTheme> = { low: 'risk_low', medium: 'patience', high: 'risk_high' };
const GOAL_THEME: Record<string, QuoteTheme> = { growth: 'patience', income: 'income', short_term: 'risk_low', learning: 'learning' };

export interface QuoteContext {
  likedCauses: string[]; // the main cause of each company liked today (repeats count)
  causes: string[]; // the user's causes, in rank order
  risk?: string;
  goal?: string;
  experience?: string;
  date: string; // YYYY-MM-DD, so the choice is steady through the day and varies between days
}

// Stable small hash, to vary the choice between days among equally good quotes
const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7) >>> 0;

// Picks the best-fitting quote this person hasn't seen. Today's likes weigh most, then their own causes
// (by rank), then how they answered risk, goal and experience. When every quote has been seen, the
// ones seen longest ago come back first.
export function pickQuote(ctx: QuoteContext, seen: string[], quotes: Quote[] = QUOTES): Quote {
  const unseen = quotes.filter(q => !seen.includes(q.id));
  const pool = unseen.length ? unseen : quotes.filter(q => !seen.slice(-Math.floor(quotes.length / 2)).includes(q.id));
  const likeCounts = new Map<string, number>();
  for (const c of ctx.likedCauses) likeCounts.set(c, (likeCounts.get(c) ?? 0) + 1);
  const topLiked = [...likeCounts].sort((a, b) => b[1] - a[1])[0]?.[0];
  const profile = new Set<QuoteTheme>([
    ...(ctx.risk && RISK_THEME[ctx.risk] ? [RISK_THEME[ctx.risk]] : []),
    ...(ctx.goal && GOAL_THEME[ctx.goal] ? [GOAL_THEME[ctx.goal]] : []),
    ...(ctx.experience === 'never' || ctx.experience === 'few' ? ['beginner' as const] : []),
  ]);
  const score = (q: Quote) => {
    let s = 0;
    for (const t of q.themes) {
      if (t === topLiked) s += 4;
      else if (likeCounts.has(t)) s += 2;
      const rank = ctx.causes.indexOf(t);
      if (rank === 0) s += 1.5;
      else if (rank > 0) s += 1;
      if (profile.has(t)) s += 1;
    }
    return s;
  };
  return [...pool].sort((a, b) => score(b) - score(a) || hash(a.id + ctx.date) - hash(b.id + ctx.date))[0];
}

// The line tying the quote to the user's day
export function quoteTieIn(quote: Quote, likedCauses: string[], causeLabel: (id: string) => string | undefined): string {
  const n = likedCauses.length;
  if (n === 0) return 'You passed on every company today. Being choosy is part of investing with your values.';
  const companies = n === 1 ? 'company' : 'companies';
  const match = quote.themes.find(t => likedCauses.includes(t));
  const label = match && causeLabel(match);
  if (label) {
    const k = likedCauses.filter(c => c === match).length;
    return k === n ? `You liked ${n} ${companies} today, all working on ${label}.` : `You liked ${n} ${companies} today, ${k} of them working on ${label}.`;
  }
  return `You liked ${n} ${companies} today.`;
}
