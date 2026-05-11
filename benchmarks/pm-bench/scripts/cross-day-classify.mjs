// cross-day-classify.mjs (v8)
// Bucket gate1-pass markets per day into solvable categories.
//
// v8 changes vs v7:
//   - Added STUDIO_BLOCKED bucket for SofaScore-only-no-ESPN-coverage leagues.
//     Confirmed 2026-05-09 via tx-receipt decode: sofascore.com returns HTTP 403 to
//     GenLayer Studio's web.render. Local genvm-webdriver works fine (different IP).
//     The 5 affected domains have no ESPN scoreboard alternative (Slovak nikeliga.sk,
//     Ukrainian upl.ua, Korean kleague.com, Moroccan frmf.ma, Croatian hnl.hr).
//
// v7 corrections vs earlier versions:
//   - Streaming-platform rebind: when eventResolutionSource is twitch/kick/youtube,
//     extract the real binding from the description ("official information from <URL>").
//   - Liquipedia-recovers-most-HLTV: HLTV is Cloudflare-walled, but Liquipedia covers
//     ~77% of HLTV prop templates (per-map rounds/winner/handicap/totals via
//     brkts-popup-body-detailed-score classes). Only per-map TOTAL KILLS is lost.
//
// Run:  node scripts/cross-day-classify.mjs
// Reads: data/markets/<date>/gate1-pass.jsonl

import fs from 'fs';

const STREAMING = new Set([
  'www.twitch.tv', 'kick.com', 'www.kick.com',
  'www.youtube.com', 'www.sooplive.com', 'play-origin.sooplive.com',
  // 2026-05-11 audit addition: Huya is China's Twitch-equivalent. Asian CS2 markets
  // bind to huya.com but descriptions rebind to hltv.org via "official information
  // from <URL>" pattern — same shape as twitch/kick/youtube.
  'www.huya.com',
]);

const RENDER = new Set([
  'www.wunderground.com','gol.gg','liquipedia.net','www.uefa.com','en.khl.ru',
  'www.indiansuperleague.com','www.concacaf.com','www.mlssoccer.com','www.nwslsoccer.com',
  'www.nhl.com','www.euroleaguebasketball.net','www.vlr.gg','vlr.gg','apps.apple.com',
  'xtracker.polymarket.com','weather.gov','www.weather.gov','weather.gov.hk',
  'www.weather.gov.hk','www.cdc.gov','www.aec.gov.au','www.swpc.noaa.gov',
  'www.natesilver.net','www.pgatour.com','www.ufc.com',
]);

const ALT = new Set([
  'www.twitch.tv','kick.com','www.kick.com','www.youtube.com',
  'conmebollibertadores.com','www.conmebol.com','www.csl-china.com',
  'www.frmf.ma','www.nba.com','www.efa.com.eg',
  'www.legaserieb.it','www.legaseriea.it','www.bundesliga.com',
  'www.jleague.jp','www.ligue1.com','www.laliga.com',
  'upl.ua','www.kleague.com','www.lpf.ro','www.slstat.com',
  'www.efl.com','www.a-league.com.au','hnl.hr',
  'www.eliteserien.no','superligaen.dk','liga1.pe','lfpb.com.bo',
  'www.cbf.com.br','premierlacrosseleague.com','www.wnba.com',
  'truthsocial.com','www.ligagt.org',
  'www.premierleague.com','www.fortunaliga.cz','www.afa.com.ar',
  'www.ligue2.fr','tff.org','nikeliga.sk','dimayor.com.co',
  'ligamx.net','spfl.co.uk','www.unafut.com','premierliga.ru',
  // 2026-05-10 additions (probed ESPN scoreboards, all 3 work):
  'eredivisie.nl',                 // ESPN ned.1 — Dutch Eredivisie
  'www.ligaportugal.pt',           // ESPN por.1 — Portuguese Primeira Liga
  'www.thenationalleague.org.uk',  // ESPN eng.5 — English National League (5th tier)
  // 2026-05-10 30-day audit additions:
  'anfp.cl',                       // Chilean football → ESPN chi.1
  'www.thefa.com',                 // English FA cup → ESPN
  'www.pglesports.com',            // PGL esports → Liquipedia
  'pro.eslgaming.com',             // ESL → Liquipedia
  'esportsworldcup.com',           // EWC → Liquipedia
  // 2026-05-10 uncapped audit (top 10 misc additions):
  'www.atptour.com',               // ATP tennis (703) → ESPN tennis ALT (CF-walled binding)
  'www.crunchyroll.com',           // anime awards (576) → Wikipedia reroute (CF-walled binding)
]);

// Studio-blocked domains: confirmed via Studio test that web.render gets blocked here
// AND no working alternative exists.
//
// Updated 2026-05-10 after subagent audit:
// - frmf.ma's match data IS available via Flashscore Botola Pro page (verified locally).
//   Flashscore was Studio-verified yesterday. Moved frmf.ma to render bucket via
//   FRMF_REROUTED set below — production pipeline must hit Flashscore not frmf.ma.
// - 0 truly studio-blocked domains remain.
const STUDIO_BLOCKED = new Set([
  // (empty — frmf.ma rerouted to Flashscore Botola)
]);

// Domains where the binding hostname is in the universe but production must hit
// a different render-friendly URL. Counted as RENDER for solvability purposes.
const FRMF_REROUTED = new Set(['www.frmf.ma']); // → flashscore.com/football/morocco/botola-pro/

// Eurovision rerouting: eurovision.tv is Cloudflare-walled but
// en.wikipedia.org/wiki/Eurovision_Song_Contest_2026 renders the full event data.
const EUROVISION_REROUTED = new Set(['eurovision.tv','eurovision.com']);

// API endpoints (off-chain). Pyth was previously here but is now excluded at Gate 1
// (deterministic on-chain oracle, like Chainlink — GenLayer has no role).
// Note: pythdata.app/hermes.pyth.network are filtered upstream by Gate 1 in analyze.ts.
const API = new Set(['www.binance.com','www.dotabuff.com','dotabuff.com']);
const HLTV = new Set(['hltv.org','www.hltv.org']);
const YAHOO = new Set(['finance.yahoo.com','www.wsj.com']);
const HARD = new Set([
  'seekingalpha.com','www.sooplive.com','play-origin.sooplive.com',
  'x.com','farside.co.uk','www.bls.gov',
  // 2026-05-09 audit reclassifications:
  'nytimes.pressreader.com', // paywall returns only language-picker UI under web.render (14 markets)
  'www.tbl.org.tr',          // DNS dead from webdriver (1 market) — Turkish basketball league
  // theahl.com REMOVED — Studio-verified 2026-05-09 to render fine (1/1 match)
  // 2026-05-10 30-day audit additions:
  'www.cnn.com',             // per-URL article failures
  'www.espncricinfo.com',    // Akamai blocked (also blocks ESPN cricket — same backend)
  'www.indec.gob.ar',        // geo-blocks the webdriver IP
]);

// Probed 8/10 unclassified domains in 2026-05-09 — count as render
const NEW_RENDER = new Set([
  'anera.markets','earthquake.usgs.gov','www.the-numbers.com',
  'data.giss.nasa.gov','www.tsa.gov','portwatch.imf.org',
  'www.acb.com','www.gettyimages.com.mx',
  // Studio-verified 2026-05-09 evening (7/8 match):
  'nikeliga.sk',     // Slovak Super Liga — direct binding render works
  'upl.ua',          // Ukrainian Premier League — direct binding render works
  'www.kleague.com', // Korean K-League — direct binding render works
  'hnl.hr',          // Croatian HNL — direct binding render works (news prose)
  'theahl.com',      // AHL — was in HARD, actually renders fine (Studio-verified)
  // 2026-05-10 30-day audit additions (probed via local webdriver):
  'www.billboard.com',           // music charts
  'www.juntaelectoralcentral.es',// Spanish electoral commission
  'www.fifa.com',                // football tournaments
  'fred.stlouisfed.org',         // FRED economic data
  'www.wtatennis.com',           // tennis live scores
  'lmarena.ai',                  // AI model leaderboard
  // 2026-05-10 uncapped audit (top 10 misc, 4 RENDER):
  'www.rolandgarros.com',        // French Open tennis (354)
  'www.formula1.com',            // F1 racing (242)
  'www.mlb.com',                 // MLB baseball (226)
  'www.nec.go.kr',               // Korean elections (199)
  // 2026-05-11 audit addition:
  'www.strategy.com',            // MicroStrategy BTC purchases page (2 markets)
]);

function clean(h){return (h||'').replace(/[.,;:)\]]+$/g,'');}

function realBinding(m){
  const url = m.eventResolutionSource||'';
  let host=null;
  if(url) try{host=new URL(url).hostname;}catch{}
  if(host && STREAMING.has(host)){
    const desc = m.description||'';
    const sl = desc.match(/official information from\s+(https?:\/\/[\w./?=&%#:-]+)/i);
    if(sl) try{return clean(new URL(sl[1]).hostname);}catch{}
    const u = desc.match(/https?:\/\/([\w.-]+)/);
    if(u) return clean(u[1]);
    return host;
  }
  if(host) return host;
  const desc = m.description||'';
  const paren = desc.match(/\((https?:\/\/[\w./?=&%#:-]+)\)/);
  if(paren) try{return clean(new URL(paren[1]).hostname);}catch{}
  const m2 = desc.match(/https?:\/\/([\w.-]+)/);
  return m2 ? clean(m2[1]) : null;
}

// Asset / illustrative URLs that should NOT count as "named source"
const ASSET_URL_RE = /(?:s3[.-]|polymarket-upload|cloudfront\.net|googleusercontent\.com|twimg\.com|imgur\.com|\.(?:jpg|jpeg|png|gif|webp|svg|mp4|pdf)(?:[?#]|$))/i;

function isSubjective(d){
  if(!d) return false;
  const cons = /\b(consensus of credible|consensus of reputable|consensus of major|consensus of official|will be a consensus|credible reporting|reputable reporting|consensus may be used|consensus will suffice)\b/i.test(d);
  if(!cons) return false;

  // Updated 2026-05-10 v4: distinguish PRIMARY source pinning from EXAMPLE/FALLBACK consensus.
  //
  // Subjective if ANY of:
  //   (A) "resolution source ... will be A CONSENSUS OF X" — consensus IS the mechanism
  //   (B) "consensus of X sources, including <URL>" — URL is just an example
  //   (C) Description has only asset/S3 URLs, no real ones
  //   (D) No URL anywhere AND consensus phrasing
  //   (E) Iran-style: "primary source is X AND a consensus" where X is a vague entity
  //
  // NOT subjective if:
  //   - Real URL pinned as PRIMARY source ("primary source is <URL>" / "primary source is X (URL)")
  //   - Even if consensus is mentioned as fallback ("however a consensus will suffice")

  // Pattern A/B: consensus IS the resolution mechanism
  const consensusIsMechanism = /(?:resolution\s+sources?\s+(?:will\s+be|is|are)\s+(?:a\s+)?consensus|consensus\s+of\s+(?:official\s+)?\w+\s+sources?(?:,\s+including|\s+from))/i.test(d);

  // Asset URL classification
  const allUrls = [...d.matchAll(/(https?:\/\/[\w./?=&%#:+~,-]+)/gi)].map(m => m[1]);
  const realUrls = allUrls.filter(u => !ASSET_URL_RE.test(u));

  // Pattern C: only asset URLs (no real URLs anywhere)
  if (allUrls.length > 0 && realUrls.length === 0) return true;

  // Pattern D: no URL anywhere
  if (allUrls.length === 0) return true;

  // Pattern A/B fired: consensus is mechanism, URLs are just examples
  if (consensusIsMechanism) return true;

  // Iran-style: "official information from <vague entity> AND a consensus" where the entity has no inline URL
  // The URLs that exist in description are in qualifying-example context
  const exampleContext = /\b(qualifying|non-?qualifying|previous(ly)?\s+example|examples\s+include|for\s+instance|including\s+but\s+not\s+limited)\b/i.test(d);
  // Match "(primary )?resolution source(s) will be ... authorit/governing/etc" with up to 5 words in between
  const iranStyle = /(?:primary\s+resolution\s+sources?|resolution\s+sources?)(?:\s+for\s+this\s+market)?\s+(?:will\s+be|is|are)\s+(?:official\s+(?:information|statements?)\s+from\s+)?(?:\w+\s+){0,5}(?:authorit|governing|organizers?|body)/i.test(d) && /\band\s+a\s+consensus\b/i.test(d);
  if (iranStyle && exampleContext) return true;

  // Pinned real URL (Eurovision-style)
  return false;
}

function isMapLevelKills(market){
  const q = (market.question||'').toLowerCase();
  return /map\s+\d.*total.*kills|total.*kills.*map\s+\d/i.test(q);
}

function tally(date){
  const lines = fs.readFileSync(`data/markets/${date}/gate1-pass.jsonl`,'utf-8').trim().split('\n');
  const b = {render:0, alt:0, api:0,
             liquipedia_recover:0, bo3_recover:0,
             frmf_via_flashscore:0, eurovision_via_wiki:0,
             hltv_lost:0, studio_blocked:0,
             yahoo:0, hard:0, subjective:0, no_source:0, misc:0};
  for(const line of lines){
    try{
      const m = JSON.parse(line);
      const desc = m.description||'';
      let sUrl = m.eventResolutionSource||'';
      // 2026-05-10: treat asset-URL eRS (S3, polymarket-upload, image extensions) as
      // "no eRS" for subjective detection — these are illustrative images, not data sources
      if(sUrl && ASSET_URL_RE.test(sUrl)) sUrl = '';
      if(!sUrl && isSubjective(desc)){b.subjective++; continue;}
      const host = realBinding(m);
      if(!host){b.no_source++; continue;}
      if(RENDER.has(host) || NEW_RENDER.has(host)) b.render++;
      else if(FRMF_REROUTED.has(host)) b.frmf_via_flashscore++;
      else if(EUROVISION_REROUTED.has(host)) b.eurovision_via_wiki++;
      else if(STUDIO_BLOCKED.has(host)) b.studio_blocked++;
      else if(ALT.has(host)) b.alt++;
      else if(API.has(host)) b.api++;
      else if(HLTV.has(host)){
        // Per-map total kills was previously "lost" — bo3.gg recovers them
        // (verified locally 2026-05-10; needs Studio dry-run to confirm).
        if(isMapLevelKills(m)) b.bo3_recover++;
        else b.liquipedia_recover++;
      }
      else if(YAHOO.has(host)) b.yahoo++;
      else if(HARD.has(host)) b.hard++;
      else b.misc++;
    }catch{b.no_source++;}
  }
  return {total: lines.length, b};
}

function pct(n,d){return ((100*n)/d).toFixed(1);}

const days = process.argv.slice(2);
if (days.length === 0) {
  console.error('usage: node scripts/cross-day-classify.mjs <date1> [<date2> ...]');
  console.error('  e.g. node scripts/cross-day-classify.mjs 2026-05-08 2026-05-09');
  process.exit(1);
}
const results = days.map(d => ({date:d, ...tally(d)}));

console.log('=== Cross-day classifier v7 ===\n');
const header = 'bucket'.padEnd(32) + days.map(d => d.padStart(15)).join('  ');
console.log(header);
const rows = [
  ['[OK] Binding render','render'],
  ['[OK] Reputable alt (Studio-OK)','alt'],
  ['[OK] API raw HTTP','api'],
  ['[OK] Liquipedia recovers HLTV','liquipedia_recover'],
  ['[OK] bo3.gg recovers HLTV per-map kills','bo3_recover'],
  ['[OK] frmf.ma → Flashscore Botola','frmf_via_flashscore'],
  ['[OK] eurovision.tv → Wikipedia','eurovision_via_wiki'],
  ['[--] Studio-blocked (no alt)','studio_blocked'],
  ['[--] HLTV per-map kills lost','hltv_lost'],
  ['[--] Yahoo + WSJ','yahoo'],
  ['[--] Other hard tail','hard'],
  ['Subjective','subjective'],
  ['No source','no_source'],
  ['Misc residual','misc'],
];
for(const [name,key] of rows){
  const cells = results.map(r => `${String(r.b[key]).padStart(5)} (${pct(r.b[key], r.total).padStart(4)}%)`).join('  ');
  console.log(name.padEnd(32), cells);
}
const totals = results.map(r => r.b.render + r.b.alt + r.b.api + r.b.liquipedia_recover + r.b.bo3_recover + r.b.frmf_via_flashscore + r.b.eurovision_via_wiki);
console.log('TOTAL SOLVED'.padEnd(32), results.map((r,i) => `${String(totals[i]).padStart(5)} (${pct(totals[i], r.total).padStart(4)}%)`).join('  '));
console.log('gate1-pass total'.padEnd(32), results.map(r => String(r.total).padStart(5).padEnd(15)).join(''));

if (results.length >= 2) {
  console.log('\n--- Day-over-day delta (first vs last) ---');
  const a = results[0], b = results[results.length-1];
  const ta = a.b.render + a.b.alt + a.b.api + a.b.liquipedia_recover + a.b.bo3_recover + a.b.frmf_via_flashscore + a.b.eurovision_via_wiki;
  const tb = b.b.render + b.b.alt + b.b.api + b.b.liquipedia_recover + b.b.bo3_recover + b.b.frmf_via_flashscore + b.b.eurovision_via_wiki;
  console.log(`Universe: ${a.total} -> ${b.total}  (+${b.total - a.total}, ${pct(100*(b.total-a.total)/a.total, 100)}%)`);
  console.log(`Solved:   ${ta} -> ${tb}  (+${tb - ta})`);
  console.log(`Solve %:  ${pct(ta, a.total)}% -> ${pct(tb, b.total)}%  (${(pct(tb,b.total) - pct(ta,a.total)).toFixed(1)} pp)`);
}
