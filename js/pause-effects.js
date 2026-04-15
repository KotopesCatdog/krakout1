// js/pause-effects.js

let pauseEmojis = [];

const EMOJI_LIST = [
    // Млекопитающие
    "🐵","🐒","🦍","🦧","🐶","🐕","🦮","🐕‍🦺","🐩","🐺","🦊","🦝","🐱","🐈","🐈‍⬛",
    "🦁","🐯","🐅","🐆","🐴","🫎","🫏","🐎","🦄","🦓","🦌","🦬","🐮","🐂","🐃","🐄",
    "🐷","🐖","🐗","🐽","🐏","🐑","🐐","🐪","🐫","🦙","🦒","🐘","🦣","🦏","🦛",
    "🐭","🐁","🐀","🐹","🐰","🐇","🐿️","🦫","🦔","🦇","🐻","🐻‍❄️","🐨","🐼","🦥","🦦","🦨","🦘","🦡","🐾",

    // Птицы
    "🦃","🐔","🐓","🐣","🐤","🐥","🐦","🐧","🕊️","🦅","🦆","🦢","🦉","🦤","🪶","🦩","🦚","🦜","🐦‍⬛","🐦‍🔥",

    // Земноводные и рептилии
    "🐸","🐊","🐢","🦎","🐍","🐲","🐉","🦕","🦖",

    // Морские животные
    "🐳","🐋","🐬","🦭","🐟","🐠","🐡","🦈","🐙","🐚",

    // Насекомые и пауки
    "🐌","🦋","🐛","🐜","🐝","🪲","🐞","🦗","🪳","🕷️","🕸️","🦂","🦟","🪰","🪱","🦠"
];

function createPauseEmoji() {
    const emojiChar = EMOJI_LIST[Math.floor(Math.random() * EMOJI_LIST.length)];

    return {
        emoji: emojiChar,
        x: Math.random() * W,
        y: Math.random() * (H * 0.4) - 50,     
        vx: (Math.random() - 0.5) * 1.6,       
        vy: 0.5 + Math.random() * 1.0,         // сделал падение ещё немного медленнее
        size: 26 + Math.random() * 24,
        opacity: 0,
        targetOpacity: 0.75 + Math.random() * 0.25,
        life: Date.now() + 14000 + Math.random() * 12000,   // ← теперь 14–26 секунд
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.032,
        sway: Math.random() * Math.PI * 2
    };
}

function updatePauseEmojis() {
    const now = Date.now();

    // Спавн эмодзи
    if (now - (window.lastPauseSpawn || 0) > 55) {     // примерно 18 эмодзи в секунду
        pauseEmojis.push(createPauseEmoji());
        window.lastPauseSpawn = now;

        if (pauseEmojis.length > 38) {
            pauseEmojis.shift();
        }
    }

    for (let i = pauseEmojis.length - 1; i >= 0; i--) {
        const e = pauseEmojis[i];

        // Движение + лёгкое покачивание
        e.x += e.vx + Math.sin(e.sway) * 0.9;
        e.y += e.vy;
        e.sway += 0.032;

        // Постепенное замедление горизонтального движения
        e.vx *= 0.975;

        // Плавное появление и исчезновение
        const age = now - (e.life - 15000);
        const remaining = e.life - now;

        if (age < 800) {
            e.opacity = Math.min(e.targetOpacity, age / 800);
        } else if (remaining < 1800) {
            e.opacity = Math.max(0.03, remaining / 1800);
        } else {
            e.opacity = e.targetOpacity;
        }

        // Вращение
        e.rotation += e.rotationSpeed;

        // Удаление
        if (now > e.life || e.opacity < 0.03 || e.y > H + 80) {
            pauseEmojis.splice(i, 1);
        }
    }
}

function drawPauseEmojis(ctx) {
    ctx.shadowBlur = 18;
    ctx.shadowColor = "rgba(255, 255, 255, 0.75)";

    for (const e of pauseEmojis) {
        ctx.save();
        ctx.globalAlpha = e.opacity;
        ctx.translate(e.x, e.y);
        ctx.rotate(e.rotation);

        ctx.font = `bold ${e.size}px Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji`;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(e.emoji, 0, 0);

        ctx.restore();
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
}

// Делаем функции доступными
window.updatePauseEmojis = updatePauseEmojis;
window.drawPauseEmojis = drawPauseEmojis;