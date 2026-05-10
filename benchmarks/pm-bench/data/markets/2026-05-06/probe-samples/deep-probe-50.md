# Deep-URL probe — 50 markets across 35 domains

Generated 2026-05-07 against local genvm-webdriver `http://127.0.0.1:4444`.
Source sample: `data/markets/2026-05-06/probe-samples/by-domain-50.jsonl` (round-robin one-per-domain across yesterday's + today's gate1-pass).
Deep URLs found by 5 parallel discovery subagents using WebSearch.
`ans?` = at least 2 of the answer keywords appear in the rendered body.

| # | id | class | http | kw | bytes | ans? | strategy | deep URL | raw URL
|--:|---|---|--:|--|--:|:--:|---|---|---
| 1 | 1921691 | http-4xx | 404 | 0/6 | 1703 | no | alternate-source | https://www.sofascore.com/football/match/wuhan-three-towns-qingdao-hainiu/zsbsfgdb | https://www.csl-china.com/
| 2 | 2155379 | empty | 200 | 1/6 | 84 | no | alternate-source | https://coinmarketcap.com/currencies/bitcoin/historical-data/ | https://www.binance.com/en/trade/BTC_USDT
| 3 | 2152379 | empty | 200 | 2/6 | 675 | **yes** | same-as-raw | https://www.wunderground.com/history/daily/gb/london/EGLC/date/2026-5-6 | https://www.wunderground.com/history/daily/gb/london/EGLC
| 4 | 2169936 | ok | 200 | 4/5 | 4069 | **yes** | description-named | https://liquipedia.net/dota2/EPL/World_Series/Southeast_Asia/15 | https://kick.com/epldota_en1
| 5 | 2062013 | http-4xx | 403 | 0/6 | 19 | no | news-article | https://www.stocktitan.net/news/CVS/cvs-health-corporation-reports-strong-first-quarter-2026-results-and-0fkudo24bmkt.html | https://seekingalpha.com/
| 6 | 2171729 | ok | 200 | 6/6 | 5393 | **yes** | description-named | https://liquipedia.net/overwatch/Overwatch_Champions_Series/2026/Asia/Stage_1 | https://www.twitch.tv/ow_esports
| 7 | 1921436 | ok | 200 | 6/6 | 6626 | **yes** | news-article | https://www.indiansuperleague.com/news/late-own-goal-hands-punjab-fc-a-narrow-win-against-chennaiyin-fc | https://www.indiansuperleague.com/
| 8 | 2168044 | ok | 200 | 4/5 | 5255 | **yes** | tournament-stats | https://liquipedia.net/leagueoflegends/Esports_World_Cup/2026/APAC | https://gol.gg/esports/home
| 9 | 2154132 | ok | 200 | 6/6 | 4543 | **yes** | description-named | https://liquipedia.net/starcraft2/Global_StarCraft_II_League/2026/Season_1 | https://www.sooplive.com/station/afgsl
| 10 | 2109639 | ok | 200 | 6/6 | 1861 | **yes** | news-article | https://m.elbotola.com/en/article/2026-05-06-17-46-61.html | https://www.frmf.ma/
| 11 | 2140899 | empty | 200 | 0/6 | 0 | no | description-named | https://xtracker.polymarket.com/user/elonmusk | https://x.com/elonmusk
| 12 | 2166262 | ok | 200 | 5/6 | 7390 | **yes** | news-article | https://en.khl.ru/news/2026/05/06/562313.html | https://en.khl.ru/calendar/
| 13 | 2125225 | ok | 200 | 3/6 | 3274 | **yes** | match-page | https://www.euroleaguebasketball.net/el/euroleague/game-center/2025-26/zalgiris-kaunas-fenerbahce-beko-istanbul/E2025/393/ | https://www.euroleaguebasketball.net/euroleague/
| 14 | 2164754 | http-4xx | 403 | 0/6 | 0 | no | match-page | https://www.dotabuff.com/esports/series/2847520-z10-vs-nmss | https://www.dotabuff.com
| 15 | 2061882 | empty | 200 | 1/6 | 228 | no | match-page | https://www.uefa.com/uefachampionsleague/match/2048073--bayern-munchen-vs-paris/ | https://www.uefa.com/
| 16 | 2164980 | http-4xx | 401 | 0/6 | 0 | no | description-named | https://www.wsj.com/market-data/quotes/index/SPX/historical-prices | https://www.wsj.com/market-data/stocks
| 17 | 2164983 | ok | 200 | 0/6 | 1635 | no | same-as-raw | https://finance.yahoo.com/quote/AAPL/history/ | https://finance.yahoo.com/quote/AAPL/history
| 18 | 2164984 | empty | 200 | 0/6 | 0 | no | same-as-raw | https://pythdata.app/explore/Equity.US.SPY%2FUSD | https://pythdata.app/explore/Equity.US.SPY%2FUSD
| 19 | 2172181 | http-4xx | 403 | 0/6 | 0 | no | description-named | https://www.hltv.org/matches/2394016/aab-vs-genone-bc-game-masters-europe-season-2-series-1 | https://www.kick.com/bcgamemasters
| 20 | 2173102 | http-4xx | 403 | 0/5 | 0 | no | tournament-stats | https://www.hltv.org/team/13594/cybershoke-prospects | https://hltv.org
| 21 | 2164439 | ok | 200 | 5/6 | 7994 | **yes** | alternate-source | https://emisorasunidas.com/deportes/2026/05/06/resultado-mixco-vs-municipal-semifinales-del-clausura-2026/ | https://www.ligagt.org/
| 22 | 2170162 | ok | 200 | 6/6 | 2210 | **yes** | tournament-stats | https://liquipedia.net/mobilelegends/BetBoom_Rise_of_Legends/Season_10/1st_Division | https://liquipedia.net/mobilelegends/Main_Page
| 23 | 1928211 | ok | 200 | 4/6 | 3323 | **yes** | alternate-source | https://www.espn.com/soccer/match/_/gameId/401865520/estudiantes-de-la-plata-cusco-fc | https://conmebollibertadores.com/
| 24 | 1929493 | ok | 200 | 5/6 | 3424 | **yes** | alternate-source | https://www.espn.com/soccer/match/_/gameId/401865423/vasco-da-gama-audax-italiano | https://www.conmebol.com/sudamericana/
| 25 | 2161299 | http-4xx | 418 | 0/7 | 107 | no | match-page | https://www.nba.com/game/phi-vs-nyk-0042500212/box-score | https://www.nba.com/
| 26 | 2148524 | ok | 200 | 5/5 | 27367 | **yes** | news-article | https://griffinshockey.com/news/game-notes-griffins-vs-moose-may-6-2026 | https://theahl.com/stats/schedule
| 27 | 2155391 | empty | 200 | 0/6 | 981 | no | match-page | https://www.nhl.com/gamecenter/mtl-vs-buf/2026/05/06/2025030211 | https://www.nhl.com/scores
| 28 | 1928770 | ok | 200 | 5/6 | 1619 | **yes** | news-article | https://www.newyorkcityfc.com/news/new-york-city-fc-vs-los-angeles-football-club-rescheduled-for-november-4 | https://www.mlssoccer.com/schedule/scores
| 29 | 2060263 | ok | 200 | 5/6 | 3597 | **yes** | news-article | https://www.concacaf.com/competitions/champions-cup/news/toluca-past-lafc-to-reach-champions-cup-final | https://www.concacaf.com/champions-cup/
| 30 | 1927714 | empty | 200 | 0/6 | 17 | no | tournament-stats | https://www.nwslsoccer.com/teams/acffc559cf7d485a9c05fa23ab57054b/utah-royals-fc/schedule | https://www.nwslsoccer.com/
| 31 | 2149730 | ok | 200 | 4/5 | 4738 | **yes** | description-named | https://liquipedia.net/callofduty/Call_of_Duty_Challengers/2026/Elite/3/North_America | https://www.youtube.com/codchallengers/live
| 32 | 2138774 | ok | 200 | 3/5 | 5440 | **yes** | tournament-stats | https://gol.gg/tournament/tournament-matchlist/LCK%20CL%202026%20Rounds%201-2/ | https://play-origin.sooplive.com/afchall
| 33 | 1930074 | ok | 200 | 2/5 | 4319 | **yes** | alternate-source | https://www.fotmob.com/matches/talaea-el-gaish-vs-ghazl-al-mahalla/9ifw4ay | https://www.efa.com.eg/
| 34 | 2036454 | ok | 200 | 3/5 | 3985 | **yes** | alternate-source | https://www.espn.com/soccer/match/_/gameId/756196/al-nassr-al-shabab | https://www.slstat.com/
| 35 | 2164981 | http-4xx | 403 | 0/6 | 0 | no | same-as-raw | https://farside.co.uk/btc/ | https://farside.co.uk/btc/
| 36 | 1928866 | ok | 200 | 2/5 | 2361 | **yes** | alternate-source | https://www.flashscore.com/match/football/qingdao-hainiu-KbZy1iLA/wuhan-three-towns-SfLUTe08/ | https://www.csl-china.com/
| 37 | 2155385 | empty | 202 | 0/7 | 0 | no | same-as-raw | https://www.binance.com/en/trade/ETH_USDT | https://www.binance.com/en/trade/ETH_USDT
| 38 | 2152439 | empty | 200 | 1/6 | 687 | no | description-named | https://www.wunderground.com/history/daily/fr/bonneuil-en-france/LFPB/date/2026-5-6 | https://www.wunderground.com/history/daily/fr/bonneuil-en-france/LFPB
| 39 | 2062014 | http-4xx | 403 | 0/6 | 0 | no | news-article | https://seekingalpha.com/article/4899336-the-kraft-heinz-company-khc-q1-2026-earnings-call-transcript | https://seekingalpha.com/
| 40 | 1921547 | ok | 200 | 3/6 | 2156 | **yes** | match-page | https://www.indiansuperleague.com/matchcentre/101279 | https://www.indiansuperleague.com/
| 41 | 2157472 | empty | 200 | 2/6 | 833 | **yes** | tournament-stats | https://gol.gg/tournament/tournament-stats/LCK%20Spring%202026/ | https://www.twitch.tv/lck
| 42 | 2162496 | http-4xx | 403 | 0/5 | 0 | no | description-named | https://www.hltv.org/events/9098/european-pro-league-series-6 | https://kick.com/eplcs_en
| 43 | 2168091 | http-4xx | 404 | 0/5 | 496 | no | tournament-stats | https://liquipedia.net/leagueoflegends/Esports_World_Cup/2026/Asia-Pacific_Qualifier | https://gol.gg/esports/home
| 44 | 2114956 | ok | 200 | 2/5 | 3813 | **yes** | alternate-source | https://www.sofascore.com/football/match/ittihad-tanger-fath-union-sport/CaxsFTJ | https://www.frmf.ma/
| 45 | 2154161 | ok | 304 | 4/5 | 4543 | **yes** | description-named | https://liquipedia.net/starcraft2/Global_StarCraft_II_League/2026/Season_1 | https://www.sooplive.com/station/afgsl
| 46 | 2125227 | ok | 200 | 2/5 | 1816 | **yes** | match-page | https://www.euroleaguebasketball.net/en/euroleague/game-center/2025-26/panathinaikos-aktor-athens-valencia-basket/E2025/395/ | https://www.euroleaguebasketball.net/euroleague/
| 47 | 2061940 | ok | 200 | 4/5 | 7440 | **yes** | news-article | https://www.uefa.com/uefachampionsleague/news/02a5-209012b11a2c-dba00a4a5757-1000--bayern-1-1-paris-agg-5-6-highlights-ousmane-dembele-takes-h/ | https://www.uefa.com/
| 48 | 2164982 | ok | 200 | 0/6 | 1635 | no | alternate-source | https://finance.yahoo.com/quote/AAPL/history/ | https://pythdata.app/explore/Equity.US.AAPL%2FUSD
| 49 | 2164979 | ok | 200 | 0/6 | 1635 | no | alternate-source | https://finance.yahoo.com/quote/%5EGSPC/history/ | https://www.wsj.com/market-data/stocks
| 50 | 2165066 | ok | 200 | 0/5 | 1635 | no | same-as-raw | https://finance.yahoo.com/quote/MSFT/history/ | https://finance.yahoo.com/quote/MSFT/history
