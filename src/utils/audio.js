const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const masterGain = audioCtx.createGain();
masterGain.gain.value = 0.3; 
masterGain.connect(audioCtx.destination);

export function playSound(type, volume = 1.0) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(masterGain);

    const now = audioCtx.currentTime;
    const v = volume;

    if (type === 'honk') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(1 * v, now + 0.02);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } 
    else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(20, now + 0.1);
        gain.gain.setValueAtTime(0.5 * v, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    }
    else if (type === 'dash') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.2 * v, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    }
    else if (type === 'upgrade') {
        osc.type = 'sine';
        [440, 554, 659, 880].forEach((f, i) => {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.type = 'sine';
            o.frequency.value = f;
            o.connect(g);
            g.connect(masterGain);
            g.gain.setValueAtTime(0, now + i * 0.1);
            g.gain.linearRampToValueAtTime(0.3 * v, now + i * 0.1 + 0.05);
            g.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.2);
            o.start(now + i * 0.1);
            o.stop(now + i * 0.1 + 0.2);
        });
    }
    else if (type === 'tick') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
        gain.gain.setValueAtTime(0.5 * v, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    }
}
