// 밸런스 시뮬레이션: node sim.js — 돼지엔딩 비율 확인
const G = require('./game.js');
if (process.env.BAL) Object.assign(G.BAL, JSON.parse(process.env.BAL));
const ids = Object.keys(G.ACTIONS);
const diet = ['boxing', 'salad', 'fast', 'rest'];
const policies = {
  random: s => ids[Math.floor(Math.random() * ids.length)],
  diet: s => s.sta >= 30 && s.will >= 35 ? 'boxing' : s.sta < 30 ? 'rest' : 'salad',
  dietFast: s => s.will >= 35 && s.sta >= 30 ? 'boxing' : s.will >= 30 ? 'fast' : 'rest',
  hungry: s => s.hunger >= 65 ? 'salad' : s.sta < 30 ? 'rest' : s.will >= 35 ? 'boxing' : 'selfie',
  smart: s => s.sta < 30 ? 'rest' : s.will >= 35 ? 'boxing' : 'salad',
};
for (const [name, pol] of Object.entries(policies)) {
  for (const resist of [true, false]) {
    let pig = 0, win = 0, days = 0; const N = 5000;
    for (let i = 0; i < N; i++) {
      const s = G.newGame();
      while (!s.over && s.day < 300) {
        G.act(s, pol(s));
        if (s.over) break;
        if (G.tempted(s)) G.temptation(s, !resist); else G.skipTemptation(s);
      }
      if (s.over === 'pig') pig++; if (s.over === 'win') win++; days += s.day;
    }
    console.log(name.padEnd(9), resist ? '참기  ' : '먹기  ', 'pig', (pig / N * 100).toFixed(1) + '%', 'win', (win / N * 100).toFixed(1) + '%', 'avgDays', (days / N).toFixed(1));
  }
}
