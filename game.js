// 홍금보 키우기 - 순수 로직 (브라우저/node 공용)
const START = 60, GOAL = 50, PIG = 100;
const r = (rng, a, b) => a + (b - a) * rng();

// 행동: [이름, 설명, 적용 함수] — 적용 함수는 s를 직접 수정하고 메시지를 반환
const ACTIONS = {
  buldak: ['🔥 불닭 먹기', '+체중 / 의지력 회복', (s, g) => { s.w += r(g, 2, 3.5); s.will += 12; s.money -= 3000; return '불닭볶음면 3봉... 스트레스는 풀렸다.'; }],
  drink:  ['🍺 술 먹기', '+체중 / 체력↓', (s, g) => { s.w += r(g, 1.5, 3); s.will += 15; s.sta -= 15; s.money -= 15000; return '소주 한 병이 두 병이 됐다.'; }],
  boxing: ['🥊 복싱', '체력 -35 / 의지력 -15', (s, g) => workout(s, g, 0.5, 1.4, 35, 15, '샌드백을 쳤다. 샌드백이 더 안 아파 보인다.')],
  running: ['🏃 러닝', '체력 -25 / 의지력 -15', (s, g) => workout(s, g, 0.4, 1.0, 25, 15, '3km 뛰었다. 숨소리가 거의 엔진음.')],
  hiking: ['⛰️ 등산', '체력 -45 / 의지력 -20', (s, g) => {
    const m = workout(s, g, 0.8, 1.8, 45, 20, '정상 찍었다. 다리가 후들후들.');
    if (g() < 0.3) { s.w += 2; return m + ' 하산 후 막걸리+파전을 먹었다. (+2kg)'; } return m; }],
  conv: ['🏪 편의점 알바', '+돈 / 폐기 도시락 유혹', (s, g) => { s.money += 60000; s.w += r(g, 0.3, 1.2); s.will -= 5; return '시급 벌었다. 폐기 삼각김밥은 서비스.'; }],
  pcbang: ['🖥️ PC방 알바', '+돈 / 라면 유혹', (s, g) => { s.money += 70000; s.w += r(g, 0.5, 1.5); s.will -= 5; s.sta -= 5; return '손님 라면 끓이다 내 것도 끓였다.'; }],
  itaewon: ['🕺 이태원 가기', '+술·야식 / 의지력 회복', (s, g) => { s.w += r(g, 1.5, 3); s.will += 20; s.sta -= 20; s.money -= 80000; return '"딱 한 잔만"이라더니 첫차 타고 귀가. 지갑은 가출했다.'; }],
  dance: ['💃 춤추기', '-체중 / 의지력 소폭↑', (s, g) => {
    if (s.sta < 20) { s.w += 0.3; return '춤추려다 숨이 차서 벽에 기대 있었다.'; }
    s.sta -= 20; s.will += 5; s.w -= r(g, 0.2, 1.0); return '신나게 흔들었다. 바닥이 같이 흔들렸다.'; }],
  salad: ['🥗 샐러드', '-조금 / 의지력↓', (s, g) => { s.w -= r(g, 0.1, 0.5); s.will -= 10; return '풀만 먹었더니 허기가 진다.'; }],
  fast: ['🚫 단식', '-체중 / 의지력 대폭↓', (s, g) => { s.w -= r(g, 0.8, 1.5); s.will -= 30; s.binge = true; return '하루 종일 굶었다. 내일이 무섭다.'; }],
  rest: ['😴 쉬기', '체력 회복', (s, g) => { s.sta += 35; s.will += 5; s.w += 0.3; return '꿀잠. 몸이 가벼워진 건 기분 탓.'; }],
};

function workout(s, g, lo, hi, sta, will, ok) {
  if (s.will < 35 || s.sta < 30) { s.w += 0.5; return '운동복까지 입었는데 소파에 누웠다. (+0.5kg)'; }
  s.sta -= sta; s.will -= will;
  if (g() < 0.3) { s.w -= 4; return '💥 쿵푸 각성! 오늘따라 몸이 날아다닌다. (-4kg)'; }
  s.w -= r(g, lo, hi); return ok;
}

const newGame = () => ({ money: 0, day: 1, w: START, will: 70, sta: 100, loss: 0, binge: false, over: null, log: [] });

const clamp = s => { s.will = Math.max(0, Math.min(100, s.will)); s.sta = Math.max(0, Math.min(100, s.sta)); };

function check(s) {
  if (s.w >= PIG) s.over = 'pig';
  else if (s.w <= GOAL) s.over = 'win';
}

// 하루 행동
function act(s, id, rng = Math.random) {
  const before = s.w;
  s.log = [ACTIONS[id][2](s, rng)];
  if (s.binge) { s.w += 2; s.binge = false; s.log.push('어제 굶은 반동으로 폭식했다. (+2kg)'); }
  if (s.loss > 0) { s.w += s.loss * 0.5; s.log.push('요요가 왔다. (+' + (s.loss * 0.5).toFixed(1) + 'kg)'); }
  s.loss = Math.max(0, before - s.w);
  if (s.sta <= 0) { s.w += 1; s.sta = 30; s.log.push('체력 방전으로 쓰러져 배달만 시켰다. (+1kg)'); }
  clamp(s); check(s);
  return s;
}

// 저녁 유혹: 80% 확률로 발생. eat=true면 먹는다
const tempted = (s, rng = Math.random) => !s.over && rng() < 0.8;
function temptation(s, eat, rng = Math.random) {
  if (!eat && s.will >= 20) { s.will -= 20; s.log = ['꾹 참았다. (의지력 -20)']; }
  else {
    s.w += r(rng, 1, 3);
    s.log = [eat ? '에라 모르겠다, 먹었다.' : '참으려 했지만 의지력이 바닥나 먹고 말았다.'];
  }
  endDay(s);
  return s;
}

function endDay(s) {
  if (s.day > 25) s.w += 3; // 연말 회식 시즌: 시간 끌면 반드시 찐다
  s.w += 0.3; s.will += 20; s.sta += 5; s.day++;
  clamp(s); check(s);
}
// 유혹 없는 날도 하루 정리
const skipTemptation = endDay;

if (typeof module !== 'undefined') module.exports = { ACTIONS, newGame, act, tempted, temptation, skipTemptation, START, GOAL, PIG };
