// 전략별 승률: 사용자 루틴 / 운동 로테이션 + 전략적 먹기 / 기존 봇
const G = require('./game.js');
if (process.env.BAL) Object.assign(G.BAL, JSON.parse(process.env.BAL));
const N = 4000, SPAR = +(process.env.SPAR || 2);
const ROT = ['boxing', 'running', 'hiking', 'dance'];
function play(pick, eatWhen) {
  const s = G.newGame(); let spar = false, k = 0;
  while (!s.over && s.day < 200) {
    G.act(s, pick(s, k++));
    if (s.over) break;
    if (G.tempted(s)) G.temptation(s, eatWhen(s)); else G.skipTemptation(s);
    if (!spar && s.day >= 4 && !s.over) { spar = true; s.w -= SPAR; }
  }
  return s;
}
const never = () => false;
const smartEat = s => G.resistCost(s) > 30 || s.will - G.resistCost(s) < 35; // 비싸지거나 운동할 의지력이 안 남으면 먹고 초기화
const P = {
  '사용자 루틴(복싱러닝쉬기, 다 참기)': [(s, k) => ['boxing', 'running', 'rest'][(s.day - 1) % 3], never],
  '사용자 루틴 + 전략적 먹기': [(s, k) => ['boxing', 'running', 'rest'][(s.day - 1) % 3], smartEat],
  '고수(로테이션+관리+전략먹기)': [(s, k) => s.sta < 35 ? 'rest' : s.will < 35 ? 'selfie' : s.hunger >= 65 ? 'salad' : ROT.find(x => x !== s.last && (x !== 'hiking' || s.sta >= 50)) , smartEat],
  '대충(랜덤 행동, 반반 먹기)': [() => Object.keys(G.ACTIONS)[Math.floor(Math.random() * 14)], () => Math.random() < 0.5],
};
for (const [name, [pick, eat]] of Object.entries(P)) {
  let win = 0, days = 0; for (let i = 0; i < N; i++) { const s = play(pick, eat); if (s.over === 'win') win++; days += s.day; }
  console.log(name.padEnd(22), 'win', (win / N * 100).toFixed(1).padStart(5) + '%', 'avgDays', (days / N).toFixed(1));
}
