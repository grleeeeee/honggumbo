// 홍금보 키우기 - 순수 로직 (브라우저/node 공용)
// 대사의 {틀린말|맞는말} 은 맞춤법 오타. 화면에서 탭하면 고쳐진다.
const START = 60, GOAL = 50, PIG = 100;
const r = (rng, a, b) => a + (b - a) * rng();
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

function workout(s, g, lo, hi, sta, will, ok) {
  if (s.will < 35 || s.sta < 30) { s.w += 0.5; return '운동복까지 입었는데 소파에 누웠다. (+0.5kg)'; }
  s.sta -= sta; s.will -= will;
  if (g() < 0.3) { s.w -= 4; return '💥 쿵푸 각성! 오늘따라 몸이 날아다닌다. (-4kg)'; }
  s.w -= r(g, lo, hi); return ok;
}

// id: [버튼, 설명, 애니메이션, 소품, 대사들, 적용 함수]
const ACTIONS = {
  buldak: ['🔥 불닭 먹기', '+체중 / 의지력 회복', 'eat', '🔥', ['오늘만 먹고 내일부터 다이어트 {할께|할게}', '매운 거 먹으면 살 빠진대. {어떻해|어떡해} 맛있어'],
    (s, g) => { s.w += r(g, 2, 3.5); s.will += 12; s.money -= 3000; return '불닭볶음면 3봉... 스트레스는 풀렸다.'; }],
  drink: ['🍺 술 먹기', '+체중 / 체력↓', 'drink', '🍺', ['딱 한 잔만 {할께|할게}', '소주는 {구지|굳이} 안주 없어도 돼'],
    (s, g) => { s.w += r(g, 1.5, 3); s.will += 15; s.sta -= 15; s.money -= 15000; return '소주 한 병이 두 병이 됐다.'; }],
  itaewon: ['🕺 이태원 가기', '+술·야식 / 의지력↑', 'dance', '🪩', ['{오랫만에|오랜만에} 불태운다!!', '춤추면 살 빠지니까 {괜찮치|괜찮지}?'],
    (s, g) => { s.w += r(g, 1.5, 3); s.will += 20; s.sta -= 20; s.money -= 80000; return '"딱 한 잔만"이라더니 첫차 타고 귀가. 지갑은 가출했다.'; }],
  boxing: ['🥊 복싱', '체력 -35 / 의지력 -15', 'punch', '🥊', ['나 오늘 샌드백 {이길수있어|이길 수 있어}', '{왠만하면|웬만하면} 오늘은 쉬고 싶은데...'],
    (s, g) => workout(s, g, 0.5, 1.4, 35, 15, '샌드백을 쳤다. 샌드백이 더 안 아파 보인다.')],
  running: ['🏃 러닝', '체력 -25 / 의지력 -15', 'run', '💨', ['3km {됬어|됐어}? 아직 300m라고?', '{몇일|며칠}만 뛰면 빠지겠지'],
    (s, g) => workout(s, g, 0.4, 1.0, 25, 15, '3km 뛰었다. 숨소리가 거의 엔진음.')],
  hiking: ['⛰️ 등산', '체력 -45 / 의지력 -20', 'run', '⛰️', ['{일부로|일부러} 제일 높은 산 골랐어', '다리가 {않움직여|안 움직여}'],
    (s, g) => {
      const m = workout(s, g, 0.8, 1.8, 45, 20, '정상 찍었다. 다리가 후들후들.');
      if (g() < 0.2) { s.w += 2; return m + ' 하산 후 막걸리+파전을 먹었다. (+2kg)'; } return m; }],
  dance: ['💃 춤추기', '-체중 / 의지력 소폭↑', 'dance', '🎵', ['내 춤 실력 {어의없지|어이없지}?', '{설레임|설렘} 가득한 스텝'],
    (s, g) => {
      if (s.sta < 20) { s.w += 0.3; return '춤추려다 숨이 차서 벽에 기대 있었다.'; }
      s.sta -= 20; s.will += 5; s.w -= r(g, 0.2, 1.0); return '신나게 흔들었다. 바닥이 같이 흔들렸다.'; }],
  book: ['📚 책 읽기', '지적인 금보 (가능?)', 'sleep', '📖', ['오늘은 진짜 다 {읽을꺼야|읽을 거야}', '책 읽으면 {똑똑해 지겠지|똑똑해지겠지}'],
    (s, g) => { s.w += 0.3; s.will -= 5; s.sta += 10; s.books++;
      return pick(g, ['1페이지 펼치고 3분 만에 잠들었다.', '책을 라면 받침으로 썼다.', '표지만 30분 보다가 유튜브를 켰다.',
        '"다이어트의 정석" 목차까지 읽고 배달앱을 열었다.', '책 냄새가 좋다며 킁킁대다 끝났다.']) + ' (실패 ' + s.books + '회째)'; }],
  conv: ['🏪 편의점 알바', '+돈 / 폐기 도시락', 'work', '🍙', ['폐기는 {내꺼|내 거}야', '사장님 내일 {뵈요|봬요}'],
    (s, g) => { s.money += 60000; s.w += r(g, 0.3, 1.2); s.will -= 5; return '시급 벌었다. 폐기 삼각김밥은 서비스.'; }],
  pcbang: ['🖥️ PC방 알바', '+돈 / 라면 유혹', 'work', '🍜', ['라면 냄새 {희안하게|희한하게} 맛있어', '알바 {역활|역할}에 충실했다'],
    (s, g) => { s.money += 70000; s.w += r(g, 0.5, 1.5); s.will -= 5; s.sta -= 5; return '손님 라면 끓이다 내 것도 끓였다.'; }],
  salad: ['🥗 샐러드', '-조금 / 의지력↓', 'eat', '🥗', ['드레싱 듬뿍이면 {괜찮치|괜찮지}?', '풀만 먹으니까 {금새|금세} 배고파'],
    (s, g) => { s.w -= r(g, 0.1, 0.5); s.will -= 10; return '풀만 먹었더니 허기가 진다.'; }],
  fast: ['🚫 단식', '-체중 / 의지력 대폭↓', 'sad', '💧', ['오늘 진짜 안 {먹을꺼야|먹을 거야}', '배고파서 {어지러웁다|어지럽다}'],
    (s, g) => { s.w -= r(g, 0.8, 1.5); s.will -= 30; s.binge = true; return '하루 종일 굶었다. 내일이 무섭다.'; }],
  rest: ['😴 쉬기', '체력 회복', 'sleep', '💤', ['쉬는 것도 다이어트라고 {들었는대|들었는데}', '잠깐만 누워 {있을께|있을게}'],
    (s, g) => { s.sta += 35; s.will += 5; s.w += 0.3; return '꿀잠. 몸이 가벼워진 건 기분 탓.'; }],
};

// 저녁 유혹: [상황, 대사]
const TEMPTATIONS = [
  ['🍗 친구가 치킨을 시켰다', '치킨은 {단백질 이니까|단백질이니까} 괜찮아'],
  ['🥩 엄마가 삼겹살을 굽는다', '엄마 밥 {안먹으면|안 먹으면} 불효야'],
  ['🍦 편의점 아이스크림 1+1', '1+1은 {않사면|안 사면} 손해잖아'],
  ['🛵 배달앱 떡볶이 쿠폰 도착', '{어짜피|어차피} 쿠폰 있으니까'],
  ['🎂 동료 생일 케이크가 남았다', '케이크는 손으로 먹어야 {재맛이지|제맛이지}'],
  ['🌶️ 마라탕 먹자는 연락이 왔다', '{이번 한번만|이번 한 번만} 갈게'],
  ['🍜 새벽 2시, 어디선가 라면 냄새', '물 조절 {잘해야되|잘해야 돼}'],
  ['🧋 카페 신메뉴 출시', '신메뉴는 {먹어봐야되|먹어봐야 돼}'],
];

const newGame = () => ({ day: 1, w: START, will: 70, sta: 100, money: 0, loss: 0, binge: false, books: 0, fixes: 0, over: null, log: [], say: '', anim: 'idle', prop: '' });

const clamp = s => { s.will = Math.max(0, Math.min(100, s.will)); s.sta = Math.max(0, Math.min(100, s.sta)); };

function check(s) {
  if (s.w >= PIG) s.over = 'pig';
  else if (s.w <= GOAL) s.over = 'win';
}

// 하루 행동
function act(s, id, rng = Math.random) {
  const [, , anim, prop, says, fn] = ACTIONS[id];
  const before = s.w;
  s.anim = anim; s.prop = prop; s.say = pick(rng, says);
  s.log = [fn(s, rng)];
  if (s.binge) { s.w += 2; s.binge = false; s.log.push('어제 굶은 반동으로 폭식했다. (+2kg)'); }
  if (s.loss > 0) { s.w += s.loss * 0.5; s.log.push('요요가 왔다. (+' + (s.loss * 0.5).toFixed(1) + 'kg)'); }
  s.loss = Math.max(0, before - s.w);
  if (s.sta <= 0) { s.w += 1; s.sta = 30; s.log.push('체력 방전으로 쓰러져 배달만 시켰다. (+1kg)'); }
  clamp(s); check(s);
  return s;
}

// 저녁 유혹: 80% 확률로 발생. 발생하면 s.tempt 에 [상황, 대사]
function tempted(s, rng = Math.random) {
  if (s.over || rng() >= 0.8) return false;
  s.tempt = pick(rng, TEMPTATIONS);
  return true;
}

function temptation(s, eat, rng = Math.random) {
  if (!eat && s.will >= 20) {
    s.will -= 20; s.log = ['꾹 참았다. (의지력 -20)'];
    s.anim = 'sad'; s.prop = '😤'; s.say = pick(rng, ['{참을려고|참으려고} 진짜 {노력했는대|노력했는데}...','나 {대단하지 안아|대단하지 않아}?']);
  } else {
    s.w += r(rng, 1, 3);
    s.log = [eat ? '에라 모르겠다, 먹었다.' : '참으려 했지만 의지력이 바닥나 먹고 말았다.'];
    s.anim = 'eat'; s.prop = s.tempt ? [...s.tempt[0]][0] : '🍴'; s.say = pick(rng, ['역시 {먹는개|먹는 게} 남는 거야', '내일부터 진짜 {할께|할게}', '이건 {어쩔수없었어|어쩔 수 없었어}']);
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

if (typeof module !== 'undefined') module.exports = { ACTIONS, TEMPTATIONS, newGame, act, tempted, temptation, skipTemptation, START, GOAL, PIG };
