// 효과음: 음원 파일 없이 Web Audio 로 합성
const Sfx = (() => {
  let ctx, muted = localStorage.getItem('hkb-mute') === '1';
  const ac = () => ctx || (ctx = new (window.AudioContext || window.webkitAudioContext)());
  function tone(freq, dur, { type = 'sine', vol = 0.2, slide = 0, delay = 0 } = {}) {
    const c = ac(), t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur);
  }
  function noise(dur, { vol = 0.3, delay = 0, freq = 1200 } = {}) {
    const c = ac(), t = c.currentTime + delay, len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(c.destination); src.start(t);
  }
  const S = {
    chomp: () => [0, 0.18, 0.36].forEach(d => noise(0.09, { delay: d, freq: 900, vol: 0.5 })),
    gulp: () => [0, 0.3].forEach(d => tone(300, 0.18, { slide: -180, delay: d, vol: 0.3 })),
    oink: () => [0, 0.22].forEach(d => tone(420, 0.18, { type: 'sawtooth', slide: -200, delay: d, vol: 0.12 })),
    thud: () => tone(70, 0.35, { slide: -30, vol: 0.6 }),
    punch: () => [0, 0.22, 0.44].forEach(d => noise(0.07, { delay: d, freq: 300, vol: 0.7 })),
    beep: () => tone(1800, 0.12, { type: 'square', vol: 0.08 }),
    type: () => { for (let i = 0; i < 8; i++) noise(0.02, { delay: i * 0.06, freq: 3000, vol: 0.25 }); },
    shutter: () => { noise(0.05, { freq: 4000, vol: 0.5 }); noise(0.05, { freq: 2500, vol: 0.4, delay: 0.08 }); },
    step: () => [0, 0.35].forEach(d => tone(110, 0.1, { delay: d, vol: 0.3 })),
    beat: () => [0, 0.25, 0.5, 0.75].forEach((d, i) => tone(i % 2 ? 220 : 60, 0.12, { delay: d, vol: 0.4, type: i % 2 ? 'square' : 'sine' })),
    growl: () => tone(90, 0.6, { type: 'sawtooth', slide: 40, vol: 0.08 }),
    snore: () => tone(140, 0.8, { type: 'triangle', slide: -60, vol: 0.12 }),
    fanfare: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, { type: 'triangle', delay: i * 0.12, vol: 0.2 })),
    siren: () => [0, 0.32, 0.64].forEach(d => tone(650, 0.3, { type: 'square', slide: 450, delay: d, vol: 0.05 })),
    pop: () => tone(480, 0.12, { slide: 420, vol: 0.15 }),
    fail: () => [392, 370, 349, 311].forEach((f, i) => tone(f, i === 3 ? 0.8 : 0.35, { type: 'sawtooth', delay: i * 0.35, vol: 0.08 })),
  };
  return {
    play(name) { if (!muted && S[name]) try { S[name](); } catch (e) { /* 오디오 미지원 */ } },
    toggle() { muted = !muted; localStorage.setItem('hkb-mute', muted ? '1' : ''); return muted; },
    get muted() { return muted; },
  };
})();
