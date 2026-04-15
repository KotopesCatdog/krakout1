// js/paddle.js

let PADDLE_W = 144;
let paddleX = (W - PADDLE_W) / 2;
let currentPaddleStyle = 'classic';

function savePaddleStyle() {
    localStorage.setItem('krakout_paddle_style', currentPaddleStyle);
}

function loadPaddleStyle() {
    const saved = localStorage.getItem('krakout_paddle_style');
    if (saved && ['classic', 'scifi', 'ice', 'gold', 'neon', 'retro'].includes(saved)) {
        return saved;
    }
    return 'classic';
}

function drawPaddle(ctx) {
    const x = paddleX;
    const y = PADDLE_Y;
    const w = PADDLE_W;
    const h = PADDLE_H;

    switch (currentPaddleStyle) {
        case 'classic':
            ctx.fillStyle = "#c2f2b0";
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = "#91c46b";
            ctx.fillRect(x + 6, y - 4, w - 12, 6);
            ctx.fillStyle = "rgba(255,255,255,0.3)";
            ctx.fillRect(x + 8, y + 2, w - 16, 4);
            break;

        case 'scifi':
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#e94560";
            ctx.fillStyle = "#1a1a2e";
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = "#e94560";
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#e94560";
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(x + w / 4 + i * w / 4, y + h / 2, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            break;

        case 'ice':
            const iceGradient = ctx.createLinearGradient(x, y, x, y + h);
            iceGradient.addColorStop(0, "rgba(200,240,255,0.9)");
            iceGradient.addColorStop(1, "rgba(50,150,220,0.9)");
            ctx.fillStyle = iceGradient;
            roundRect(ctx, x, y, w, h, 10);
            ctx.fill();
            ctx.shadowBlur = 15;
            ctx.shadowColor = "rgba(100,200,255,0.6)";
            ctx.strokeStyle = "rgba(255,255,255,0.5)";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.shadowBlur = 0;
            break;

        case 'gold':
            const goldGradient = ctx.createLinearGradient(x, y, x, y + h);
            goldGradient.addColorStop(0, "#ffd700");
            goldGradient.addColorStop(0.5, "#ffaa00");
            goldGradient.addColorStop(1, "#b8860b");
            ctx.fillStyle = goldGradient;
            roundRect(ctx, x, y, w, h, 8);
            ctx.fill();
            ctx.shadowBlur = 20;
            ctx.shadowColor = "rgba(255,215,0,0.5)";
            ctx.fillStyle = "rgba(255,255,255,0.4)";
            ctx.fillRect(x + 10, y + 3, w - 20, 6);
            ctx.shadowBlur = 0;
            break;

        case 'neon':
            ctx.fillStyle = "#222";
            roundRect(ctx, x, y, w, h, 10);
            ctx.fill();
            ctx.shadowBlur = 25;
            ctx.shadowColor = "#0ff";
            ctx.strokeStyle = "#0ff";
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = "rgba(0,255,255,0.2)";
            ctx.fillRect(x + 5, y + 5, w - 10, h - 10);
            ctx.shadowBlur = 0;
            break;

        case 'retro':
            ctx.fillStyle = "#0f380f";
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = "#306230";
            ctx.fillRect(x + 4, y - 2, w - 8, 4);
            ctx.fillRect(x + 4, y + h - 2, w - 8, 4);
            ctx.fillRect(x - 2, y + 4, 4, h - 8);
            ctx.fillRect(x + w - 2, y + 4, 4, h - 8);
            ctx.fillStyle = "#8bac0f";
            ctx.fillRect(x + 8, y + 4, w - 16, h - 8);
            const blink = Math.sin(Date.now() / 200) > 0;
            ctx.fillStyle = blink ? "#9bbc0f" : "#0f380f";
            ctx.fillRect(x + w / 2 - 6, y + 6, 12, 6);
            break;
    }

    // Котики/собачки на битке
    if (currentPaddleStyle !== 'retro') {
        ctx.font = `${PADDLE_H - 4}px Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji`;
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 2;
        ctx.shadowColor = "black";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🐱🐶", x + w / 2, y + h / 2);
        ctx.shadowBlur = 0;
        ctx.textAlign = "left";
    }

    // Индикатор ATTACK
    if (attackActive) {
        ctx.fillStyle = "#ff4444";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ff0000";
        const centerX = x + w / 2;
        const triangleY = y - 8;
        const triangleSize = 8;
        ctx.beginPath();
        ctx.moveTo(centerX, triangleY - triangleSize);
        ctx.lineTo(centerX - triangleSize, triangleY + triangleSize);
        ctx.lineTo(centerX + triangleSize, triangleY + triangleSize);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// Глобальные функции для модального окна
window.openPaddleModal = function () {
    paused = true;
    const modal = document.getElementById('paddleModal');
    modal.classList.add('active');

    document.querySelectorAll('.paddle-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.paddle === currentPaddleStyle);
    });
};

window.closePaddleModal = function () {
    document.getElementById('paddleModal').classList.remove('active');
    paused = false;
};

window.selectPaddle = function (style) {
    currentPaddleStyle = style;
    savePaddleStyle();
    document.querySelectorAll('.paddle-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.paddle === style);
    });
    setTimeout(closePaddleModal, 200);
};