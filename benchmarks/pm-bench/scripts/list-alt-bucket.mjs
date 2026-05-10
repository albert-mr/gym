// list-alt-bucket.mjs
// For a given date's gate1-pass, list every domain in the ALT bucket
// (sources requiring a Reputable alt because the binding host isn't directly renderable),
// counts of markets per domain, and the recommended alt source.
//
// Run:  node scripts/list-alt-bucket.mjs <date>   (e.g. 2026-05-09)

import fs from 'fs';

const STREAMING = new Set([
  'www.twitch.tv','kick.com','www.kick.com',
  'www.youtube.com','www.sooplive.com','play-origin.sooplive.com',
]);
const RENDER = new Set([
  'www.wunderground.com','gol.gg','liquipedia.net','www.uefa.com','en.khl.ru',
  'www.indiansuperleague.com','www.concacaf.com','www.mlssoccer.com','www.nwslsoccer.com',
  'www.nhl.com','www.euroleaguebasketball.net','www.vlr.gg','vlr.gg','apps.apple.com',
  'xtracker.polymarket.com','weather.gov','www.weather.gov','weather.gov.hk',
  'www.weather.gov.hk','www.cdc.gov','www.aec.gov.au','www.swpc.noaa.gov',
  'www.natesilver.net','www.pgatour.com','www.ufc.com','anera.markets',
  'earthquake.usgs.gov','www.the-numbers.com','data.giss.nasa.gov','www.tsa.gov',
  'portwatch.imf.org','www.acb.com','www.gettyimages.com.mx',
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
  }
  return host;
}

// Alt-source mapping. Production pipeline must use these URL patterns.
// SofaScore was deprecated as alt for ESPN-coverable leagues after 2026-05-09 Studio
// test confirmed sofascore.com returns HTTP 403 to GenLayer Studio's web.render IPs.
// Where ESPN coverage exists, prefer ESPN. Where it doesn't, mark STUDIO-BLOCKED.
const altMap = {
  'www.jleague.jp':'ESPN soccer jpn.1 (Studio-verified)',
  'www.bundesliga.com':'ESPN soccer ger.1 (Studio-verified)',
  'www.premierleague.com':'ESPN soccer eng.1 (Studio-verified)',
  'www.cbf.com.br':'Flashscore brazilian (Studio-verified)',
  'www.laliga.com':'ESPN soccer esp.1 (Studio-verified)',
  'www.fortunaliga.cz':'ESPN soccer cze.1 (rerouted from SofaScore)',
  'www.legaseriea.it':'Fox Sports per-match boxscore (Studio-verified)',
  'www.afa.com.ar':'ESPN soccer arg.1',
  'www.ligue2.fr':'ESPN soccer fra.2',
  'tff.org':'ESPN soccer tur.1 (rerouted from SofaScore)',
  'www.slstat.com':'ESPN soccer ksa.1',
  'liga1.pe':'ESPN soccer per.1',
  'lfpb.com.bo':'ESPN soccer bol.1',
  'www.efl.com':'Fox Sports per-match boxscore',
  'www.csl-china.com':'ESPN soccer chn.1 (rerouted from SofaScore)',
  'www.nba.com':'ESPN NBA scoreboard',
  'nikeliga.sk':'STUDIO-BLOCKED (SofaScore-only, no ESPN svk.1)',
  'www.lpf.ro':'ESPN soccer rou.1 (rerouted from SofaScore)',
  'dimayor.com.co':'ESPN soccer col.1',
  'ligamx.net':'ESPN soccer mex.1',
  'spfl.co.uk':'ESPN soccer sco.1',
  'premierliga.ru':'ESPN soccer rus.1 (rerouted from SofaScore)',
  'www.kleague.com':'STUDIO-BLOCKED (SofaScore-only, no ESPN kor.1)',
  'upl.ua':'STUDIO-BLOCKED (SofaScore-only, no ESPN ukr.1)',
  'www.eliteserien.no':'ESPN soccer nor.1 (rerouted from SofaScore)',
  'www.frmf.ma':'STUDIO-BLOCKED (SofaScore-only, no ESPN mar.1)',
  'www.unafut.com':'ESPN soccer crc.1',
  'hnl.hr':'STUDIO-BLOCKED (SofaScore-only, no ESPN cro.1)',
  'www.wnba.com':'ESPN WNBA scoreboard',
  'premierlacrosseleague.com':'ESPN PLL scoreboard',
  'www.legaserieb.it':'Fox Sports per-match boxscore',
};

const date = process.argv[2];
if (!date) { console.error('usage: node scripts/list-alt-bucket.mjs <date>'); process.exit(1); }

const lines = fs.readFileSync(`data/markets/${date}/gate1-pass.jsonl`,'utf-8').trim().split('\n');
const c = {};
for(const l of lines){
  try{
    const m = JSON.parse(l);
    const h = realBinding(m);
    if(!h) continue;
    if(RENDER.has(h)) continue;
    if(!ALT.has(h)) continue;
    c[h] = (c[h]||0)+1;
  }catch{}
}

const sorted = Object.entries(c).sort((a,b)=>b[1]-a[1]);
console.log('| domain | n | alt source needed |');
console.log('|---|---:|---|');
for(const [h,n] of sorted){
  console.log(`| ${h} | ${n} | ${altMap[h]||'unknown'} |`);
}
console.log(`\nTotal ALT bucket: ${sorted.reduce((s,[,n])=>s+n,0)} markets`);
