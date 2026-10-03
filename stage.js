// 무대: Phaser 3 로 홍금보(사진 얼굴 + 그림 몸통)와 활동 장면을 그린다.
// 좌표는 360x280 기준, 레티나 대응으로 캔버스는 2배로 그리고 root 를 2배 확대한다.
const Stage = (() => {
  const W = 360, H = 280, GROUND = 252;
  let game, sc, root, key = '';

  const T = (x, y, str, size = 28, style = {}) =>
    sc.add.text(x, y, str, { fontSize: size * 2 + 'px', fontFamily: 'Jua, sans-serif', ...style }).setOrigin(0.5).setScale(0.5);
  const G = () => sc.add.graphics();
  const loop = (targets, props, duration, extra = {}) =>
    sc.tweens.add({ targets, ...props, duration, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', ...extra });
  const floaty = (obj, delay = 0) =>
    sc.tweens.add({ targets: obj, y: obj.y - 40, alpha: 0, duration: 1500, repeat: -1, delay });

  // ── 몸: 굵은 외곽선 + 단색 플랫 2등신 (몸통·다리 한 덩어리, 팔은 몸 뒤에 붙은 뭉툭한 덩어리) ──
  const OUT = '#3b1f12', TEE = '#8dc63f', TEE_D = '#76ad2c', SKIN = '#ffd3b0', PANTS = '#46508a';
  const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 2}" height="${h * 2}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
  const LW = 4.5; // 외곽선 두께
  const ln = (w = LW) => `stroke="${OUT}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

  const dims = f => {
    const d = { f, bw: 62 + f * 84, bh: 74 + f * 12, armW: 19 + f * 8, armL: 28 };
    d.legW = 0; d.legH = 0; d.hip = 0; d.top = -d.bh; d.sy = d.top + 14; d.sx = d.bw * 0.36 + f * 4;
    return d;
  };

  function torsoSvg({ f, bw: w, bh: h }) {
    const P = 6, W2 = w + 2 * P, H2 = h + 2 * P, cx = W2 / 2, y0 = P, yb = y0 + h;
    const legTop = y0 + h * 0.64, hem = legTop + 2, side = w * (0.48 + f * 0.04);
    const sil = `M${cx - w * 0.26},${y0} Q${cx},${y0 - 3} ${cx + w * 0.26},${y0}
      C${cx + side},${y0 + h * 0.08} ${cx + side + f * 6},${y0 + h * 0.5} ${cx + w * 0.44},${legTop}
      L${cx + w * 0.42},${yb - 7} Q${cx + w * 0.42},${yb} ${cx + w * 0.34},${yb} L${cx + 7},${yb} Q${cx},${yb} ${cx},${yb - 4}
      Q${cx},${yb} ${cx - 7},${yb} L${cx - w * 0.34},${yb} Q${cx - w * 0.42},${yb} ${cx - w * 0.42},${yb - 7}
      L${cx - w * 0.44},${legTop} C${cx - side - f * 6},${y0 + h * 0.5} ${cx - side},${y0 + h * 0.08} ${cx - w * 0.26},${y0} Z`;
    const belly = f > 0.5 ? `<ellipse cx="${cx}" cy="${hem + 1}" rx="${w * 0.36}" ry="${4 + f * 5}" fill="${SKIN}" ${ln(3)}/>
      <ellipse cx="${cx}" cy="${hem + 3 + f * 2}" rx="1.6" ry="2.4" fill="${OUT}"/>` : '';
    const px = cx + w * 0.14, py = y0 + h * 0.36, pr = 3.5 + f * 2.5;
    const petals = [0, 1, 2, 3, 4].map(i => `<circle cx="${px + Math.cos(i * 1.257) * pr}" cy="${py + Math.sin(i * 1.257) * pr}" r="${pr * 0.72}" fill="#8a5a36"/>`).join('');
    return { W: W2, H: H2, ox: cx, oy: yb, s: svg(W2, H2, `
      <clipPath id="c"><path d="${sil}"/></clipPath>
      <g clip-path="url(#c)">
        <rect width="${W2}" height="${H2}" fill="${PANTS}"/>
        <path d="M0,0 H${W2} V${hem} Q${cx},${hem + 5} 0,${hem} Z" fill="${TEE}"/>
        <path d="M${cx + side * 0.55},${y0 + h * 0.15} Q${cx + side},${y0 + h * 0.45} ${cx + side * 0.7},${hem}" stroke="${TEE_D}" stroke-width="7" fill="none" opacity=".7"/>
        ${belly}${petals}<circle cx="${px}" cy="${py}" r="${pr * 0.45}" fill="#ffd54f"/>
      </g>
      <path d="M${cx - w * 0.44},${hem} Q${cx},${hem + 5} ${cx + w * 0.44},${hem}" fill="none" ${ln(3)}/>
      <path d="M${cx},${hem + 6} V${yb - 5}" ${ln(3.5)}/>
      <path d="${sil}" fill="none" ${ln()}/>`) };
  }

  // 뭉툭한 팔: 위는 초록 소매, 끝은 살색 손. 몸 뒤에 그려서 쉴 땐 한 덩어리처럼 보임
  function armSvg({ armW: a, armL: l }) {
    const P = 5, W2 = a + 2 * P, H2 = l + a / 2 + 2 * P, x = W2 / 2, y = P;
    const cap = `M${x - a / 2},${y + a / 2} A${a / 2},${a / 2} 0 0 1 ${x + a / 2},${y + a / 2} V${y + l} A${a / 2},${a / 2} 0 0 1 ${x - a / 2},${y + l} Z`;
    return { W: W2, H: H2, ox: x, oy: y + a / 2, s: svg(W2, H2, `
      <clipPath id="a"><path d="${cap}"/></clipPath>
      <g clip-path="url(#a)"><rect width="${W2}" height="${H2}" fill="${SKIN}"/><rect width="${W2}" height="${y + l * 0.55}" fill="${TEE}"/></g>
      <path d="M${x - a / 2},${y + l * 0.55} H${x + a / 2}" ${ln(3)}/>
      <path d="${cap}" fill="none" ${ln()}/>`) };
  }

  const made = {};
  const bake = (key, part) => new Promise(done => {
    if (sc.textures.exists(key)) return done();
    const img = new Image();
    img.onload = () => { if (!sc.textures.exists(key)) sc.textures.addImage(key, img); done(); };
    img.onerror = () => done();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(part.s);
  });
  async function parts(f) {
    const k = Math.round(f * 20);
    if (made[k]) return made[k];
    const d = dims(k / 20);
    d.k = k; d.torso = torsoSvg(d); d.arm = armSvg(d);
    await Promise.all([bake('torso' + k, d.torso), bake('arm' + k, d.arm)]);
    return made[k] = d;
  }
  const part = (key, pt, flip) => sc.add.image(0, 0, key).setScale(0.5).setOrigin(pt.ox / pt.W, pt.oy / pt.H).setFlipX(!!flip);

  // p.body 는 발밑 기준이라 젤리처럼 눌렀다 폈다 가능. 다리는 몸통에 포함 (legL/legR 는 걷기 연출용 빈 그룹)
  function hong(d, pig, itemR, itemL) {
    const { f, bw, top, sy, sx, k, armL } = d;
    const p = { root: sc.add.container(180, GROUND), body: sc.add.container(0, 0), lean: sc.add.container(0, 0) };
    p.root.add([sc.add.ellipse(0, 2, bw + 24, 12, 0x6b4a20, 0.2), p.body]); p.body.add(p.lean);
    p.legL = sc.add.container(0, 0); p.legR = sc.add.container(0, 0);
    p.torso = part('torso' + k, d.torso);

    p.hw = (pig ? 124 : 100) * (1 + f * 0.2); p.hh = 114 * (1 + f * 0.05);
    p.head = sc.add.container(0, top + 18);
    p.head.add(sc.add.image(0, 0, pig ? 'pig' : 'face').setOrigin(0.5, 1).setDisplaySize(p.hw, p.hh));

    const arm = (x, item, flip) => {
      const c = sc.add.container(x, sy); c.add(part('arm' + k, d.arm, flip));
      if (item) { item.setPosition(0, armL + 2); c.add(item); }
      return c;
    };
    p.armL = arm(-sx, itemL, true); p.armR = arm(sx, itemR);
    p.armL.angle = 12; p.armR.angle = -12;
    p.lean.add([p.legL, p.legR, p.torso, p.armL, p.armR, p.head]);
    return p;
  }

  const blush = p => [-1, 1].forEach(d => p.head.add(sc.add.ellipse(d * p.hw * 0.24, -p.hh * 0.36, 18, 10, 0xff5a5a, 0.45)));
  const table = fg => { const g = G(); g.fillStyle(0xa0673a).fillRoundedRect(40, 222, 280, 14, 4); g.fillStyle(0x7a4a1a).fillRect(60, 236, 10, 16).fillRect(290, 236, 10, 16); fg.add(g); };
  const zz = fg => { const z = T(240, 92, '💤', 26); fg.add(z); floaty(z); };
  const sweat = fg => { const d = T(240, 110, '💦', 20); fg.add(d); floaty(d); };
  const danceMoves = p => {
    p.lean.angle = -9; loop(p.lean, { angle: 9 }, 250);
    p.armR.angle = -150; loop(p.armR, { angle: -200 }, 250);
    p.armL.angle = 150; loop(p.armL, { angle: 200 }, 250);
    loop(p.body, { y: -5 }, 250);
  };
  const walk = (p, ms) => {
    p.body.angle = -5; loop(p.body, { angle: 5 }, ms);
    loop(p.lean, { y: -8 }, ms / 2);
  };

  // 손에 드는 소품 (문자열은 이모지, {p}는 행동 소품)
  const ITEMS = {
    box: ['🥊', '🥊'], club: ['{p}'], selfie: ['📱'], eat: ['🥢'], drink: ['{p}'], conv: ['🍙'], win: ['🏆'],
    hike: [() => { const g = G(); g.lineStyle(4, 0x7a4a1a).lineBetween(0, -10, 0, 30); return g; }],
    book: [() => { const g = G(); g.fillStyle(0x4db6ac).fillRoundedRect(-24, -26, 48, 32, 4); g.fillStyle(0xffffff).fillRect(-1, -26, 2, 32); return g; }],
  };

  const SCENES = {
    idle(p) { loop(p.body, { scaleX: 1.04, scaleY: 0.96 }, 900); loop(p.head, { angle: 3, y: p.head.y + 2 }, 1300); },
    box(p, bg) {
      const g = G(); g.lineStyle(3, 0xcc3333).lineBetween(0, 150, 360, 150).lineBetween(0, 185, 360, 185); bg.add(g);
      const bag = sc.add.container(305, 0), b = G();
      b.lineStyle(3, 0x555555).lineBetween(0, 0, 0, 70);
      b.fillStyle(0xb23a2e).fillRoundedRect(-20, 70, 40, 110, 16); b.fillStyle(0x8a2a20).fillRect(-20, 110, 40, 8);
      bag.add(b); bg.add(bag);
      p.armR.angle = -40; loop(p.armR, { angle: -100 }, 220);
      p.armL.angle = 30; loop(p.armL, { angle: -70 }, 220, { delay: 220 });
      loop(bag, { angle: -7 }, 220); loop(p.body, { y: -3 }, 220);
    },
    run(p, bg, fg) {
      const strip = sc.add.container(0, 0);
      [0, 360].forEach(o => strip.add([T(40 + o, 200, '🌳', 44), T(150 + o, 186, '🏢', 56), T(270 + o, 205, '🌳', 38)]));
      bg.add(strip); sc.tweens.add({ targets: strip, x: -360, duration: 2000, repeat: -1 });
      const road = sc.add.container(0, 0), r = G(); r.fillStyle(0xffffff);
      for (let x = 0; x < 420; x += 50) r.fillRect(x, 264, 30, 4);
      road.add(r); fg.add(road); sc.tweens.add({ targets: road, x: -50, duration: 300, repeat: -1 });
      walk(p, 175);
      p.armR.angle = -40; loop(p.armR, { angle: 30 }, 175);
      p.armL.angle = 40; loop(p.armL, { angle: -30 }, 175);
      sweat(fg);
    },
    hike(p, bg, fg) {
      const g = G();
      g.fillStyle(0x86b07f).fillTriangle(-20, 252, 90, 70, 200, 252);
      g.fillStyle(0x5e8f5a).fillTriangle(120, 252, 260, 40, 400, 252);
      g.fillStyle(0xffffff).fillTriangle(240, 71, 260, 40, 280, 71);
      bg.add([g, T(262, 30, '🚩', 22)]);
      p.lean.angle = 8; walk(p, 320);
      p.armR.angle = -20; loop(p.armR, { angle: 5 }, 320);
      sweat(fg);
    },
    dance(p, bg) {
      const g = G(); g.fillStyle(0xffffff, 0.5).fillCircle(180, 40, 130); bg.add(g);
      const a = T(60, 120, '🎵', 28), b = T(300, 100, '🎶', 28); bg.add([a, b]); floaty(a); floaty(b, 700);
      danceMoves(p);
    },
    club(p, bg) {
      const g = G(); g.fillStyle(0x241238).fillRect(0, -20, W, H + 20); bg.add(g);
      [0xff00ff, 0x00ffff, 0xffff00, 0xff5555].forEach((c, i) => {
        const beam = G(); beam.fillStyle(c, 1).fillTriangle(180, 30, i * 100 - 20, 252, i * 100 + 40, 252);
        beam.alpha = 0.15; bg.add(beam); loop(beam, { alpha: 0.55 }, 300, { delay: i * 150 });
      });
      const ball = T(180, 30, '🪩', 36), neon = T(70, 80, 'ITAEWON', 20, { color: '#ff66ff' });
      bg.add([ball, neon]); sc.tweens.add({ targets: ball, angle: 360, duration: 3000, repeat: -1 }); loop(neon, { alpha: 0.3 }, 400);
      blush(p); danceMoves(p);
    },
    eat(p, bg, fg, s) {
      table(fg); fg.add(T(255, 206, s.prop, 34));
      p.armR.angle = -20; loop(p.armR, { angle: 150 }, 450);
      loop(p.head, { scaleX: 1.05, scaleY: 0.94 }, 120);
    },
    drink(p, bg, fg) {
      table(fg); fg.add([T(90, 206, '🍾', 30), T(265, 206, '🥟', 30)]);
      blush(p);
      p.armR.angle = -20; loop(p.armR, { angle: 150 }, 800);
      loop(p.head, { angle: -14 }, 800);
    },
    conv(p, bg, fg) {
      const g = G(); g.fillStyle(0xe8f4ff).fillRect(10, 60, 340, 150); g.fillStyle(0x99aabb);
      [90, 130, 170].forEach(y => g.fillRect(20, y, 320, 4));
      g.fillStyle(0x2a9d8f).fillRoundedRect(120, 18, 120, 30, 8);
      bg.add([g, T(70, 76, '🍙🍫🥤', 20), T(290, 76, '🍜🍙', 20), T(60, 116, '🍞🧃', 20), T(290, 116, '🍪🍫🥤', 20),
        T(70, 156, '🍜🍜', 20), T(290, 156, '🧃🍙', 20), T(180, 33, '편의점', 17, { color: '#fff' })]);
      const c = G(); c.fillStyle(0xcfcfcf).fillRect(30, 200, 300, 52); c.fillStyle(0x9a9a9a).fillRect(30, 196, 300, 8);
      const beep = T(262, 150, '삑!', 15, { color: '#e53935' });
      fg.add([c, T(290, 182, '🧾', 24), beep]); floaty(beep);
      p.armR.angle = -60; loop(p.armR, { angle: -95 }, 300);
    },
    pc(p, bg, fg) {
      const g = G(); g.fillStyle(0x1d2338).fillRect(0, -20, W, H + 20); bg.add(g);
      const neon = T(64, 36, 'PC방', 22, { color: '#00ffff' }); bg.add(neon); loop(neon, { alpha: 0.4 }, 500);
      const d = G(); d.fillStyle(0x444444).fillRect(20, 214, 320, 12);
      d.fillStyle(0x111111).fillRoundedRect(240, 138, 104, 70, 6); d.fillStyle(0x3a6df0).fillRect(246, 144, 92, 56);
      const over = T(292, 172, 'GAME OVER', 12, { color: '#fff' });
      fg.add([d, over, T(60, 198, '🍜', 26)]); loop(over, { alpha: 0.2 }, 300);
      p.armR.angle = -55; loop(p.armR, { angle: -68 }, 70);
      p.armL.angle = 55; loop(p.armL, { angle: 68 }, 70, { delay: 35 });
    },
    book(p, bg, fg) {
      p.armR.angle = 35; p.armL.angle = -35;
      loop(p.head, { angle: 18 }, 1200, { hold: 500 }); zz(fg);
    },
    rest(p, bg, fg) {
      const g = G(); g.fillStyle(0x8a5a44).fillRoundedRect(60, 150, 240, 90, 20);
      g.fillStyle(0x7a4a34).fillRoundedRect(40, 170, 40, 80, 14).fillRoundedRect(280, 170, 40, 80, 14); bg.add(g);
      loop(p.head, { angle: 18 }, 1200, { hold: 500 }); zz(fg);
    },
    sad(p, bg, fg, s) {
      p.head.y += 5; p.head.angle = -8; p.armR.angle = -4; p.armL.angle = 4;
      const gr = T(255, 200, '꼬르륵', 16, { color: '#c0392b' }); fg.add(gr); floaty(gr);
      if (s.prop) { const e = T(110, 100, s.prop, 30); fg.add(e); loop(e, { angle: 12 }, 120); }
    },
    selfie(p, bg, fg) {
      const g = G(); g.fillStyle(0xffd6e8).fillRect(0, -20, W, H + 20); bg.add(g);
      ['💗', '✨', '💖', '✨'].forEach((e, i) => { const h = T(40 + i * 95, 150 - (i % 2) * 60, e, 26); bg.add(h); floaty(h, i * 350); });
      p.armR.angle = -160;
      loop(p.head, { scaleX: 0.78 }, 700, { hold: 500 }); // 보정 앱 갸름 필터
      const flash = sc.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0); fg.add(flash);
      sc.tweens.add({ targets: flash, alpha: 0.9, duration: 80, yoyo: true, repeat: -1, repeatDelay: 1400 });
      fg.add(T(300, 40, '보정 ON', 16, { color: '#e85d75' }));
    },
    raid(p, bg, fg) {
      const g = G(); g.fillStyle(0x16203a).fillRect(0, -20, W, H + 20);
      g.fillStyle(0xeeeeee).fillRoundedRect(250, 60, 90, 192, 8);          // 냉장고
      g.fillStyle(0xfff3a0).fillRect(258, 70, 74, 172);                    // 텅 빈 안쪽 불빛
      g.fillStyle(0xfff3a0, 0.25).fillTriangle(258, 70, 258, 242, 120, 252);
      g.fillStyle(0xdddddd).fillRect(258, 120, 74, 3).fillRect(258, 175, 74, 3);
      bg.add([g, T(50, 40, '🌙', 30), T(295, 100, '🕸️', 22)]);
      table(fg); fg.add([T(110, 206, '🍗', 28), T(160, 210, '🥡', 26), T(210, 206, '🍰', 28)]);
      blush(p);
      p.armR.angle = -20; loop(p.armR, { angle: 150 }, 300);
      p.armL.angle = 20; loop(p.armL, { angle: -150 }, 300, { delay: 150 });
      loop(p.head, { scaleX: 1.06, scaleY: 0.93 }, 100);
    },
    win(p, bg) {
      p.armR.angle = -165; p.armL.angle = 165;
      const a = T(60, 90, '🎉', 34), b = T(300, 90, '🎊', 34); bg.add([a, b]); floaty(a); floaty(b, 700);
      loop(p.body, { y: -10 }, 200);
    },
  };

  async function show(s) {
    if (!sc) return;
    const k = s.w.toFixed(1) + s.anim + s.prop;
    if (k === key) return; key = k;
    const d = await parts(Math.max(0, Math.min(1.1, (s.w - 50) / 50)));
    if (key !== k || !sc) return; // 굽는 사이 다음 장면이 들어옴
    sc.tweens.killAll(); root.removeAll(true);
    const sky = G(); sky.fillStyle(0xfff3d6).fillRect(0, -20, W, H + 20);
    const floor = G(); floor.fillStyle(0xe9d29a).fillRect(0, GROUND, W, H - GROUND);
    const bg = sc.add.container(0, 0), fg = sc.add.container(0, 0);
    const items = (ITEMS[s.anim] || []).map(v => typeof v === 'function' ? v() : T(0, 0, v.replace('{p}', s.prop), 24));
    const p = hong(d, s.w >= 90, items[0], items[1]);
    root.add([sky, bg, floor, p.root, fg]);
    (SCENES[s.anim] || SCENES.idle)(p, bg, fg, s);
    p.lean.setScale(1.18, 0.82); sc.tweens.add({ targets: p.lean, scaleX: 1, scaleY: 1, duration: 600, ease: 'Elastic.Out' });
    if (s.w >= 90) { // 90kg 넘으면 쿵쿵: 화면 흔들림 + 바닥 금
      const c = G(); c.lineStyle(2, 0x6b4f2a);
      [[150, 254, 130, 270, 112, 276], [210, 254, 232, 268, 250, 278], [180, 256, 178, 278, 160, 280]].forEach(([a, b, c1, d, e, f2]) =>
        c.beginPath().moveTo(a, b).lineTo(c1, d).lineTo(e, f2).strokePath());
      root.addAt(c, 3);
      sc.cameras.main.shake(450, 0.012);
    }
  }

  function init(parent) {
    return new Promise(done => {
      game = new Phaser.Game({
        type: Phaser.AUTO, parent, width: W * 2, height: (H + 20) * 2, transparent: true,
        scale: { mode: Phaser.Scale.NONE },
        scene: {
          preload() { this.load.image('face', 'img/face.png'); this.load.image('pig', 'img/face-pig.png'); },
          create() { sc = this; root = this.add.container(0, 40).setScale(2); done(); }, // 위 20은 말풍선 자리
        },
      });
    });
  }

  // 지금 무대 화면을 사진으로 (박제 앨범용)
  const snap = () => new Promise(done => sc ? game.renderer.snapshot(img => done(img || null), 'image/jpeg', 0.85) : done(null));
  const destroy = () => { if (game) game.destroy(true); sc = null; };
  return { init, show, snap, destroy };
})();
