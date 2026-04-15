// js/bonuses.js

let bonusDrops = [];
let activeBonus = null;
let megaBallActive = false;
let magnetActive = false;
let attackActive = false;

function spawnBonusDrop(x, y, bonusType) {
    if (!bonusType) return;
    bonusDrops.push({
        x: x + BRICK_W / 2,
        y: y + BRICK_H / 2,
        type: bonusType,
        vy: 2.7,
        active: true
    });
}

function updateBonusDrops() {
    for (let i = bonusDrops.length - 1; i >= 0; i--) {
        const drop = bonusDrops[i];
        drop.y += drop.vy;

        const bonusSize = 24;
        if (drop.y + bonusSize >= PADDLE_Y &&
            drop.y - bonusSize <= PADDLE_Y + PADDLE_H &&
            drop.x + bonusSize >= paddleX &&
            drop.x - bonusSize <= paddleX + PADDLE_W) {

            applyBonus(drop.type);
            playBonusCollect();
            bonusDrops.splice(i, 1);
            continue;
        }

        if (drop.y - bonusSize > H) {
            bonusDrops.splice(i, 1);
        }
    }
}

function drawBonusDrops(ctx) {
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#FFFF00";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const drop of bonusDrops) {
        let emoji = "❓";
        switch (drop.type) {
            case 'EXTEND': emoji = "↔️"; break;
            case 'SHRINK': emoji = "⛄"; break;
            case 'EXTRA_LIFE': emoji = "❤️"; break;
            case 'SLOW': emoji = "🐢"; break;
            case 'FAST': emoji = "⚡"; break;
            case 'MEGA': emoji = "💥"; break;
            case 'MAGNET': emoji = "🧲"; break;
            case 'ATTACK': emoji = "🔺"; break;
            case 'BOMB': emoji = "💣"; break;
            default: emoji = "⭐"; break;
        }
        ctx.font = "bold 38px Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(emoji, drop.x, drop.y);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#00000033";
        ctx.fillText(emoji, drop.x + 2, drop.y + 3);
    }
    ctx.shadowBlur = 0;
}

function updateBonusDisplay() {
    const el = document.getElementById('bonusIndicator');
    if (megaBallActive) {
        el.innerHTML = `BONUS: MEGA BALL`;
        el.style.color = "#ff88ff";
    } else if (attackActive && activeBonus === 'ATTACK') {
        el.innerHTML = `BONUS: ATTACK`;
        el.style.color = "#ff4444";
    } else if (attackActive && activeBonus && activeBonus !== 'ATTACK') {
        el.innerHTML = `BONUS: ATTACK + ${activeBonus}`;
        el.style.color = "#ff44ff";
    } else if (activeBonus) {
        el.innerHTML = `BONUS: ${activeBonus}`;
        el.style.color = "#ffdd88";
    } else {
        // Форматированная строка с цветными буквами
        el.innerHTML = `
            <span style="color:#44ffff;">H</span>elp · 
            <span style="color:#44ffff;">Space</span> - pause · 
            <span style="color:#44ffff;">B</span>at · 
            <span style="color:#44ffff;">M</span>usic ·
            <span style="color:#44ffff;">N</span>ext track · 
            <span style="color:#44ffff;">D</span>emo · 
            <span style="color:#44ffff;">T</span>op · 
            <span style="color:#44ffff;">L</span>vl · 
            <span style="color:#44ffff;">E</span>xit
        `;
        el.style.color = "#ffdd88";
    }
}

function applyBonus(type) {


 if (demoMode) {
        playBonusCollect();
        return;
    }
    // Сброс предыдущих эффектов (кроме ATTACK)
    if (activeBonus && activeBonus !== 'ATTACK') {
        PADDLE_W = 144;
        // ❌ УБИРАЕМ СБРОС СКОРОСТИ!
        // let speed = Math.hypot(ball.dx, ball.dy);
        // if (speed > 0) {
        //     ball.dx = (ball.dx / speed) * 4;
        //     ball.dy = (ball.dy / speed) * 4;
        // }
    }
    magnetActive = false;

    switch (type) {
        case 'EXTEND':
            PADDLE_W = Math.min(240, PADDLE_W + 60);
            paddleX = Math.min(W - PADDLE_W, paddleX);
            activeBonus = type;
            break;
        case 'SHRINK':
            PADDLE_W = Math.max(80, PADDLE_W - 50);
            paddleX = Math.min(W - PADDLE_W, Math.max(0, paddleX));
            activeBonus = type;
            break;
        case 'EXTRA_LIFE':
            lives++;
            updateUI();
            activeBonus = type;
            break;
        case 'SLOW':
            ball.dx *= 0.75;
            ball.dy *= 0.75;
            activeBonus = type;
            break;
        case 'FAST':
            ball.dx *= 1.3;
            ball.dy *= 1.3;
            activeBonus = type;
            break;
        case 'MEGA':
            megaBallActive = true;
            activeBonus = null;
            updateBonusDisplay();
            setTimeout(() => {
                megaBallActive = false;
                updateBonusDisplay();
            }, 10000);
            return;
        case 'MAGNET':
            magnetActive = true;
            activeBonus = type;
            break;
        case 'ATTACK':
            attackActive = true;
            activeBonus = type;
            break;
            case 'BOMB':
    // Увеличиваем счётчик бомб
    bombCount++;
    updateBombDisplay();
    activeBonus = type;
    break;
    }

    updateBonusDisplay();

    if (type !== 'MEGA') {
        setTimeout(() => {
            if (activeBonus === type) {
                if (type === 'SHRINK' || type === 'EXTEND') PADDLE_W = 144;
                if (type === 'SLOW') { ball.dx /= 0.75; ball.dy /= 0.75; }
                if (type === 'FAST') { ball.dx /= 1.3; ball.dy /= 1.3; }
                if (type === 'MAGNET') magnetActive = false;
                if (type === 'ATTACK') {
                    attackActive = false;
                    bullets = [];
                }
                if (type !== 'EXTRA_LIFE') {
                    activeBonus = null;
                    updateBonusDisplay();
                }
            }
        }, 12000);
    }
}