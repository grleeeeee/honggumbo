// 홍금보 키우기 - 순수 로직 (브라우저/node 공용)
// 대사의 {틀린말|맞는말} 은 맞춤법 오타. 화면에서 탭하면 고쳐진다.
const START = 60, GOAL = 50, PIG = 100;
// 밸런스 손잡이: 요요 비율, 하루 기본 증량, 쿵푸 각성 확률
const BAL = { yoyo: 0.3, drift: 0.2, awaken: 0.4 };
const r = (rng, a, b) => a + (b - a) * rng();
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

function workout(s, g, lo, hi, sta, will, ok) {
  if (s.will < 35 || s.sta < 30) { s.w += 0.5; s.fail = true; return '운동복까지 입었는데 소파에 누웠다. (+0.5kg)'; }
  s.sta -= sta; s.will -= will;
  if (g() < BAL.awaken) { s.w -= 4; s.awaken = true; return '💥 쿵푸 각성! 오늘따라 몸이 날아다닌다. (-4kg)'; }
  s.w -= r(g, lo, hi); return ok;
}

// id: [버튼, 설명, 애니메이션, 소품, 대사들, 적용 함수]
const ACTIONS = {
  buldak: ['🔥 불닭 먹기', '+체중 / 의지력 회복', 'eat', '🔥', ['오우 쉣 불닭은 {못참지|못 참지} ..', '내일부터 진짜 {할께|할게} 양심적으로 (진짜임💗)'],
    (s, g) => { s.w += r(g, 2, 3.5); s.will += 12; s.money -= 3000; return '불닭볶음면 3봉... 스트레스는 풀렸다.'; }],
  drink: ['🍺 술 먹기', '+체중 / 체력↓', 'drink', '🍺', ['한잔만쓰 딱 한잔만쓰 {부탁드림니다|부탁드립니다}', '오우 쉣 {랜만에|오랜만에} 달린다 ...', '내일부터 {금주할께|금주할게} 오늘까지만쓰'],
    (s, g) => { s.w += r(g, 1.5, 3); s.will += 15; s.sta -= 15; s.money -= 15000; return '소주 한 병이 두 병이 됐다.'; }],
  itaewon: ['🕺 이태원 가기', '+술·야식 / 의지력↑', 'club', '🍸', ['이태원 가는 나 너무 {귀여웡|귀여워}💗 (자기애충만모먼트)', '쉿쓰 조용쓰 엄마한텐 {비밀이야 진자|비밀이야 진짜}'],
    (s, g) => { s.w += r(g, 1.5, 3); s.will += 20; s.sta -= 20; s.money -= 80000; return '"딱 한 잔만"이라더니 첫차 타고 귀가. 지갑은 가출했다.'; }],
  boxing: ['🥊 복싱', '체력 -35 / 의지력 -15', 'box', '🥊', ['샌드백 치는 나 너무 {뿌득해|뿌듯해}💗', '오우 쉣 손목 {나갈뻔|나갈 뻔} ...'],
    (s, g) => workout(s, g, 0.5, 1.4, 35, 15, '샌드백을 쳤다. 샌드백이 더 안 아파 보인다.')],
  running: ['🏃 러닝', '체력 -25 / 의지력 -15', 'run', '💨', ['{랜만에|오랜만에} 뛰었더니 발이 {무리가 됬나|무리가 됐나} ..', '뛰는 나 너무 {귀여웡|귀여워} (자기애충만모먼트)'],
    (s, g) => workout(s, g, 0.4, 1.0, 25, 15, '3km 뛰었다. 숨소리가 거의 엔진음.')],
  hiking: ['⛰️ 등산', '체력 -45 / 의지력 -20', 'hike', '⛰️', ['정상 사진 너무 {뿌득해서|뿌듯해서} 💗', '오우 쉣 진짜 고생하긴 {햇네|했네}', '참치김밥이랑 단백질 쉐이크 먹어야겠다 {양심적으루|양심적으로}'],
    (s, g) => {
      const m = workout(s, g, 0.8, 1.8, 45, 20, '정상 찍었다. 다리가 후들후들.');
      if (g() < 0.2) { s.w += 2; return m + ' 하산 후 막걸리+파전을 먹었다. (+2kg)'; } return m; }],
  dance: ['💃 춤추기', '-체중 / 의지력 소폭↑', 'dance', '🎵', ['춤추는 나 너무 {귀여웡|귀여워}💗 (자기애충만모먼트)', '쉿쓰 조용쓰 {집중중임|집중 중임}'],
    (s, g) => {
      if (s.sta < 20) { s.w += 0.3; s.fail = true; return '춤추려다 숨이 차서 벽에 기대 있었다.'; }
      s.sta -= 20; s.will += 5; s.w -= r(g, 0.2, 1.0); return '신나게 흔들었다. 바닥이 같이 흔들렸다.'; }],
  book: ['📚 책 읽기', '지적인 금보 (가능?)', 'book', '📖', ['쉿쓰 조용쓰 독서 {중임니다|중입니다}', '오늘은 진짜 다 {읽을꺼야|읽을 거야} 양심적으로'],
    (s, g) => { s.w += 0.3; s.will -= 5; s.sta += 10; s.books++;
      return pick(g, ['1페이지 펼치고 3분 만에 침 흘리며 잠들었다.', '책을 라면 받침으로 썼다.', '표지만 30분 보다가 유튜브를 켰다.',
        '"다이어트의 정석" 목차까지 읽고 배달앱을 열었다.', '책 냄새가 좋다며 킁킁대다 끝났다.']) + ' (실패 ' + s.books + '회째)'; }],
  conv: ['🏪 편의점 알바', '+돈 / 폐기 도시락', 'conv', '🍙', ['폐기는 {내꺼|내 거}쓰 💗', '사장님 내일 {뵈요|봬요} ...'],
    (s, g) => { s.money += 60000; s.w += r(g, 0.3, 1.2); s.will -= 5; return '시급 벌었다. 폐기 삼각김밥은 서비스.'; }],
  pcbang: ['🖥️ PC방 알바', '+돈 / 라면 유혹', 'pc', '🍜', ['손님들 쉿쓰 조용쓰 {부탁드림니다|부탁드립니다}', '라면 냄새 {희안하게|희한하게} 맛있네 오우 쉣', '내일부터 라면 {끊을께|끊을게} 양심적으로'],
    (s, g) => { s.money += 70000; s.w += r(g, 0.5, 1.5); s.will -= 5; s.sta -= 5; return '손님 라면 끓이다 내 것도 끓였다.'; }],
  salad: ['🥗 샐러드', '-조금 / 의지력↓', 'eat', '🥗', ['샐러드 먹는 나 너무 {뿌득해|뿌듯해}💗', '드레싱 듬뿍이면 {괜찮치|괜찮지} 양심적으로 ...'],
    (s, g) => { s.w -= r(g, 0.2, 0.6); s.will -= 5; return '풀만 먹었더니 허기가 진다.'; }],
  fast: ['🚫 단식', '-체중 / 의지력 대폭↓', 'sad', '💧', ['오늘 진짜 안 {먹을꺼야|먹을 거야} ..', '배고파서 {어지러웁다|어지럽다} 오우 쉣'],
    (s, g) => { s.w -= r(g, 0.8, 1.5); s.will -= 30; s.binge = true; return '하루 종일 굶었다. 내일이 무섭다.'; }],
  rest: ['😴 쉬기', '체력 회복', 'rest', '💤', ['발이 {무리가 됬는지|무리가 됐는지} 쉬어야겠다 ..', '쉬는 것도 다이어트 {정닺|정답} 💗', '내일부터 {운동할께|운동할게} 진짜임 ..'],
    (s, g) => { s.sta += 35; s.will += 5; s.w += 0.3; return '꿀잠. 몸이 가벼워진 건 기분 탓.'; }],
  selfie: ['🤳 셀카 찍기', '의지력↑ / 체중 그대로', 'selfie', '📱', ['찍은 사진 너무 {뿌득해서|뿌듯해서} (나너무귀여웡💗 자기애충만모먼트)', '보정 {한개|한 게} 아니라 원래 {이럼니다|이럽니다}'],
    (s, g) => { s.will += 15; s.selfies++; return '보정 앱으로 -12kg 완성. 실물은 그대로다.'; }],
};

// 행동별 배고픔 변화 (먹으면 줄고 움직이면 찬다)
const HUNGER = { buldak: -40, drink: -20, itaewon: -30, boxing: 8, running: 6, hiking: 10, dance: 5, book: 5, conv: -20, pcbang: -25, salad: -35, fast: 40, rest: 5, selfie: 5 };

// 친구들 댓글 [아이디, 댓글]
const COMMENTS = {
  buldak: [['불닭감시단', 'ㅋㅋㅋ 또 불닭? 위장 안녕'], ['엄마', '밥은 안 먹고 그런 걸 먹니'], ['위장', '살려줘']],
  drink: [['간', '나 퇴사할게'], ['술친구', '오늘도 한잔만? ㅋㅋ']],
  itaewon: [['이태원주민', '오늘도 출근하셨네요'], ['통장', '...'], ['엄마', '어디니']],
  boxing: [['샌드백', '간지럽다'], ['관장님', '오늘은 10분 버텼네']],
  running: [['러닝크루', '300m 완주 축하 ㅋㅋ'], ['발', '제발 그만']],
  hiking: [['등산러', '정상 사진 보정함?'], ['막걸리집', '하산하면 들러요~']],
  dance: [['아랫집', '층간소음 신고합니다'], ['댄스학원', '재능은 없지만 열정은 인정']],
  book: [['서점', '책 펴는 거 처음 봄'], ['책', '나 왜 산 거야'], ['국어선생님', '맞춤법부터 읽자']],
  conv: [['편의점사장', '폐기 몰래 먹지 마'], ['삼각김밥', '날 지켜줘']],
  pcbang: [['PC방손님', '알바생 라면 몇 개째임?'], ['사장님', '근무 중 라면 금지']],
  salad: [['드레싱', '내가 메인이지?'], ['토끼', '내 밥 뺏지 마']],
  fast: [['위장', '꼬르륵 (분노)'], ['친구', '내일 폭식 각 ㅋㅋ']],
  rest: [['소파', '오늘도 고마워'], ['헬스장', '회원님 어디세요']],
  skip: [['헬스장', '회원님 등록만 하셨네요'], ['소파', '또 왔네? 💗'], ['운동복', '나 오늘도 세탁 안 해도 됨?']],
  selfie: [['보정앱', '오늘도 일 많이 했다'], ['친구', '실물이랑 다른 사람인데?'], ['인스타', '좋아요 3개']],
  eat: [['다이어트', '안녕..'], ['배달기사', '또 뵙네요']],
  resist: [['친구', '오 웬일? 내일 폭식 예약?']],
  raid: [['냉장고', '텅...'], ['엄마', '내 반찬 누가 먹었어']],
};

// 저녁 유혹: [상황, 대사]
const TEMPTATIONS = [
  ['🍗 친구가 치킨을 시켰다', '치킨은 {단백질 이니까|단백질이니까} 양심적으로 괜찮쓰'],
  ['🥩 엄마가 삼겹살을 굽는다', '엄마 밥 {안먹으면|안 먹으면} 불효쓰 ..'],
  ['🍦 편의점 아이스크림 1+1', '오우 쉣 1+1은 {않사면|안 사면} 손해잖아'],
  ['🛵 배달앱 떡볶이 쿠폰 도착', '{어짜피|어차피} 쿠폰 있으니까 💗'],
  ['🎂 동료 생일 케이크가 남았다', '케이크는 손으로 먹어야 {재맛|제맛} {정닺|정답}'],
  ['🌶️ 마라탕 먹자는 연락이 왔다', '마라탕은 {이번 한번만|이번 한 번만} 양심적으로 ..'],
  ['🍜 새벽 2시, 어디선가 라면 냄새', '쉿쓰 조용쓰 물 조절 {잘해야되|잘해야 돼}'],
  ['🧋 카페 신메뉴 출시', '신메뉴 먹는 나 너무 {귀여웡|귀여워} (자기애충만모먼트)'],
];

const newGame = () => ({ day: 1, w: START, will: 70, sta: 100, hunger: 10, money: 0, loss: 0, binge: false, books: 0, fixes: 0,
  selfies: 0, raids: 0, tomorrow: 0, cnt: {}, streak: { id: '', n: 0 }, last: '', comment: null, over: null, log: ['🎯 목표 50kg! 홍금보의 다이어트가 시작됐다.'], say: '오늘부터 다이어트 {시작함니다|시작합니다} 💗 (진짜임)', anim: 'idle', prop: '' });

const lim = v => Math.max(0, Math.min(100, v));
const clamp = s => { s.will = lim(s.will); s.sta = lim(s.sta); s.hunger = lim(s.hunger); };

// 대사/댓글/카운터 공통 처리
function talk(s, key, says, rng) {
  s.say = pick(rng, says);
  if (s.say.includes('내일부터')) s.tomorrow++;
  s.comment = COMMENTS[key] ? pick(rng, COMMENTS[key]) : null;
}

// 배고픔 100 → 강제 폭식
function starving(s) {
  if (s.hunger < 100) return;
  s.w += 3; s.hunger = 30; s.log.push('🍔 배고픔 폭발! 눈 떠보니 배달 음식 3개를 먹고 있었다. (+3kg)');
}

function check(s) {
  if (s.w >= PIG) s.over = 'pig';
  else if (s.w <= GOAL) s.over = 'win';
}

// 하루 행동
function act(s, id, rng = Math.random) {
  const [, , anim, prop, says, fn] = ACTIONS[id];
  const before = s.w;
  s.anim = anim; s.prop = prop; s.fail = s.awaken = false;
  const binge = s.binge; s.binge = false; // 어제 단식했으면 오늘 폭식 (오늘 단식은 내일 터짐)
  s.cnt[id] = (s.cnt[id] || 0) + 1;
  s.streak = s.streak.id === id ? { id, n: s.streak.n + 1 } : { id, n: 1 };
  s.last = id;
  s.log = [fn(s, rng)];
  if (s.fail) { // 운동하러 갔다가 포기 → 소파 장면 + 핑계
    s.anim = 'rest'; s.prop = '🛋️';
    talk(s, 'skip', ['운동복 입은 나 너무 {귀여웡|귀여워}.. 오늘은 여기까지 💗', '내일부터 진짜 {운동할께|운동할게} 양심적으로', '발이 {무리가 됬는지|무리가 됐는지} 오늘은 쉬쓰 ..'], rng);
  } else if (s.awaken) talk(s, id, ['오우 쉣 나 방금 쿵푸 {각성한거|각성한 거} 봄?? 💗', '이 몸매 실화냐 (나너무{멋찜|멋짐} 자기애충만모먼트)'], rng);
  else talk(s, id, says, rng);
  if (!s.fail) s.hunger += HUNGER[id] || 0;
  starving(s);
  if (binge) { s.w += 2; s.log.push('어제 굶은 반동으로 폭식했다. (+2kg)'); }
  if (s.loss > 0) { const y = s.loss * BAL.yoyo; s.w += y; if (y >= 0.2) s.log.push('요요가 왔다. (+' + y.toFixed(1) + 'kg)'); }
  s.loss = Math.max(0, before - s.w);
  if (s.sta <= 0) { s.w += 1; s.sta = 30; s.log.push('체력 방전으로 쓰러져 배달만 시켰다. (+1kg)'); }
  clamp(s); check(s);
  return s;
}

// 저녁 유혹: 80% 확률로 발생. 발생하면 s.tempt 에 [상황, 대사]
function tempted(s, rng = Math.random) {
  if (s.over || rng() >= 0.8) return false;
  s.tempt = pick(rng, TEMPTATIONS.filter(x => x !== s.tempt)); // 같은 유혹 연속 금지
  return true;
}

function temptation(s, eat, rng = Math.random) {
  const cost = resistCost(s);
  if (!eat && s.will >= cost) {
    s.will -= cost; s.log = ['꾹 참았다. (의지력 -' + cost + ')'];
    s.anim = 'sad'; s.prop = '😤'; talk(s, 'resist', ['참은 나 너무 {뿌득해|뿌듯해}💗', '오우 쉣 진짜 {참았슴|참았음} 칭찬 {해조|해줘} 💗'], rng);
  } else {
    s.w += r(rng, 1, 3); s.hunger -= 40;
    s.log = [eat ? '에라 모르겠다, 먹었다.' : '참으려 했지만 의지력이 바닥나 먹고 말았다.'];
    s.anim = 'eat'; s.prop = s.tempt ? [...s.tempt[0]][0] : '🍴';
    talk(s, 'eat', ['역시 {먹는개|먹는 게} 남는 거쓰 💗', '내일부터 진짜 {할께|할게} 양심적으로', '오우 쉣 배불러 {죽겟다|죽겠다} ..'], rng);
  }
  endDay(s, rng);
  return s;
}

// 배고프면 참기가 더 힘들다
const resistCost = s => s.hunger >= 70 ? 35 : 20;

function endDay(s, rng = Math.random) {
  if (s.day > 25) s.w += 3; // 연말 회식 시즌: 시간 끌면 반드시 찐다
  // 쉬거나 책 읽다 잠든 밤엔 가끔 몽유병 냉장고 습격
  if (['rest', 'book'].includes(s.last) && rng() < 0.35) {
    s.w += 2; s.hunger = 0; s.raids++; s.anim = 'raid'; s.prop = '🍗';
    s.log.push('🌙 새벽 3시, 몽유병 발동. 아침에 보니 냉장고가 텅 비었다. (+2kg)');
    talk(s, 'raid', ['기억이 {안나는대|안 나는데} 입에 양념이 {묻어있슴|묻어 있음} ..', '쉿쓰 조용쓰 {엄마한태|엄마한테} 비밀 💗'], rng);
  }
  s.w += BAL.drift; s.will += 20; s.sta += 5; s.hunger += 8; s.day++;
  starving(s); clamp(s); check(s);
}
// 유혹 없는 날도 하루 정리
const skipTemptation = s => endDay(s);

if (typeof module !== 'undefined') module.exports = { BAL, ACTIONS, TEMPTATIONS, COMMENTS, resistCost, newGame, act, tempted, temptation, skipTemptation, START, GOAL, PIG };
