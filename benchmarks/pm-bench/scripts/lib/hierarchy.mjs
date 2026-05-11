// hierarchy.mjs
// Derives a 3-level category path (L1/L2/L3) for a polled market from its tags[]
// array, plus a template signature for the leaf row.

// L1 top categories — order matters: first match wins. Esports first so it beats Sports
// (esports markets often carry both 'esports' and 'sports' tags).
const L1_RULES = [
  { name: 'Esports',        tags: ['esports', 'league-of-legends', 'counter-strike-2', 'counter-strike', 'dota-2', 'valorant', 'mobile-legends-bang-bang', 'overwatch', 'rainbow-six', 'starcraft', 'starcraft-2', 'rocket-league', 'call-of-duty', 'honor-of-kings', 'apex-legends', 'pubg', 'fortnite'] },
  { name: 'Crypto',         tags: ['crypto', 'crypto-prices', 'bitcoin', 'ethereum', 'solana', 'ripple', 'xrp', 'dogecoin', 'cardano', 'avalanche', 'polkadot', 'chainlink-token', 'hit-price'] },
  { name: 'Weather',        tags: ['weather', 'lowest-temperature', 'highest-temperature', 'temperature', 'hurricane', 'snowfall', 'tornado', 'wildfire'] },
  { name: 'Politics',       tags: ['politics', 'trump', 'biden', 'election', 'congress', 'senate', 'parliament', 'us-politics'] },
  { name: 'Entertainment',  tags: ['pop-culture', 'box-office', 'movies', 'tv', 'eurovision', 'awards', 'music'] },
  { name: 'Economy',        tags: ['economics', 'fed', 'inflation', 'rates', 'equities', 'stocks', 'banking'] },
  { name: 'Sports',         tags: ['sports', 'soccer', 'nba', 'nfl', 'mlb', 'nhl', 'tennis', 'golf', 'ufc', 'boxing', 'cricket', 'rugby', 'wnba', 'efl', 'premier-league', 'la-liga', 'bundesliga', 'serie-a', 'ligue-1', 'mlssoccer'] },
];

// L2 by L1: which tags indicate the sport/asset within the L1 category
const L2_BY_L1 = {
  Sports: {
    Soccer:     ['soccer'],
    Basketball: ['nba', 'wnba', 'basketball'],
    Football:   ['nfl'],
    Baseball:   ['mlb', 'baseball'],
    Hockey:     ['nhl', 'hockey'],
    Tennis:     ['tennis', 'atp', 'wta'],
    Golf:       ['golf', 'pga', 'pgatour'],
    MMA:        ['ufc', 'mma'],
    Cricket:    ['cricket'],
    Rugby:      ['rugby'],
  },
  Esports: {
    'League of Legends':    ['league-of-legends'],
    'Counter-Strike 2':     ['counter-strike-2', 'counter-strike'],
    'Dota 2':               ['dota-2'],
    'Valorant':             ['valorant'],
    'Mobile Legends':       ['mobile-legends-bang-bang'],
    'Overwatch':            ['overwatch'],
    'Rainbow Six':          ['rainbow-six'],
    'StarCraft':            ['starcraft', 'starcraft-2'],
    'Rocket League':        ['rocket-league'],
    'Call of Duty':         ['call-of-duty'],
    'Honor of Kings':       ['honor-of-kings'],
    'Apex Legends':         ['apex-legends'],
    'PUBG':                 ['pubg'],
    'Fortnite':             ['fortnite'],
  },
  Crypto: {
    Bitcoin:        ['bitcoin'],
    Ethereum:       ['ethereum'],
    Solana:         ['solana'],
    XRP:            ['xrp', 'ripple'],
    Dogecoin:       ['dogecoin'],
    Cardano:        ['cardano'],
    Avalanche:      ['avalanche'],
    Polkadot:       ['polkadot'],
    Chainlink:      ['chainlink-token'],
    'Other crypto': ['crypto-prices'],
  },
  Weather: {
    'Lowest temperature':  ['lowest-temperature'],
    'Highest temperature': ['highest-temperature'],
    'Temperature':         ['temperature', 'daily-temperature'],
    'Hurricane':           ['hurricane'],
    'Snowfall':            ['snowfall'],
    'Tornado':             ['tornado'],
    'Wildfire':            ['wildfire'],
  },
  Politics: {
    'US politics':        ['trump', 'biden', 'us-politics'],
    'Elections':          ['election'],
    'Legislature':        ['congress', 'senate', 'parliament'],
  },
  Entertainment: {
    'Box office':         ['box-office'],
    'Eurovision':         ['eurovision'],
    'Awards':             ['awards'],
    'Pop culture':        ['pop-culture'],
    'Movies':             ['movies'],
    'Music':              ['music'],
  },
  Economy: {
    'Fed / rates':        ['fed', 'rates', 'inflation'],
    'Equities':           ['equities', 'stocks'],
    'Banking':            ['banking'],
  },
};

// L3 by L1+L2 — region/league/period. Uses Polymarket's actual tag vocabulary.
const L3_SOCCER_REGIONS = {
  'La Liga (esp)':                  ['la-liga', 'esp'],
  'La Liga 2 / Hypermotion':        ['la-liga-2'],
  'Premier League (eng)':           ['premier-league', 'EPL', 'eng'],
  'Bundesliga (ger)':               ['bundesliga', 'ger'],
  'Serie A (ita)':                  ['serie-a', 'ita'],
  'Serie B (ita)':                  ['serie-b'],
  'Ligue 1 (fra)':                  ['ligue-1', 'fra'],
  'Ligue 2 (fra)':                  ['ligue-2'],
  'Russian Premier League':         ['rus'],
  'MLS (usa)':                      ['mls', 'mlssoccer', 'usa'],
  'NWSL':                           ['soccer-nwsl'],
  'Eredivisie (ned)':               ['ere', 'eredivisie', 'ned'],
  'Primeira Liga (por)':            ['primeira-liga', 'por'],
  'Chinese Super League (chn)':     ['csl-china', 'chinese-super-league', 'chn'],
  'Brazilian Serie A':              ['brazil-serie-a', 'bra'],
  'Argentinian (arg)':              ['arg'],
  'Liga MX (mex)':                  ['mex'],
  'J-League (jpn)':                 ['j-league', 'j1-league', 'jpn'],
  'K-League (kor)':                 ['kleague', 'kor'],
  'Ukrainian Premier Liha':         ['ukraine-premier-liha', 'ukr'],
  'Slovak Super Liga':              ['soccer-svk1', 'svk'],
  'Croatian HNL':                   ['soccer-hr1', 'cro'],
  'Moroccan Botola':                ['mar'],
  'Norwegian Eliteserien':          ['norway-eliteserien'],
  'Danish Superliga':               ['denmark-superliga'],
  'Romanian Liga 1':                ['romania-liga-1'],
  'Saudi Pro League':               ['saudi-professional-league'],
  'Czech Fortuna Liga':             ['czech-fortuna-liga'],
  'EFL Championship':               ['soccer-el1', 'efl-championship'],
  'EFL League 2':                   ['soccer-el2'],
  'English National League':        ['national-league'],
  'Indian Super League':            ['indian-super-league'],
  'Guatemalan Liga Nacional':       ['soccer-gtm', 'guatemala'],
  'Costa Rican Primera':            ['soccer-fpd', 'costa-rica'],
  'Peruvian Liga 1':                ['peru-liga-1'],
  'Bolivian LFPB':                  ['lfpb'],
  'Scottish Premiership':           ['spfl'],
  'Australian A-League':            ['a-league', 'australia'],
  'Turkish Super Lig':              ['tff', 'super-lig', 'turkey'],
  'Conmebol Libertadores':          ['conmebol', 'libertadores'],
  'Egyptian Premier League':        ['efa', 'egypt-premier-league'],
  'SEA Asian leagues':              ['sea'],
  'UEFA':                           ['uefa', 'champions-league', 'europa-league'],
  'Concacaf':                       ['concacaf'],
};

// Soccer host → league fallback (when tags don't pin it).
const SOCCER_HOST_TO_LEAGUE = {
  'www.laliga.com':            'La Liga (esp)',
  'www.premierleague.com':     'Premier League (eng)',
  'www.bundesliga.com':        'Bundesliga (ger)',
  'www.legaseriea.it':         'Serie A (ita)',
  'www.legaserieb.it':         'Serie B (ita)',
  'www.ligue1.com':            'Ligue 1 (fra)',
  'www.ligue2.fr':             'Ligue 2 (fra)',
  'premierliga.ru':            'Russian Premier League',
  'www.mlssoccer.com':         'MLS (usa)',
  'www.nwslsoccer.com':        'NWSL',
  'eredivisie.nl':             'Eredivisie (ned)',
  'www.ligaportugal.pt':       'Primeira Liga (por)',
  'www.csl-china.com':         'Chinese Super League (chn)',
  'www.cbf.com.br':            'Brazilian Serie A',
  'www.afa.com.ar':            'Argentinian (arg)',
  'ligamx.net':                'Liga MX (mex)',
  'www.jleague.jp':            'J-League (jpn)',
  'www.kleague.com':           'K-League (kor)',
  'upl.ua':                    'Ukrainian Premier Liha',
  'nikeliga.sk':               'Slovak Super Liga',
  'hnl.hr':                    'Croatian HNL',
  'www.frmf.ma':               'Moroccan Botola',
  'www.eliteserien.no':        'Norwegian Eliteserien',
  'superligaen.dk':            'Danish Superliga',
  'www.lpf.ro':                'Romanian Liga 1',
  'www.efl.com':               'EFL Championship',
  'www.thenationalleague.org.uk': 'English National League',
  'www.indiansuperleague.com': 'Indian Super League',
  'www.ligagt.org':            'Guatemalan Liga Nacional',
  'www.fortunaliga.cz':        'Czech Fortuna Liga',
  'liga1.pe':                  'Peruvian Liga 1',
  'lfpb.com.bo':               'Bolivian LFPB',
  'spfl.co.uk':                'Scottish Premiership',
  'www.a-league.com.au':       'Australian A-League',
  'tff.org':                   'Turkish Super Lig',
  'conmebollibertadores.com':  'Conmebol Libertadores',
  'www.conmebol.com':          'Conmebol',
  'www.concacaf.com':          'Concacaf',
  'www.uefa.com':              'UEFA',
  'www.efa.com.eg':            'Egyptian Premier League',
  'anfp.cl':                   'Chilean Primera',
  'dimayor.com.co':            'Colombian Liga BetPlay',
  'www.unafut.com':            'Costa Rican Primera',
  'www.slstat.com':            'Sri Lankan football',
  'www.thefa.com':             'English FA',
  'www.thenationalleague.org.uk': 'English National League',
};

const L3_CRYPTO_PERIODS = {
  '15-minute':  ['15M'],
  '1-hour':     ['1H'],
  '4-hour':     ['4H'],
  'Daily':      ['daily'],
  'Weekly':     ['weekly'],
  'Monthly':    ['monthly'],
};

function tagSet(tags) {
  const s = new Set();
  for (const t of (tags || [])) s.add(String(t).toLowerCase());
  return s;
}

function findFirstMatching(tags, mapping) {
  const set = tagSet(tags);
  for (const [name, candidates] of Object.entries(mapping)) {
    for (const c of candidates) {
      if (set.has(String(c).toLowerCase())) return name;
    }
  }
  return null;
}

export function deriveL1(tags) {
  const set = tagSet(tags);
  for (const rule of L1_RULES) {
    for (const t of rule.tags) {
      if (set.has(String(t).toLowerCase())) return rule.name;
    }
  }
  return 'Other';
}

export function deriveL2(L1, tags) {
  const mapping = L2_BY_L1[L1];
  if (!mapping) return 'Other';
  return findFirstMatching(tags, mapping) ?? 'Other';
}

export function deriveL3(L1, L2, tags, eventResolutionSource) {
  if (L1 === 'Sports' && L2 === 'Soccer') {
    const byTag = findFirstMatching(tags, L3_SOCCER_REGIONS);
    if (byTag) return byTag;
    // Fallback: derive from eventResolutionSource host
    try {
      const h = eventResolutionSource ? new URL(eventResolutionSource).hostname : null;
      if (h && SOCCER_HOST_TO_LEAGUE[h]) return SOCCER_HOST_TO_LEAGUE[h];
    } catch {}
    return 'Other soccer';
  }
  if (L1 === 'Crypto') {
    const period = findFirstMatching(tags, L3_CRYPTO_PERIODS);
    const set = tagSet(tags);
    const kind = set.has('up-or-down') ? 'Up/Down' : set.has('multi-strikes') ? 'Multi-strike' : set.has('hit-price') ? 'Hit-price' : null;
    if (period && kind) return `${period} ${kind}`;
    if (period) return period;
    if (kind) return kind;
  }
  if (L1 === 'Weather') {
    // pull city tag if present (london, paris, ny, etc.) — tag list isn't enumerated, but
    // weather markets always include a city tag and a metric tag
    const set = tagSet(tags);
    // Common city tag pattern: short lowercase word, not in our known L1/L2 vocab
    const knownNoise = new Set(['weather','recurring','hide-from-new','daily-temperature','lowest-temperature','highest-temperature','sports','games']);
    const candidates = [...set].filter(t => !knownNoise.has(t) && !t.startsWith('rewards-') && !t.includes('-'));
    if (candidates.length > 0) return candidates[0].charAt(0).toUpperCase() + candidates[0].slice(1);
  }
  if (L1 === 'Esports') {
    // tournament/region — best-effort via eventTitle suffix; tags rarely carry it
    return 'All tournaments';
  }
  return 'All';
}

export function deriveHierarchy(market, fallbackKindCategorizer) {
  const tags = market.tags ?? [];
  let L1 = deriveL1(tags);
  if (L1 === 'Other' && typeof fallbackKindCategorizer === 'function') {
    const k = fallbackKindCategorizer(market);
    // Map MarketKind back to L1
    const KIND_TO_L1 = {
      crypto_price_feed: 'Crypto',
      stock_or_finance: 'Economy',
      weather_forecast: 'Weather',
      esports_match: 'Esports',
      sports_match: 'Sports',
      streamer_or_view_count: 'Other',
      election_political: 'Politics',
      policy_political: 'Politics',
      news_or_other: 'Other',
    };
    L1 = KIND_TO_L1[k] ?? 'Other';
  }
  const L2 = deriveL2(L1, tags);
  const L3 = deriveL3(L1, L2, tags, market.eventResolutionSource ?? null);
  return { L1, L2, L3 };
}

// =============================================================================
// Template detection
// =============================================================================
// Replace entities in `question` with placeholders so equivalent markets collapse
// to a single template signature. The example market within a template preserves
// the original question.

const MONTH_RE = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2}(?:,?\s+\d{4})?\b/g;
const ISODATE_RE = /\b\d{4}-\d{2}-\d{2}\b/g;
const SLASHDATE_RE = /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g;
const TIME_RE = /\b\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)(?:\s+ET|\s+UTC|\s+EST|\s+PST)?\b/g;
const SPREAD_RE = /\(\s*[-+]?\d+(?:\.\d+)?\s*\)/g;
const PCT_RE = /\b\d{1,3}(?:\.\d+)?\s*%/g;
const PRICE_RE = /\$\d{1,3}(?:,\d{3})*(?:\.\d+)?(?:[MBK])?\b/g;
const NUM_DEC_RE = /\b\d+\.\d+\b/g;
const NUM_LARGE_RE = /\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g;
const NUM_PLAIN_RE = /\b\d{2,}\b/g;
const DEGREE_RE = /-?\d+(?:\.\d+)?\s*°?[CF]\b/g;

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ENUM_OUTCOMES = new Set(['Yes', 'No', 'Up', 'Down', 'Over', 'Under']);

export function deriveTemplate(question, outcomes, eventTitle) {
  if (!question) return '<empty>';
  let q = question.trim();

  // Collect candidate team/entity names to replace with <TEAM>:
  //   - prefer outcomes[] when non-enum (avoids over-matching event title prefixes like "Honor of Kings:")
  //   - fall back to eventTitle split on " vs " only when outcomes are Yes/No-style enums
  const teams = new Set();
  let hasNamedOutcomes = false;
  if (Array.isArray(outcomes)) {
    for (const o of outcomes) {
      if (typeof o === 'string' && o.length > 0 && !ENUM_OUTCOMES.has(o)) {
        teams.add(o);
        hasNamedOutcomes = true;
      }
    }
  }
  if (!hasNamedOutcomes && typeof eventTitle === 'string') {
    // Strip an optional leading "<league/game>:" prefix before splitting, so we don't
    // capture it as part of the team name (e.g. "Counter-Strike: TeamA vs TeamB").
    const titleBody = eventTitle.replace(/^[A-Za-z][A-Za-z0-9 .'’/&-]{0,30}:\s*/, '');
    const m = titleBody.match(/^(.+?)\s+vs\.?\s+(.+?)(?:\s+[-—]\s.*)?$/i);
    if (m) { teams.add(m[1].trim()); teams.add(m[2].trim()); }
  }

  // Sort longest-first so substrings don't pre-empt longer matches
  const sorted = [...teams].sort((a, b) => b.length - a.length);
  for (const name of sorted) {
    if (name.length < 2) continue;
    const re = new RegExp(escapeRegex(name), 'gi');
    q = q.replace(re, '<TEAM>');
  }

  // Replace dates/times/numbers
  q = q.replace(MONTH_RE, '<DATE>');
  q = q.replace(ISODATE_RE, '<DATE>');
  q = q.replace(SLASHDATE_RE, '<DATE>');
  q = q.replace(TIME_RE, '<TIME>');
  q = q.replace(DEGREE_RE, '<TEMP>');
  q = q.replace(SPREAD_RE, '(<N>)');
  q = q.replace(PCT_RE, '<PCT>');
  q = q.replace(PRICE_RE, '<PRICE>');
  q = q.replace(NUM_LARGE_RE, '<NUM>');
  q = q.replace(NUM_DEC_RE, '<NUM>');
  q = q.replace(NUM_PLAIN_RE, '<NUM>');

  // Normalize whitespace
  q = q.replace(/\s+/g, ' ').trim();
  return q;
}
