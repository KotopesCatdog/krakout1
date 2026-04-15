let audioCtx = null;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playBeep(frequency, duration, volume = 0.3) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;
    oscillator.type = "sine";
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, now + duration);
    oscillator.stop(now + duration);
}

function playBrickHit(strength) {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (strength <= 0) playBeep(880, 0.12, 0.25);
    else playBeep(440, 0.08, 0.2);
}

function playPaddleHit() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    playBeep(660, 0.06, 0.15);
}

function playBonusCollect() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 523.25;
    gain.gain.value = 0.2;
    osc.start();
    osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.15);
    osc.stop(now + 0.15);
}

function playLifeLost() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    playBeep(220, 0.3, 0.3);
}

function playLaserShoot() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 1200;
    gain.gain.value = 0.15;
    osc.type = "square";
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.1);
    osc.stop(now + 0.1);
}

function playExplosionSound() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const now = audioCtx.currentTime;
    
    // Три осциллятора для объёмного звука
    const frequencies = [55, 80, 110];
    const types = ["sawtooth", "square", "sawtooth"];
    
    for (let i = 0; i < frequencies.length; i++) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = frequencies[i];
        gain.gain.value = 0.35;
        osc.type = types[i];
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.4);
        osc.frequency.exponentialRampToValueAtTime(frequencies[i] / 2, now + 0.4);
        osc.stop(now + 0.4);
    }
}


function playFoxSound() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 1000;
    gain.gain.value = 0.6;
    osc.type = "sine";
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.25);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.25);
    osc.stop(now + 0.25);
}

window.playFoxSound = playFoxSound;

//  playFoxSound();   проверка в консоли




// Делаем функцию глобальной
window.playExplosionSound = playExplosionSound;


