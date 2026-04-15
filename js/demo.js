// js/demo.js - Демо-режим с автопилотом

let demoInterval = null;
let demoPaddleSpeed = 12;

function startDemoMode() {
    if (demoMode) return;
    
     demoMode = true;
    
    // Сохраняем оригинальную стрельбу
    if (typeof window.originalShootBullet === 'undefined') {
        window.originalShootBullet = shootBullet;
    }
    window.shootBullet = function() {};
    
    // Сбрасываем игру
    gameOver = false;
    winFlag = false;
    paused = false;
    score = 0;
    lives = 3;
    bombCount = 0;
    isRandomMode = true;
    
    levelNumber = 1;
    loadLevel(0);
    resetBallAndPaddle();
    ballLaunched = true;
    
    megaBallActive = false;
    magnetActive = false;
    attackActive = false;
    bullets = [];
    
    updateUI();
    startAutoPilot();
    
}

function stopDemoMode() {
    if (!demoMode) return;
    
    demoMode = false;
    
    if (demoInterval) {
        clearInterval(demoInterval);
        demoInterval = null;
    }
    
    if (window.originalShootBullet) {
        window.shootBullet = window.originalShootBullet;
    }
    
}

function startAutoPilot() {
    if (demoInterval) clearInterval(demoInterval);
    
     demoInterval = setInterval(() => {
        if (!demoMode || gameOver || paused) return;
        
        // Двигаем ракетку к мячу
        const ballX = ball.x;
        const paddleCenter = paddleX + PADDLE_W / 2;
        
        if (ballX > paddleCenter + 10) {
            paddleX = Math.min(W - PADDLE_W, paddleX + demoPaddleSpeed);
        } else if (ballX < paddleCenter - 10) {
            paddleX = Math.max(0, paddleX - demoPaddleSpeed);
        }
        
        // Автоматический запуск мяча
        if (!ballLaunched) {
            ballLaunched = true;
        }
    }, 16);
}

function toggleDemoMode() {
      if (demoMode) {
        stopDemoMode();
        restartGame();
    } else {
        startDemoMode();
    }
}