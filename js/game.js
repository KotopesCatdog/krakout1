// js/game.js

// ====================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ======================
// Лиса
let fox = { x: 0, y: 0, active: false, dx: 2, dy: 2, radius: 15 };
let foxTimer = null;
let foxTimerInterval = null;
let foxRemainingTime = 0;
let foxMaxTime = 20; // 20 секунд

let demoMode = false;
let demoDrift = 0;
let demoDriftTimer = 0;
let ball = { x: W/2, y: PADDLE_Y - 8, dx: 3.2, dy: -4.2, radius: 10 };
let ballLaunched = false;
let magnetOffsetX = 0;

let bricks = [];
let bricksOffset = 0;
let brickMoveDirection = 1;

let playerName = localStorage.getItem('krakout_player_name') || "Player";

let score = 0;
let lives = 3;
let currentLevel = 0;
let gameOver = false;
let winFlag = false;
let immortalMode = false;
let speedIncreaseInterval = null;
let lastSpeedIncreaseTime = 0;
let currentBallSpeedMultiplier = 1.0;
const BASE_BALL_SPEED_X = 3.2;
const BASE_BALL_SPEED_Y = 4.2;

let leftPressed = false;
let rightPressed = false;
let paused = false;
let pointerLockActive = false;

let bullets = [];




// Данные для движущихся блоков
let movingBricksList = [];


// Бомбы
// let bombCount = 0; // бомбы на старте

// Генератор уровней
let levelNumber = 1;
let currentLevelData = null;
let isRandomMode = false;

// Таблица рекордов
let currentHighScore = 0;

function spawnFox() {
    if (fox.active) return;
    if (gameOver || paused || demoMode) return;
    
    // Спавн с краю экрана, НО НЕ НА МЯЧЕ
    let safe = false;
    let attempts = 0;
    
    while (!safe && attempts < 20) {
        fox.x = Math.random() * (W - 100) + 50;
        fox.y = Math.random() * (H / 2) + 30;
        
        const distToBall = Math.hypot(fox.x - ball.x, fox.y - ball.y);
        if (distToBall > 100) {
            safe = true;
        }
        attempts++;
    }
    
    fox.dx = (Math.random() - 0.5) * 2;
    fox.dy = Math.abs(Math.random() * 2) + 1;
    fox.active = true;
    foxRemainingTime = foxMaxTime;
    foxMaxTime = 20; // 20 секунд
    
    // Обновляем полоску
    updateFoxTimerBar();
    
    playFoxSound();
    
    // Очищаем старые таймеры
    if (foxTimer) clearTimeout(foxTimer);
    if (foxTimerInterval) clearInterval(foxTimerInterval);
    
    // Таймер для исчезновения через 20 секунд
    foxTimer = setTimeout(() => {
    if (fox.active) {
        fox.active = false;
        updateFoxTimerBar();
        if (foxTimerInterval) clearInterval(foxTimerInterval);
   }
}, foxMaxTime * 1000); // 20000 (20 секунд)
    
    // Интервал для обновления полоски (каждые 100 мс)
    foxTimerInterval = setInterval(() => {
        if (fox.active) {
            foxRemainingTime -= 0.1;
            if (foxRemainingTime <= 0) {
                foxRemainingTime = 0;
                fox.active = false;
                updateFoxTimerBar();
                if (foxTimerInterval) clearInterval(foxTimerInterval);
                console.log("🦊 Лиса исчезла (таймер)");
            } else {
                updateFoxTimerBar();
            }
        }
    }, 100);
}

function updateFox() {
    if (!fox.active) return;
    
    fox.x += fox.dx;
    fox.y += fox.dy;
    
    // Отскок от стен
    if (fox.x - fox.radius <= 0) {
        fox.x = fox.radius;
        fox.dx = -fox.dx;
    }
    if (fox.x + fox.radius >= W) {
        fox.x = W - fox.radius;
        fox.dx = -fox.dx;
    }
    if (fox.y - fox.radius <= 0) {
        fox.y = fox.radius;
        fox.dy = -fox.dy;
    }
    if (fox.y + fox.radius >= H) {
        fox.y = H - fox.radius;
        fox.dy = -fox.dy;
    }
    
    // Отскок от блоков
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const brick = bricks[row][col];
            if (!brick || !brick.active) continue;
            
            if (fox.x + fox.radius > brick.x && fox.x - fox.radius < brick.x + BRICK_W &&
                fox.y + fox.radius > brick.y && fox.y - fox.radius < brick.y + BRICK_H) {
                const overlapLeft = (fox.x + fox.radius) - brick.x;
                const overlapRight = (brick.x + BRICK_W) - (fox.x - fox.radius);
                const overlapTop = (fox.y + fox.radius) - brick.y;
                const overlapBottom = (brick.y + BRICK_H) - (fox.y - fox.radius);
                
                if (Math.min(overlapLeft, overlapRight) < Math.min(overlapTop, overlapBottom)) {
                    fox.dx = -fox.dx;
                } else {
                    fox.dy = -fox.dy;
                }
                break;
            }
        }
    }
    
    // Проверка касания мяча
    const distToBall = Math.hypot(fox.x - ball.x, fox.y - ball.y);
    if (distToBall < fox.radius + ball.radius) {
        playFoxSound();
        fox.active = false;
        if (foxTimer) clearTimeout(foxTimer);
        
        if (!immortalMode && !demoMode) {
            lives--;
            updateUI();
            playLifeLost();
            saveGame();
        }
        
        if (lives <= 0 && !immortalMode && !demoMode) {
            gameOver = true;
            ballLaunched = false;
        } else {
            resetBallAndPaddle();
            ballLaunched = false;
            activeBonus = null;
            megaBallActive = false;
            magnetActive = false;
            attackActive = false;
            bullets = [];
            PADDLE_W = 144;
            updateBonusDisplay();
        }
    }
}

// ========== ПОЛОСКА ВРЕМЕНИ ЛИСЫ (ОТДЕЛЬНАЯ ФУНКЦИЯ) ==========
function updateFoxTimerBar() {
    const fill = document.getElementById('foxTimerFill');
    const valueEl = document.getElementById('foxTimerValue');
    
    if (!fill) return;
    
    if (fox.active) {
        const percent = (foxRemainingTime / foxMaxTime) * 100;
        fill.style.width = `${percent}%`;
        if (valueEl) valueEl.innerText = `${Math.ceil(foxRemainingTime)}s`;
        if (percent < 30) {
            fill.style.background = "linear-gradient(90deg, #ff8888, #ff4444, #aa2222)";
        } else {
            fill.style.background = "linear-gradient(90deg, #88ff88, #44ff44, #22aa22)";
        }
    } else {
        fill.style.width = `0%`;
        if (valueEl) valueEl.innerText = `--s`;
    }
}

//  тест
// function startFoxSpawner() {
//    setInterval(() => {
//        if (!gameOver && !paused && !demoMode && !fox.active) {
//            spawnFox();
//        }
//    }, 8000); // каждые 8 секунд
// }


 function startFoxSpawner() {
    function schedule() {
// Случайный интервал от 40 до 60 секунд
        const delay = 40000 + Math.random() * 20000;
        setTimeout(() => {
            if (!gameOver && !paused && !demoMode && !fox.active) {
                spawnFox();
            }
// После проверки планируем следующее появление
            schedule();
        }, delay);
    }
    // Запускаем первый раз через 40-60 секунд
    schedule();
 }



// ====================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ======================
function updateBombDisplay() {
    const bombEl = document.getElementById('bombValue');
    if (bombEl) {
        bombEl.innerText = bombCount.toString().padStart(2, '0');
    }
}

// ====================== SUPABASE ======================
const SUPABASE_URL = "https://hewlajcgcyaoitdethhq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhld2xhamNnY3lhb2l0ZGV0aGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDIyNTcsImV4cCI6MjA5MTQ3ODI1N30.-OYgXzzjUXJA2Bc95CZVpKCErZED6HMNdEFwZpslbD4";

// ====================== ИНИЦИАЛИЗАЦИЯ ======================
async function initGame() {
    loadPlayerName();
    loadGeneratorSettingsFromLocal();
    currentPaddleStyle = loadPaddleStyle();
    PADDLE_W = 144;
    paddleX = (W - PADDLE_W) / 2;

    populateLevelSelect();
    loadGame();
    loadLevel(currentLevel);
    updateUI();
    startBackgroundRotation();
    gameLoop();
   
    const scores = await loadHighScores();
    if (scores.length > 0) {
        currentHighScore = scores[0].score;
    }
    
     startFoxSpawner();
}


function resetBallSpeed() {
    currentBallSpeedMultiplier = 1.0;
    
    if (ballLaunched) {
        const signX = ball.dx > 0 ? 1 : -1;
        const signY = ball.dy > 0 ? 1 : -1;
        ball.dx = signX * BASE_BALL_SPEED_X;
        ball.dy = signY * BASE_BALL_SPEED_Y;
    }
    
   }

// Основной игровой цикл
function gameLoop() {
    if (!gameOver && !paused && !document.getElementById('paddleModal').classList.contains('active')) {
        handlePaddleInput();
        updateBricksMovement();
        updateMovingBricks();
        updateBallMovement();
        updateBullets();
        updateBonusDrops();
         updateFox();
    }

    draw();
    requestAnimationFrame(gameLoop);
}

// ====================== ДВИЖУЩИЕСЯ БЛОКИ ======================

function calculateMovingLimits(mb) {
    const row = mb.row;
    const col = mb.col;
    const brickWidth = BRICK_W;
    
    let leftBlockCol = -1;
    for (let c = col - 1; c >= 0; c--) {
        const brick = bricks[row][c];
        if (brick && brick.active) {
            leftBlockCol = c;
            break;
        }
    }
    
    let rightBlockCol = COLS;
    for (let c = col + 1; c < COLS; c++) {
        const brick = bricks[row][c];
        if (brick && brick.active) {
            rightBlockCol = c;
            break;
        }
    }
    
    if (leftBlockCol === -1) {
        mb.leftLimit = 0;
    } else {
        const leftBrick = bricks[row][leftBlockCol];
        mb.leftLimit = leftBrick.x + brickWidth;
    }
    
    if (rightBlockCol === COLS) {
        mb.rightLimit = W - brickWidth;
    } else {
        const rightBrick = bricks[row][rightBlockCol];
        mb.rightLimit = rightBrick.x - brickWidth;
    }
}

function initMovingBricks() {
    movingBricksList = [];
    
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const brick = bricks[row][col];
            if (brick && brick.active && brick.type === 13) {
                movingBricksList.push({
                    row: row,
                    col: col,
                    brick: brick,
                    originalX: brick.originalX,
                    originalY: brick.originalY,
                    currentX: brick.x,
                    currentY: brick.y,
                    direction: 1,
                    isMoving: false,
                    speed: 1.5,
                    leftLimit: 0,
                    rightLimit: 0
                });
            }
        }
    }
    
    for (let mb of movingBricksList) {
        calculateMovingLimits(mb);
    }
    
    if (movingBricksList.length > 0) {
    
    }
}

function hasEmptyNeighbor(movingBrick) {
    const row = movingBrick.row;
    const col = movingBrick.col;
    
    let leftEmpty = false;
    if (col === 0) {
        leftEmpty = true;
    } else if (bricks[row][col - 1]) {
        leftEmpty = !bricks[row][col - 1].active;
    }
    
    let rightEmpty = false;
    if (col === COLS - 1) {
        rightEmpty = true;
    } else if (bricks[row][col + 1]) {
        rightEmpty = !bricks[row][col + 1].active;
    }
    
    return leftEmpty || rightEmpty;
}

function updateMovingBricks() {
    let changed = false;
    
    for (let i = 0; i < movingBricksList.length; i++) {
        const mb = movingBricksList[i];
        if (!mb.brick.active) continue;
        
        const emptyNearby = hasEmptyNeighbor(mb);
        
        if (emptyNearby && !mb.isMoving) {
            mb.isMoving = true;
            calculateMovingLimits(mb);
        }
        
        if (!mb.isMoving) continue;
        
        let newX = mb.brick.x + mb.speed * mb.direction;
        
        if (newX <= mb.leftLimit) {
            newX = mb.leftLimit;
            mb.direction *= -1;
        } else if (newX + BRICK_W >= mb.rightLimit + BRICK_W) {
            newX = mb.rightLimit;
            mb.direction *= -1;
        }
        
        if (mb.brick.x !== newX) {
            mb.brick.x = newX;
            changed = true;
        }
    }
    
    return changed;
}

function onBrickDestroyedForMoving(destroyedRow, destroyedCol) {
    for (let mb of movingBricksList) {
        if (!mb.brick.active) continue;
        
        const isLeftNeighbor = (mb.row === destroyedRow && mb.col === destroyedCol + 1);
        const isRightNeighbor = (mb.row === destroyedRow && mb.col === destroyedCol - 1);
        
        if (isLeftNeighbor || isRightNeighbor) {
            calculateMovingLimits(mb);
            if (hasEmptyNeighbor(mb) && !mb.isMoving) {
                mb.isMoving = true;
            }
        }
        
        if (mb.row === destroyedRow) {
            calculateMovingLimits(mb);
        }
    }
}

// ====================== ГЕНЕРАТОР УРОВНЕЙ ======================
let generatorSettings = {
    symmetry: ['none'],
    pattern: ['diamond'],
    movement: ['both'],
    density: 0.7,
    complexity: 0.2
};

function openGeneratorModal() {
    const modal = document.getElementById('generatorModal');
    if (modal) {
        loadSettingsToForm();
        modal.classList.add('active');
        paused = true;
    }
}

function closeGeneratorModal() {
    const modal = document.getElementById('generatorModal');
    if (modal) {
        modal.classList.remove('active');
        paused = false;
    }
}

function loadSettingsToForm() {
    const groups = document.querySelectorAll('#generatorModal .gen-group');
    if (groups.length === 0) return;
    
    const symmetryCheckboxes = groups[0].querySelectorAll('input');
    symmetryCheckboxes.forEach(cb => {
        cb.checked = generatorSettings.symmetry.includes(cb.value);
    });
    
    const patternCheckboxes = groups[1].querySelectorAll('input');
    patternCheckboxes.forEach(cb => {
        cb.checked = generatorSettings.pattern.includes(cb.value);
    });
    
    const movementCheckboxes = groups[2].querySelectorAll('input');
    movementCheckboxes.forEach(cb => {
        cb.checked = generatorSettings.movement.includes(cb.value);
    });
    
    const densitySlider = document.getElementById('genDensity');
    const complexitySlider = document.getElementById('genComplexity');
    if (densitySlider) densitySlider.value = generatorSettings.density;
    if (complexitySlider) complexitySlider.value = generatorSettings.complexity;
    
    const densityVal = document.getElementById('densityValue');
    const complexityVal = document.getElementById('complexityValue');
    if (densityVal) densityVal.innerText = generatorSettings.density;
    if (complexityVal) complexityVal.innerText = generatorSettings.complexity;
}

function saveGeneratorSettings() {
    const groups = document.querySelectorAll('#generatorModal .gen-group');
    if (groups.length === 0) return;
    
    generatorSettings.symmetry = Array.from(groups[0].querySelectorAll('input:checked')).map(cb => cb.value);
    generatorSettings.pattern = Array.from(groups[1].querySelectorAll('input:checked')).map(cb => cb.value);
    generatorSettings.movement = Array.from(groups[2].querySelectorAll('input:checked')).map(cb => cb.value);
    
    const densitySlider = document.getElementById('genDensity');
    const complexitySlider = document.getElementById('genComplexity');
    if (densitySlider) generatorSettings.density = parseFloat(densitySlider.value);
    if (complexitySlider) generatorSettings.complexity = parseFloat(complexitySlider.value);
    
    if (generatorSettings.symmetry.length === 0) generatorSettings.symmetry = ['none'];
    if (generatorSettings.pattern.length === 0) generatorSettings.pattern = ['random_blobs'];
    if (generatorSettings.movement.length === 0) generatorSettings.movement = ['none'];
    
    saveGeneratorSettingsToLocal();
    closeGeneratorModal();
    
}

function getRandomFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function saveGeneratorSettingsToLocal() {
    localStorage.setItem('krakout_generator_settings', JSON.stringify(generatorSettings));
    
}

function loadGeneratorSettingsFromLocal() {
    const saved = localStorage.getItem('krakout_generator_settings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            generatorSettings = settings;
            
        } catch (e) {
           
        }
    } else {
        generatorSettings = {
            symmetry: ['none'],
            pattern: ['diamond'],
            movement: ['both'],
            density: 0.7,
            complexity: 0.2
        };
        
    }
}

function generateRandomLevel(levelNum) {
    const symmetry = getRandomFromArray(generatorSettings.symmetry);
    const pattern = getRandomFromArray(generatorSettings.pattern);
    const movement = getRandomFromArray(generatorSettings.movement);
    const density = generatorSettings.density;
    const complexity = generatorSettings.complexity;
    
   
    
    const layout = generateLayout(symmetry, pattern, density, complexity);
    
    return {
        name: `Уровень ${levelNum}`,
        layout: layout,
        movement: movement === 'none' ? 'none' : movement,
        movementSpeed: 0.6 + Math.random() * 1.2
    };
}

function generateLayout(symmetry, pattern, density, complexity) {
    const layout = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    const midC = Math.floor(COLS / 2);
    const midR = Math.floor(ROWS / 2);
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            let shouldFill = false;
            if (pattern === 'diamond') {
                const dist = Math.abs(r - midR) + Math.abs(c - midC);
                shouldFill = dist <= 4 && r > 0;
            } else if (pattern === 'pyramid') {
                shouldFill = r >= 2 && Math.abs(c - midC) <= (r - 1);
            } else if (pattern === 'frame') {
                shouldFill = (r === 1 || r === ROWS - 2 || c === 1 || c === COLS - 2) && r > 0;
            } else if (pattern === 'rows') {
                shouldFill = r % 2 === 1 && r > 0;
            } else if (pattern === 'random_blobs') {
                shouldFill = Math.random() < density;
            }
            if (shouldFill && Math.random() < density) {
                layout[r][c] = 1;
            }
        }
    }
    
    // Симметрия
    if (symmetry === 'horizontal') {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < Math.floor(COLS / 2); c++) {
                layout[r][COLS - 1 - c] = layout[r][c];
            }
        }
    } else if (symmetry === 'vertical') {
        for (let r = 0; r < Math.floor(ROWS / 2); r++) {
            for (let c = 0; c < COLS; c++) {
                layout[ROWS - 1 - r][c] = layout[r][c];
            }
        }
    } else if (symmetry === 'central') {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < Math.floor(COLS / 2); c++) {
                layout[ROWS - 1 - r][COLS - 1 - c] = layout[r][c];
            }
        }
    }
    
    // Типы блоков
    const simpleIds = [3, 4, 5, 6, 7, 8, 10, 11, 12];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (layout[r][c] === 0) continue;
            const rand = Math.random();
            if (rand < complexity * 0.2) {
                layout[r][c] = 9;
            } else if (rand < complexity * 0.4) {
                layout[r][c] = 13;
            } else if (rand < complexity * 0.6) {
                layout[r][c] = 2;
            } else if (rand < complexity * 0.8) {
                layout[r][c] = 1;
            } else {
                layout[r][c] = simpleIds[(r + c) % simpleIds.length];
            }
        }
    }
    fixEnclosedBlocks(layout);
    return layout;
}

function fixEnclosedBlocks(layout) {
    const simpleIds = [3, 4, 5, 6, 7, 8, 10, 11, 12];
    let changes = 0;
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const type = layout[r][c];
            if (type === 0 || type === 9) continue;
            
            let hasPathToTop = false;
            
            for (let row = r - 1; row >= 0; row--) {
                const cellType = layout[row][c];
                if (cellType === 0) {
                    hasPathToTop = true;
                    break;
                }
                if (cellType === 9) break;
            }
            
            if (!hasPathToTop) {
                for (let col = c - 1; col <= c + 1; col++) {
                    if (col < 0 || col >= COLS) continue;
                    if (col === c) continue;
                    
                    for (let row = r; row >= 0; row--) {
                        const cellType = layout[row][col];
                        if (cellType === 0) {
                            hasPathToTop = true;
                            break;
                        }
                        if (cellType === 9) break;
                    }
                    if (hasPathToTop) break;
                }
            }
            
            if (!hasPathToTop) {
                for (let row = r - 1; row >= 0; row--) {
                    if (layout[row][c] === 9) {
                        layout[row][c] = simpleIds[Math.floor(Math.random() * simpleIds.length)];
                        changes++;
                        break;
                    }
                }
            }
        }
    }
    
    if (changes > 0) {
        
    }
    return layout;
}


async function getPlayerIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.log("Не удалось получить IP:", error);
        return "unknown";
    }
}


// ====================== ОСНОВНЫЕ ФУНКЦИИ ======================

function loadLevel(levelIndex) {
    stopSpeedIncreaseTimer();
   
    let level;
    
    if (levelIndex === "random" || levelIndex >= LEVELS.length) {
        isRandomMode = true;
        level = generateRandomLevel(levelNumber);
        levelNumber++;
    } else {
        isRandomMode = false;
        level = LEVELS[levelIndex];
        levelNumber = levelIndex + 1;
    }
    
    currentLevelData = level;
    
    bricks = [];
    for (let row = 0; row < ROWS; row++) {
        bricks[row] = [];
        for (let col = 0; col < COLS; col++) {
            let brickType = level.layout[row]?.[col] || 0;
            let strength = 1;
            if (brickType === 1) strength = 2;
            else if (brickType === 2) strength = 3;
            else if (brickType === 9 || brickType === 13) strength = 999;

            bricks[row][col] = {
                active: brickType > 0,
                strength: strength,
                type: brickType,
                x: col * BRICK_W,
                y: BRICKS_TOP_Y + row * BRICK_H,
                originalX: col * BRICK_W,
                originalY: BRICKS_TOP_Y + row * BRICK_H,
                hiddenBonus: null
            };
        }
    }

    bricksOffset = 0;
    brickMoveDirection = 1;
    activeBonus = null;
    megaBallActive = false;
    magnetActive = false;
    attackActive = false;
    bullets = [];
    bonusDrops = [];
    magnetOffsetX = 0;
    PADDLE_W = 144;
    paddleX = (W - PADDLE_W) / 2;
    
    updateBombDisplay();

    initMovingBricks();
    generateRandomBonuses();
    resetBallAndPaddle();
    updateBonusDisplay();
    attackActive = false;
activeBonus = null;
    startSpeedIncreaseTimer();
    updateLevelName();
    
    return true;
}


function updateSpeedBar() {
    const fill = document.getElementById('speedBarFill');
    const valueEl = document.getElementById('speedValue');
    if (!fill) return;
    
    // Минимальное отображаемое значение 1.0, максимальное 3.0 (соответствует лимиту)
    const MIN_DISPLAY = 1.0;
    const MAX_DISPLAY = 3.0;  // ← ИЗМЕНИТЬ С 10 НА 3
    
    let percent = ((currentBallSpeedMultiplier - MIN_DISPLAY) / (MAX_DISPLAY - MIN_DISPLAY)) * 100;
    percent = Math.min(100, Math.max(0, percent));
    
    fill.style.width = `${percent}%`;
    
    if (valueEl) {
        valueEl.innerText = `${currentBallSpeedMultiplier.toFixed(1)}x`;
        
        // Меняем цвет в зависимости от процентов
        if (percent > 70) {
            valueEl.style.color = "#ff4444";
            valueEl.style.textShadow = "0 0 8px #ff0000";
        } else if (percent > 30) {
            valueEl.style.color = "#ffaa44";
            valueEl.style.textShadow = "0 0 5px #ff8800";
        } else {
            valueEl.style.color = "#44ff88";
            valueEl.style.textShadow = "0 0 5px #44ff88";
        }
    }
}

function generateRandomBonuses() {
// if (demoMode) return; 
    const bonusChance = 0.2;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const brick = bricks[row][col];
            if (brick.active && brick.type !== 9 && brick.type !== 13 && Math.random() < bonusChance) {
                const randomBonus = BONUS_TYPES_LIST[Math.floor(Math.random() * BONUS_TYPES_LIST.length)];
                brick.hiddenBonus = randomBonus;
            } else {
                brick.hiddenBonus = null;
            }
        }
    }
}

function updateBricksMovement() {
    if (!currentLevelData) return;
    const level = currentLevelData;
    if (!level || level.movement === "none") return;

    bricksOffset += level.movementSpeed * brickMoveDirection;
    if (Math.abs(bricksOffset) > 30) brickMoveDirection *= -1;

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const b = bricks[row][col];
            if (!b || !b.active) continue;
            if (b.type === 13) continue;
            
            let offsetX = 0, offsetY = 0;
            switch (level.movement) {
                case "horizontal": offsetX = Math.sin(bricksOffset * 0.1) * 16; break;
                case "vertical":   offsetY = Math.sin(bricksOffset * 0.12 + row) * 12; break;
                case "both":
                    offsetX = Math.sin(bricksOffset * 0.1) * 12;
                    offsetY = Math.cos(bricksOffset * 0.12 + row) * 10;
                    break;
            }
            b.x = b.originalX + offsetX;
            b.y = b.originalY + offsetY;
        }
    }
}

function resetBallAndPaddle() {
    paddleX = (W - PADDLE_W) / 2;
    ball.x = W / 2;
    ball.y = PADDLE_Y - ball.radius;
    ball.dx = BASE_BALL_SPEED_X * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = -BASE_BALL_SPEED_Y;
    ballLaunched = false;
    magnetOffsetX = 0;
   
    resetBallSpeed();
    stopSpeedIncreaseTimer();
    startSpeedIncreaseTimer();
    if (fox.active) {
        fox.active = false;
        if (foxTimer) clearTimeout(foxTimer);
    }
}

// ====================== УПРАВЛЕНИЕ СКОРОСТЬЮ МЯЧА ======================

function startSpeedIncreaseTimer() {
    if (speedIncreaseInterval) {
        clearInterval(speedIncreaseInterval);
        speedIncreaseInterval = null;
    }
    
    speedIncreaseInterval = setInterval(() => {
        if (ballLaunched && !paused && !gameOver) {
            currentBallSpeedMultiplier = Math.min(currentBallSpeedMultiplier + 0.1, 3);
            // applyBallSpeedMultiplier();  ← УДАЛИТЬ ИЛИ ЗАКОММЕНТИРОВАТЬ
            showSpeedIncreaseEffect();
          
        }
    }, 20000);
}

function applyBallSpeedMultiplier() {
    if (!ballLaunched) return;
    
    const signX = ball.dx > 0 ? 1 : -1;
    const signY = ball.dy > 0 ? 1 : -1;
    
    // Ограничиваем множитель до 3x
    const limitedMultiplier = Math.min(currentBallSpeedMultiplier, 3);
    
    // Применяем ограниченный множитель к базовой скорости
    let targetSpeedX = BASE_BALL_SPEED_X * limitedMultiplier;
    let targetSpeedY = BASE_BALL_SPEED_Y * limitedMultiplier;
    let targetSpeed = Math.hypot(targetSpeedX, targetSpeedY);
    
    let currentSpeed = Math.hypot(ball.dx, ball.dy);
    let angle = Math.atan2(ball.dy, ball.dx);
    
    // Плавно приближаем скорость к целевой
    if (currentSpeed < targetSpeed) {
        let newSpeed = Math.min(currentSpeed * 1.05, targetSpeed);
        ball.dx = signX * Math.abs(Math.cos(angle) * newSpeed);
        ball.dy = signY * Math.abs(Math.sin(angle) * newSpeed);
    }
}

function getCurrentSpeedMultiplier() {
    if (!ballLaunched) return 1.0;
    
    let currentSpeed = Math.hypot(ball.dx, ball.dy);
    let baseSpeed = Math.hypot(BASE_BALL_SPEED_X, BASE_BALL_SPEED_Y);
    return currentSpeed / baseSpeed;
}

function showSpeedIncreaseEffect() {
    window.speedFlash = 15;
}

function stopSpeedIncreaseTimer() {
    if (speedIncreaseInterval) {
        clearInterval(speedIncreaseInterval);
        speedIncreaseInterval = null;
    }
}

function handlePaddleInput() {


// ДЕМО-РЕЖИМ: автопилот (плавное движение)
if (demoMode && !gameOver && !paused) {
    // Обновляем дрифт каждые 5-15 секунд (случайно)
    demoDriftTimer++;
    const driftInterval = 300 + Math.random() * 600; // 5-15 секунд при 60fps
    if (demoDriftTimer > driftInterval) {
        demoDriftTimer = 0;
        // Случайное смещение цели от -40 до +40 пикселей
        demoDrift = (Math.random() - 0.5) * 80;
        
    }
    
    // Плавно возвращаем дрифт к нулю (чтобы не улететь слишком далеко)
    demoDrift *= 0.998;
    
    // Предсказываем позицию мяча
    const ballX = ball.x;
    const ballDX = ball.dx;
    const ballDY = ball.dy;
    
    let targetX = ballX;
    
    // Если мяч летит вниз, предсказываем место приземления
    if (ballDY > 0 && ballDY < 10) {
        const distanceToPaddle = PADDLE_Y - ball.y;
        const stepsToPaddle = distanceToPaddle / ballDY;
        const predictedX = ballX + ballDX * stepsToPaddle;
        targetX = Math.max(0, Math.min(W, predictedX));
    }
    
    // Целевая позиция ракетки НЕ по центру, а со смещением!
    // Вместо PADDLE_W/2 используем PADDLE_W * (0.3..0.7) в зависимости от дрифта
    let hitOffset = 0.5; // центр по умолчанию
    
    // В зависимости от дрифта меняем точку прицеливания
    if (demoDrift > 10) {
        hitOffset = 0.3; // ловить левой частью ракетки
    } else if (demoDrift < -10) {
        hitOffset = 0.7; // ловить правой частью ракетки
    } else {
        hitOffset = 0.5; // центром
    }
    
    let targetPaddleX = Math.max(0, Math.min(W - PADDLE_W, targetX - PADDLE_W * hitOffset));
    targetPaddleX = Math.max(0, Math.min(W - PADDLE_W, targetPaddleX + demoDrift * 0.5));
    
    // Плавное движение с ускорением
    const diff = targetPaddleX - paddleX;
    const speed = Math.min(Math.abs(diff) * 0.25, 6);
    const move = Math.min(Math.abs(diff), speed);
    
    if (diff > 0) {
        paddleX = Math.min(W - PADDLE_W, paddleX + move);
    } else if (diff < 0) {
        paddleX = Math.max(0, paddleX - move);
    }
    
    // Автозапуск мяча
    if (!ballLaunched) {
        ballLaunched = true;
    }
    
    // Отключаем ручное управление в демо-режиме
    return;
}
    
    
    
    
    
    // Оригинальный код управления
    if (paused) return;
    if (leftPressed) paddleX = Math.max(0, paddleX - 14);
    if (rightPressed) paddleX = Math.min(W - PADDLE_W, paddleX + 14);

    if (!ballLaunched && !gameOver) {
        ball.x = paddleX + PADDLE_W / 2 + magnetOffsetX;
        let minX = paddleX + ball.radius;
        let maxX = paddleX + PADDLE_W - ball.radius;
        ball.x = Math.max(minX, Math.min(maxX, ball.x));
        ball.y = PADDLE_Y - ball.radius;
    }
}

// ====================== ФИЗИКА ======================

function updateBallMovement() {
    if (!ballLaunched && !paused && !gameOver && demoMode) {
        ballLaunched = true;  // Автоматически запускаем мяч в демо-режиме
    }
    if (!ballLaunched || paused) return;

    ball.x += ball.dx;
    ball.y += ball.dy;

    // Стены (левая и правая)
    if (ball.x - ball.radius <= 0) { 
        ball.x = ball.radius; 
        ball.dx = -ball.dx;
    }
    if (ball.x + ball.radius >= W) { 
        ball.x = W - ball.radius; 
        ball.dx = -ball.dx;
    }
    
    // Потолок
    if (ball.y - ball.radius <= 0) { 
        ball.y = ball.radius; 
        ball.dy = -ball.dy;
    }

    // Дополнительная защита от вылета за пределы
    if (ball.x < -100 || ball.x > W + 100 || ball.y < -100 || ball.y > H + 100) {
        ball.x = W / 2;
        ball.y = PADDLE_Y - ball.radius;
        ball.dx = BASE_BALL_SPEED_X * (Math.random() > 0.5 ? 1 : -1);
        ball.dy = -BASE_BALL_SPEED_Y;
        ballLaunched = false;
       
        return;
    }

    // Отскок от ракетки
if (ball.y + ball.radius >= PADDLE_Y && ball.y - ball.radius <= PADDLE_Y + PADDLE_H &&
    ball.x + ball.radius >= paddleX && ball.x - ball.radius <= paddleX + PADDLE_W) {

    let hitPos = (ball.x - paddleX) / PADDLE_W;
    let angle = (hitPos - 0.5) * 1.6;
    
    // Базовая скорость с множителем (ограничение до 3x)
    let baseSpeed = Math.hypot(BASE_BALL_SPEED_X, BASE_BALL_SPEED_Y);
    let limitedMultiplier = Math.min(currentBallSpeedMultiplier, 3);
    let speed = baseSpeed * limitedMultiplier;
    
    let newDirX = Math.sin(angle);
    let newDirY = -Math.cos(angle);
    let len = Math.hypot(newDirX, newDirY);
    if (len > 0) { 
        newDirX /= len; 
        newDirY /= len; 
    }

    ball.dx = newDirX * speed;
    ball.dy = newDirY * speed;
    
    ball.y = PADDLE_Y - ball.radius;
    playPaddleHit();

    if (magnetActive) {
        ballLaunched = false;
        magnetOffsetX = ball.x - (paddleX + PADDLE_W / 2);
    }
}

    // Потеря мяча (дно)
    if (ball.y + ball.radius >= H) {
    // В демо-режиме жизни не тратятся
    if (demoMode) {
        // Просто перезапускаем мяч без потери жизни
        resetBallAndPaddle();
        ballLaunched = false;
        activeBonus = null;
        megaBallActive = false;
        magnetActive = false;
        attackActive = false;
        bullets = [];
        PADDLE_W = 144;
        updateBonusDisplay();
        return;
    }
    
    if (!immortalMode) {
        lives--;
        updateUI();
        playLifeLost();
        saveGame();
    }
    if (lives <= 0 && !immortalMode) {
        gameOver = true;
        ballLaunched = false;
    } else {
        resetBallAndPaddle();
        ballLaunched = false;
        activeBonus = null;
        megaBallActive = false;
        magnetActive = false;
        attackActive = false;
        bullets = [];
        PADDLE_W = 144;
        updateBonusDisplay();
    }
    return;
}

    handleCollisionWithBricks();
}



function handleCollisionWithBricks() {
    let hitSomething = false;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const b = bricks[row][col];
            if (!b || !b.active) continue;

            const ballLeft = ball.x - ball.radius;
            const ballRight = ball.x + ball.radius;
            const ballTop = ball.y - ball.radius;
            const ballBottom = ball.y + ball.radius;

            if (ballRight > b.x && ballLeft < b.x + BRICK_W &&
                ballBottom > b.y && ballTop < b.y + BRICK_H) {

                hitSomething = true;

                if (b.type === 9 || b.type === 13) {
                    bounceOffBrick(b);
                    playBrickHit(1);
                    return true;
                }

                if (megaBallActive) {
    b.active = false;
    if (!demoMode) {
        score += 20;
    }
                    if (b.hiddenBonus) spawnBonusDrop(b.x, b.y, b.hiddenBonus);
                    playBrickHit(0);
                    updateUI();
                    saveGame();
                    onBrickDestroyedForMoving(row, col);
                    continue;
                }

                bounceOffBrick(b);

                b.strength--;
                let points = 10;
                if (b.strength <= 0) {
                    b.active = false;
                    points = 20;
                    playBrickHit(0);
                    if (b.hiddenBonus) spawnBonusDrop(b.x, b.y, b.hiddenBonus);
                    onBrickDestroyedForMoving(row, col);
                } else {
                    points = 5;
                    playBrickHit(b.strength);
                }
                if (!demoMode) {
    score += points;
}
                updateUI();
                saveGame();
                return true;
            }
        }
    }

    if (!hitSomething) {
        let hasNormalBricks = false;
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const b = bricks[row][col];
                if (b && b.active && b.type !== 9 && b.type !== 13) {
                    hasNormalBricks = true;
                    break;
                }
            }
            if (hasNormalBricks) break;
        }
        if (!hasNormalBricks && !gameOver) {
            showLevelCompleteModal();
        }
    }
    return hitSomething;
}

function bounceOffBrick(b) {
    const overlapLeft = (ball.x + ball.radius) - b.x;
    const overlapRight = (b.x + BRICK_W) - (ball.x - ball.radius);
    const overlapTop = (ball.y + ball.radius) - b.y;
    const overlapBottom = (b.y + BRICK_H) - (ball.y - ball.radius);

    if (Math.min(overlapLeft, overlapRight) < Math.min(overlapTop, overlapBottom)) {
        ball.dx = -ball.dx;
    } else {
        ball.dy = -ball.dy;
    }
}

function updateBullets() {
    if (!attackActive || paused) return;
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.y -= b.speed;

        if (b.y + b.height < 0) {
            bullets.splice(i, 1);
            continue;
        }

        let hit = false;
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const brick = bricks[row][col];
                if (!brick.active) continue;

                if (b.x + b.width > brick.x && b.x < brick.x + BRICK_W &&
                    b.y + b.height > brick.y && b.y < brick.y + BRICK_H) {

                    if (brick.type === 9 || brick.type === 13) {
                        hit = true;
                        playBrickHit(1);
                        break;
                    }

                    brick.strength--;
                    let points = 5;
                    if (brick.strength <= 0) {
                        brick.active = false;
                        points = 20;
                        playBrickHit(0);
                        if (brick.hiddenBonus) spawnBonusDrop(brick.x, brick.y, brick.hiddenBonus);
                        onBrickDestroyedForMoving(row, col);
                    } else {
                        playBrickHit(brick.strength);
                    }
                    score += points;
                    updateUI();
                    saveGame();
                    hit = true;
                    break;
                }
            }
            if (hit) break;
        }
        if (hit) bullets.splice(i, 1);
    }
}

function shootBullet() {
if (demoMode) return;
    if (window.event && window.event.button === 2) return;
    if (window.lastButton === 2) return;
    
    if (!attackActive || paused || gameOver) return;
    const bulletSpeed = 8;
    bullets.push({ x: paddleX + 10, y: PADDLE_Y, width: 4, height: 12, speed: bulletSpeed });
    bullets.push({ x: paddleX + PADDLE_W - 14, y: PADDLE_Y, width: 4, height: 12, speed: bulletSpeed });
    playLaserShoot();
}

// ====================== БОМБА ======================

function showExplosionEffect(x, y, radius) {
    window.explosionEffect = {
        x: x,
        y: y,
        radius: radius,
        alpha: 0.8,
        frames: 10
    };
}

function showNoBombEffect() {
    window.noBombFlash = 10;
}

function updateBombDisplay() {
    const bombEl = document.getElementById('bombValue');
    if (bombEl) {
        bombEl.innerText = bombCount.toString().padStart(2, '0');
    }
}

function activateBomb() {
    if (bombCount <= 0) return;
    if (gameOver || paused) return;
    
    bombCount--;
    updateBombDisplay();
    
    const EXPLOSION_RADIUS = 150;
    let bricksDestroyed = 0;
    
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const brick = bricks[row][col];
            if (!brick || !brick.active) continue;
            
            const brickCenterX = brick.x + BRICK_W / 2;
            const brickCenterY = brick.y + BRICK_H / 2;
            const dist = Math.hypot(brickCenterX - ball.x, brickCenterY - ball.y);
            
            if (dist <= EXPLOSION_RADIUS) {
                if (!demoMode) {
                    if (brick.type === 9 || brick.type === 13) {
                        score += 50;
                    } else {
                        score += 20;
                    }
                }
                
                if (brick.hiddenBonus) {
                    spawnBonusDrop(brick.x, brick.y, brick.hiddenBonus);
                }
                
                brick.active = false;
                bricksDestroyed++;
                onBrickDestroyedForMoving(row, col);
            }
        }
    }
    
    updateUI();
    saveGame();
    showExplosionEffect(ball.x, ball.y, EXPLOSION_RADIUS);
    
    playExplosionSound();
    
    let hasNormalBricks = false;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const b = bricks[row][col];
            if (b && b.active && b.type !== 9 && b.type !== 13) {
                hasNormalBricks = true;
                break;
            }
        }
        if (hasNormalBricks) break;
    }
    
    if (!hasNormalBricks && !gameOver) {
        showLevelCompleteModal();
    }
}

    


// ====================== ОТРИСОВКА ======================

function draw() {
    if (!paused) {
        pauseEmojis = [];
    }

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    drawBackground(ctx);
    ctx.shadowBlur = 0;

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const b = bricks[row][col];
            if (!b || !b.active) continue;

            let colors = BRICK_COLORS[b.type] || BRICK_COLORS[4];
            if (b.type === 9) colors = BRICK_COLORS[9];
            if (b.type === 13) colors = BRICK_COLORS[13] || BRICK_COLORS[9];

            ctx.fillStyle = megaBallActive ? "#FF88FF" : colors.main;
            ctx.fillRect(b.x, b.y, BRICK_W - 2, BRICK_H - 2);
            ctx.fillStyle = colors.light;
            ctx.fillRect(b.x + 4, b.y + 4, BRICK_W - 12, 7);
            ctx.fillStyle = colors.dark || "#00000044";
            ctx.fillRect(b.x + 4, b.y + BRICK_H - 9, BRICK_W - 12, 5);
            ctx.strokeStyle = "#FFFFFF99";
            ctx.lineWidth = 2;
            ctx.strokeRect(b.x + 2, b.y + 2, BRICK_W - 6, BRICK_H - 6);

            if (b.type === 13) {
                ctx.fillStyle = "#AAAAAA";
                ctx.beginPath();
                ctx.moveTo(b.x + 12, b.y + BRICK_H/2);
                ctx.lineTo(b.x + 18, b.y + BRICK_H/2 - 5);
                ctx.lineTo(b.x + 18, b.y + BRICK_H/2 + 5);
                ctx.fill();
                
                ctx.beginPath();
                ctx.moveTo(b.x + BRICK_W - 12, b.y + BRICK_H/2);
                ctx.lineTo(b.x + BRICK_W - 18, b.y + BRICK_H/2 - 5);
                ctx.lineTo(b.x + BRICK_W - 18, b.y + BRICK_H/2 + 5);
                ctx.fill();
            }

            if ((b.type === 1 || b.type === 2 || b.type === 9 || b.type === 13) && b.strength >= 2) {
                ctx.fillStyle = "#002233";
                const s = 10;
                if (b.strength >= 2 || b.type === 9 || b.type === 13) {
                    ctx.fillRect(b.x + 6, b.y + 6, s, 4);
                    ctx.fillRect(b.x + 6, b.y + 6, 4, s);
                }
                if (b.strength >= 3 || b.type === 9 || b.type === 13) {
                    ctx.fillRect(b.x + BRICK_W - 6 - s, b.y + BRICK_H - 10, s, 4);
                    ctx.fillRect(b.x + BRICK_W - 10, b.y + BRICK_H - 6 - s, 4, s);
                }
            }
        }
    }

    if (attackActive) {
        ctx.fillStyle = "#ff4444";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#ff8888";
        for (let b of bullets) {
            ctx.fillRect(b.x, b.y, b.width, b.height);
        }
        ctx.shadowBlur = 0;
    }

    drawPaddle(ctx);
    drawBonusDrops(ctx);
    
    ctx.shadowBlur = 12;
    ctx.shadowColor = megaBallActive ? "#ff88ff" : "#ffffff";

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius + 1, 0, Math.PI * 2);
    ctx.fillStyle = megaBallActive ? "rgba(255, 80, 255, 0.15)" : "rgba(255, 255, 255, 0.2)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = megaBallActive ? "rgba(255, 120, 255, 0.3)" : "rgba(255, 255, 255, 0.35)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius - 2, 0, Math.PI * 2);
    if (megaBallActive) {
        ctx.fillStyle = "#ff88ff";
    } else {
        ctx.fillStyle = "#ffffff";
    }
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ball.x - 3, ball.y - 3, 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ball.x - 1, ball.y - 1, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.fill();
    
    if (window.speedFlash && window.speedFlash > 0) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius + 8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 100, 255, ${window.speedFlash / 20})`;
        ctx.fill();
        window.speedFlash--;
    }
    
    if (window.explosionEffect && window.explosionEffect.frames > 0) {
        ctx.beginPath();
        ctx.arc(window.explosionEffect.x, window.explosionEffect.y, 
                window.explosionEffect.radius * (1 - window.explosionEffect.frames / 10), 
                0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 100, 0, ${window.explosionEffect.alpha})`;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(window.explosionEffect.x, window.explosionEffect.y, 
                window.explosionEffect.radius * 0.7 * (1 - window.explosionEffect.frames / 10), 
                0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 0, ${window.explosionEffect.alpha})`;
        ctx.fill();
        
        window.explosionEffect.frames--;
        window.explosionEffect.alpha -= 0.08;
    }
    
    if (window.noBombFlash && window.noBombFlash > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${window.noBombFlash / 20})`;
        ctx.fillRect(0, 0, W, H);
        window.noBombFlash--;
    }

    ctx.shadowBlur = 0;
    
    
    // ========== ЛИСА (РИСУЕМ ПОВЕРХ ВСЕГО) ==========
    if (fox.active) {
        ctx.fillStyle = "#ff4444";
        ctx.beginPath();
        ctx.arc(fox.x, fox.y, fox.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Эмодзи лисы поверх круга
        ctx.font = `26px "Segoe UI Emoji"`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("🦊", fox.x, fox.y);
    }
    
    

    if (paused && !gameOver && !document.getElementById('paddleModal').classList.contains('active')) {
        updatePauseEmojis();
        drawPauseEmojis(ctx);
        drawNeonPanel(ctx, "PAUSE", false);
    }

    if (gameOver) {
        drawNeonGameOver(ctx, winFlag);
    }
    

      updateSpeedBar();
      updateFoxTimerBar();
}





// Показываем реальную скорость мяча
if (ballLaunched) {
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.fillStyle = "#ffaa44";
    ctx.shadowBlur = 0;
    ctx.textAlign = "left";
    ctx.fillText(`Speed: ${Math.hypot(ball.dx, ball.dy).toFixed(1)}`, 10, 30);
    ctx.fillText(`Multiplier: ${currentBallSpeedMultiplier.toFixed(1)}x`, 10, 50);
}

// ====================== UI И СОХРАНЕНИЯ ======================

let lastThousandScore = 0;

function updateUI() {
    // Отображаем счёт или DEMO
    if (demoMode) {
        document.getElementById('scoreValue').innerText = "DEMO";
    } else {
        document.getElementById('scoreValue').innerText = score.toString().padStart(6, '0');
    }
    
    const livesEl = document.getElementById('livesValue');
    const livesBoard = document.getElementById('livesBoard');

    const thousands = Math.floor(score / 1000);
    if (thousands > lastThousandScore && !immortalMode && !demoMode) {
        const bonusLives = thousands - lastThousandScore;
        lives += bonusLives;
        lastThousandScore = thousands;
        
    }

    if (immortalMode) {
        livesEl.innerText = '∞';
        livesBoard.classList.add('immortal');
    } else {
        livesEl.innerText = lives.toString().padStart(3, '0');
        livesBoard.classList.remove('immortal');
    }
    updateLevelSelectValue();
    updateLevelName();
    updateBombDisplay();
}

function updateLevelName() {
    const el = document.getElementById('levelName');
    if (!el) return;
    
    if (isRandomMode || currentLevel === "random") {
        el.innerText = "РАНДОМ";
    } else if (LEVELS[currentLevel] && LEVELS[currentLevel].name) {
        el.innerText = LEVELS[currentLevel].name;
    } else {
        el.innerText = `Уровень ${currentLevel + 1}`;
    }
}

function updateLevelSelectValue() {
    const select = document.getElementById('levelSelect');
    if (select) select.value = currentLevel.toString();
}

function populateLevelSelect() {
    const select = document.getElementById('levelSelect');
    if (!select) return;
    select.innerHTML = '';
    
    for (let i = 0; i < LEVELS.length; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i + 1}`;
        select.appendChild(option);
    }
    
    const randomOption = document.createElement('option');
    randomOption.value = "random";
    randomOption.textContent = "🎲";
    randomOption.style.color = "#ffaa44";
    randomOption.style.fontWeight = "bold";
    select.appendChild(randomOption);
    
    select.value = currentLevel.toString();
}

function saveGame() {
    localStorage.setItem('krakout_save', JSON.stringify({
        level: currentLevel,
        score: score,
        lives: lives,
        lastThousandScore: lastThousandScore,
        bombCount: bombCount,
        levelNumber: levelNumber,
        isRandomMode: isRandomMode
    }));
}

function loadGame() {
    const save = localStorage.getItem('krakout_save');
    if (save) {
        try {
            const data = JSON.parse(save);
            currentLevel = data.level !== undefined ? data.level : 0;
        } catch (e) { }
    }
    // Полный сброс
    score = 0;
    lives = 3;
    bombCount = 0;
    lastThousandScore = 0;
    levelNumber = 1;
    isRandomMode = false;
}

function restartGame() {
    stopSpeedIncreaseTimer(); 
    levelNumber = 1;
    currentLevel = 0;
    isRandomMode = false;
    score = 0;
    lastThousandScore = 0;
    lives = 3;
    bombCount = 0; // бомбы на старте
    gameOver = false;
    winFlag = false;
    paused = false;
    immortalMode = false;
    loadLevel(currentLevel);
    updateUI();
    saveGame();
    activeBonus = null;
    megaBallActive = false;
    magnetActive = false;
    attackActive = false;
    bullets = [];
    bonusDrops = [];
    PADDLE_W = 144;
    updateBonusDisplay();
    startSpeedIncreaseTimer(); 
    
    const select = document.getElementById('levelSelect');
    if (select) select.value = "0";
    fox.active = false;
    if (foxTimer) clearTimeout(foxTimer);
}

// ====================== УПРАВЛЕНИЕ ======================

document.addEventListener('keydown', (e) => {
    // ========== ПРОВЕРКА ОТКРЫТЫХ МОДАЛЬНЫХ ОКОН ==========
    const exitModal = document.getElementById('exitModal');
    const helpModal = document.getElementById('helpModal');
    const highScoresModal = document.getElementById('highScoresModal');
    const generatorModal = document.getElementById('generatorModal');
    const paddleModal = document.getElementById('paddleModal');
    const levelCompleteModal = document.getElementById('levelCompleteModal');
    
    const isAnyModalActive = (exitModal?.classList.contains('active') ||
                              helpModal?.classList.contains('active') ||
                              highScoresModal?.classList.contains('active') ||
                              generatorModal?.classList.contains('active') ||
                              paddleModal?.classList.contains('active') ||
                              levelCompleteModal?.classList.contains('active'));
    
    if (isAnyModalActive) {
        // Разрешаем только Escape для закрытия
        if (e.key === 'Escape') {
            if (exitModal?.classList.contains('active')) closeExitModal();
            if (helpModal?.classList.contains('active')) closeHelpModal();
            if (highScoresModal?.classList.contains('active')) closeHighScoresModal();
            if (generatorModal?.classList.contains('active')) closeGeneratorModal();
            if (paddleModal?.classList.contains('active')) closePaddleModal();
            if (levelCompleteModal?.classList.contains('active')) closeLevelCompleteModal();
            e.preventDefault();
        }
        return; // Игнорируем все остальные клавиши
    }
    // ========== КОНЕЦ ПРОВЕРКИ ==========
       // Остальные игровые клавиши (стрелки, пробел, B, L, H, T, E, D)
    if (e.key === 'ArrowLeft') leftPressed = true;
    if (e.key === 'ArrowRight') rightPressed = true;
    
    if (e.key === ' ' || e.key === 'Space') {
        if (!document.getElementById('paddleModal').classList.contains('active')) {
            paused = !paused;
        }
        e.preventDefault();
    }
    

    
    // D / В - демо-режим
    if (e.key === 'd' || e.key === 'в') {
        demoMode = !demoMode;
        if (demoMode) {
            gameOver = false;
            winFlag = false;
            score = 0;
            lives = 3;
            bombCount = 0;
            isRandomMode = true;
            levelNumber = 1;
            loadLevel(0);
            resetBallAndPaddle();
            ballLaunched = true;
            activeBonus = null;
            megaBallActive = false;
            magnetActive = false;
            attackActive = false;
            bullets = [];
            updateUI();
        } else {
            restartGame();
        }
        e.preventDefault();
    }
    
    // E / У - выход
    if (e.key === 'e' || e.key === 'у') {
        const exitModal = document.getElementById('exitModal');
        if (exitModal && exitModal.classList.contains('active')) {
            closeExitModal();
            e.preventDefault();
            return;
        }
        const helpModal = document.getElementById('helpModal');
        if (helpModal && helpModal.classList.contains('active')) {
            closeHelpModal();
            e.preventDefault();
            return;
        }
        const highScoresModal = document.getElementById('highScoresModal');
        if (highScoresModal && highScoresModal.classList.contains('active')) {
            closeHighScoresModal();
            e.preventDefault();
            return;
        }
        const generatorModal = document.getElementById('generatorModal');
        if (generatorModal && generatorModal.classList.contains('active')) {
            closeGeneratorModal();
            e.preventDefault();
            return;
        }
        const paddleModal = document.getElementById('paddleModal');
        if (paddleModal && paddleModal.classList.contains('active')) {
            closePaddleModal();
            e.preventDefault();
            return;
        }
        const levelCompleteModal = document.getElementById('levelCompleteModal');
        if (levelCompleteModal && levelCompleteModal.classList.contains('active')) {
            closeLevelCompleteModal();
            e.preventDefault();
            return;
        }
        showExitModal();
        e.preventDefault();
        return;
    }
    
    // ESC - выход из курсора
    if (e.key === 'Escape') {
        if (pointerLockActive) {
            document.exitPointerLock();
            e.preventDefault();
        }
    }
    
    // B / И - ракетка
    if (e.key === 'b' || e.key === 'и') {
        if (!gameOver) openPaddleModal();
        e.preventDefault();
    }
    
    // L / Д - генератор
    if (e.key === 'l' || e.key === 'д') {
        if (!gameOver && !document.getElementById('paddleModal').classList.contains('active')) {
            openGeneratorModal();
            e.preventDefault();
        }
    }
    
    // H / Н - справка
    if (e.key === 'h' || e.key === 'р') {
        if (!gameOver && !document.getElementById('paddleModal').classList.contains('active')) {
            showHelpModal();
            e.preventDefault();
        }
    }
    
    // T / Е - таблица рекордов
    if (e.key === 't' || e.key === 'е') {
        if (!gameOver && !document.getElementById('paddleModal').classList.contains('active')) {
            showHighScoresModal();
            e.preventDefault();
        }
    }
});





const canvasEl = document.getElementById('gameCanvas');

canvasEl.addEventListener('click', () => {
    if (!pointerLockActive) {
        canvasEl.requestPointerLock();
    } else if (!gameOver && !paused) {
        if (!ballLaunched) {
            ballLaunched = true;
            initAudio();
            if (attackActive) shootBullet();
        } else if (attackActive) {
            shootBullet();
        }
    }
});

function lockChange() {
    pointerLockActive = (document.pointerLockElement === canvasEl);
    canvasEl.style.cursor = pointerLockActive ? "none" : "default";
}
document.addEventListener('pointerlockchange', lockChange);
document.addEventListener('mozpointerlockchange', lockChange);

function onMouseMove(e) {
    if (!pointerLockActive) return;
    paddleX += e.movementX * 1.2;
    paddleX = Math.min(W - PADDLE_W, Math.max(0, paddleX));

    if (!ballLaunched && !gameOver) {
        ball.x = paddleX + PADDLE_W / 2 + magnetOffsetX;
        ball.x = Math.max(paddleX + ball.radius, Math.min(paddleX + PADDLE_W - ball.radius, ball.x));
    }
}
document.addEventListener('mousemove', onMouseMove);

document.getElementById('resetButton').addEventListener('click', restartGame);


// Временно закомментировать
// document.getElementById('livesBoard').addEventListener('click', () => {
//     immortalMode = !immortalMode;
//     updateUI();
// });

document.getElementById('levelSelect').addEventListener('change', (e) => {
    const newValue = e.target.value;
    
    stopSpeedIncreaseTimer();
    
    if (newValue === "random") {
        currentLevel = "random";
        isRandomMode = true;
        levelNumber = 1;
    } else {
        const newLevel = parseInt(newValue);
        if (!isNaN(newLevel)) {
            currentLevel = newLevel;
            isRandomMode = false;
        }
    }
    
    score = 0;
    lastThousandScore = 0;
    lives = 3;
    bombCount = 0;
    gameOver = false;
    winFlag = false;
    paused = false;
    immortalMode = false;
    
    loadLevel(currentLevel);
    resetBallAndPaddle();
    ballLaunched = false;
    updateUI();
    saveGame();
    
    activeBonus = null;
    megaBallActive = false;
    magnetActive = false;
    attackActive = false;
    bullets = [];
    bonusDrops = [];
    PADDLE_W = 144;
    updateBonusDisplay();
    
    startSpeedIncreaseTimer();
});

// ====================== ЭКРАНЫ ПАУЗЫ И КОНЦА ======================

function drawNeonPanel(ctx, text, isVictory = false) {
    const centerX = W / 2;
    const centerY = H / 2;
    const radius = 140;
    const height = 100;

    ctx.save();

    const gradient = ctx.createLinearGradient(centerX - radius, centerY - height/2, centerX + radius, centerY + height/2);
    if (isVictory) {
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.2)');
        gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0.2)');
    } else {
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.15)');
        gradient.addColorStop(0.5, 'rgba(0, 100, 255, 0.25)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0.15)');
    }

    ctx.beginPath();
    ctx.ellipse(centerX, centerY - 20, radius, height/1.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(centerX, centerY - 20, radius - 5, height/1.5 - 5, 0, 0, Math.PI * 2);
    ctx.strokeStyle = isVictory ? '#ffaa00' : '#00ffff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = isVictory ? '#ffaa00' : '#00ffff';
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(centerX, centerY - 20, radius - 12, height/1.5 - 12, 0, 0, Math.PI * 2);
    ctx.strokeStyle = isVictory ? '#ffdd44' : '#44ffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = `bold ${isVictory ? 48 : 52}px "Courier New", monospace`;
    ctx.fillStyle = isVictory ? '#ffdd44' : '#88ffff';
    ctx.shadowBlur = 20;
    ctx.shadowColor = isVictory ? '#ffaa00' : '#00aaff';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (isVictory) {
        ctx.fillText("★ VICTORY! ★", centerX, centerY - 15);
        ctx.font = "24px monospace";
        ctx.fillStyle = "#ffaa66";
        ctx.fillText("Press RESTART to continue", centerX, centerY + 35);
    } else {
        ctx.fillText("PAUSE", centerX, centerY - 15);
        ctx.font = "20px monospace";
        ctx.fillStyle = "#88aaff";
        ctx.fillText("", centerX, centerY + 35);
    }

    ctx.restore();
}

function drawNeonGameOver(ctx, isWin) {
    const centerX = W / 2;
    const centerY = H / 2;

    ctx.save();

    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, W, H);

    ctx.beginPath();
    ctx.arc(centerX, centerY - 20, 130, 0, Math.PI * 2);
    ctx.fillStyle = isWin ? "rgba(255, 200, 0, 0.15)" : "rgba(255, 50, 50, 0.15)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY - 20, 125, 0, Math.PI * 2);
    ctx.strokeStyle = isWin ? "#ffcc00" : "#ff4444";
    ctx.lineWidth = 4;
    ctx.shadowBlur = 20;
    ctx.shadowColor = isWin ? "#ffcc00" : "#ff0000";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY - 20, 115, 0, Math.PI * 2);
    ctx.strokeStyle = isWin ? "#ffdd66" : "#ff8866";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = `bold ${isWin ? 48 : 44}px "Courier New", monospace`;
    ctx.fillStyle = isWin ? "#ffdd44" : "#ff8866";
    ctx.shadowBlur = 15;
    ctx.shadowColor = isWin ? "#ffaa00" : "#ff3333";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (isWin) {
        ctx.fillText("★ VICTORY! ★", centerX, centerY - 30);
        ctx.font = "22px monospace";
        ctx.fillStyle = "#ffcc88";
        ctx.fillText("Congratulations! You won!", centerX, centerY + 20);
        ctx.font = "18px monospace";
        ctx.fillStyle = "#aaffaa";
        ctx.fillText("Select level or press RESTART", centerX, centerY + 60);
    } else {
        ctx.fillText("GAME OVER", centerX, centerY - 30);
        ctx.font = "22px monospace";
        ctx.fillStyle = "#ffaa88";
        ctx.fillText("Better luck next time!", centerX, centerY + 20);
        ctx.font = "18px monospace";
        ctx.fillStyle = "#88aaff";
        ctx.fillText("Press RESTART to try again", centerX, centerY + 60);
    }

    ctx.restore();
}

function playLifeUp() {
    
}

// ====================== БОМБА (ПКМ) ======================
canvasEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
});

canvasEl.addEventListener('mousedown', (e) => {
    if (e.button === 2) {
        e.preventDefault();
        if (!gameOver && !paused && bombCount > 0) {
            activateBomb();
        }
    }
});

// ====================== ОТКЛЮЧАЕМ СТРЕЛЬБУ ПО ПКМ ======================
window.lastButton = null;
document.addEventListener('mousedown', (e) => {
    window.lastButton = e.button;
});
document.addEventListener('mouseup', (e) => {
    window.lastButton = null;
});

const originalShootBullet = shootBullet;
shootBullet = function() {
    if (window.lastButton === 2) return;
    originalShootBullet();
};

// ====================== МОДАЛЬНОЕ ОКНО ЗАВЕРШЕНИЯ УРОВНЯ ======================
let pendingNextLevel = false;

function showLevelCompleteModal() {
    const modal = document.getElementById('levelCompleteModal');
    if (!modal) return;
    
    // В демо-режиме не показываем окно, сразу переходим на следующий уровень
    if (demoMode) {
        loadNextLevel();
        return;
    }
    
    document.getElementById('completeScore').innerText = score;
    document.getElementById('completeBombs').innerText = bombCount;
    document.getElementById('completeLives').innerText = lives;
    
    modal.classList.add('active');
    paused = true;
    pendingNextLevel = true;
}

function closeLevelCompleteModal() {
    const modal = document.getElementById('levelCompleteModal');
    if (modal) {
        modal.classList.remove('active');
    }
    paused = false;
    
    if (pendingNextLevel) {
        pendingNextLevel = false;
        loadNextLevel();
    }
}

function loadNextLevel() {
    if (isRandomMode || currentLevel === "random") {
        isRandomMode = true;
        const newLevel = generateRandomLevel(levelNumber);
        levelNumber++;
        currentLevelData = newLevel;
        
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                let brickType = newLevel.layout[row]?.[col] || 0;
                let strength = 1;
                if (brickType === 1) strength = 2;
                else if (brickType === 2) strength = 3;
                else if (brickType === 9 || brickType === 13) strength = 999;

                bricks[row][col] = {
                    active: brickType > 0,
                    strength: strength,
                    type: brickType,
                    x: col * BRICK_W,
                    y: BRICKS_TOP_Y + row * BRICK_H,
                    originalX: col * BRICK_W,
                    originalY: BRICKS_TOP_Y + row * BRICK_H,
                    hiddenBonus: null
                };
            }
        }
        
        bricksOffset = 0;
        brickMoveDirection = 1;
        generateRandomBonuses();
          initMovingBricks();
        resetBallAndPaddle();
        ballLaunched = false;
        updateUI();
        saveGame();
        updateLevelName();
        
     } 
    else if (currentLevel + 1 < LEVELS.length) {
        currentLevel++;
        loadLevel(currentLevel);
        resetBallAndPaddle();
        ballLaunched = false;
        updateUI();
        saveGame();
    } else {
        winFlag = true;
        gameOver = true;
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Space') {
        const modal = document.getElementById('levelCompleteModal');
        if (modal && modal.classList.contains('active')) {
            e.preventDefault();
            closeLevelCompleteModal();
        }
    }
});

// ====================== МОДАЛЬНОЕ ОКНО HELP ======================
function showHelpModal() {
    const modal = document.getElementById('helpModal');
    if (!modal) return;
    
    const helpText = document.getElementById('helpText');
    if (helpText) {
        helpText.innerHTML = `
            <p>🎮 <strong>УПРАВЛЕНИЕ:</strong></p>
            <p>• <kbd>ЛКМ</kbd> - Запуск мяча / Стрельба (ATTACK)</p>
            <p>• <kbd>ПКМ</kbd> - Активация бомбы 💣</p>
            <p>• <kbd>ПРОБЕЛ</kbd> - Пауза</p>
            <p>• <kbd>B</kbd> - Выбор ракетки</p>
            <p>• <kbd>M</kbd> - Старт - стоп музыки</p>
            <p>• <kbd>N</kbd> - Смена трека</p>
            <p>• <kbd>Е</kbd> - Топ игроков</p>
            <p>• <kbd>L</kbd> - Настройки генератора уровней</p>
            <p>• <kbd>H</kbd> - Эта справка</p>
            <p>• <kbd>ESC</kbd> - Выход из курсора / Закрыть окно</p>
            <p>• <kbd>D</kbd> - Демо-режим</p>
            <hr>
       
            <p>⬆️ Увеличение скорости чрез 20 сек.</p>
            <p>❤️ <strong>+1 жизнь</strong> за каждые 1000 очков</p>
            
            <p>🦊 <strong>Лиса</strong> - обожает есть мячи</p>

<hr>
            <p>🎨 <strong>Создавайте свои уровни тут:</strong><br>
            <a href="https://foehelp.ru/game/lg.html" target="_blank" style="color: #4ecca3;">Редактор уровней</a></p>
            <p>📨 <strong>Присылайте уровни:</strong><br>
            <a href="https://t.me/foehelp" target="_blank" style="color: #ffaa44;">Телеграм</a></p>


        `;
    }
    
    modal.classList.add('active');
    paused = true;
}

function closeHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal) {
        modal.classList.remove('active');
    }
    paused = false;
}

// ====================== ТАБЛИЦА РЕКОРДОВ ======================

async function saveHighScore(score) {
    if (demoMode) return false;
    
    // Получаем IP игрока
    const playerIP = await getPlayerIP();
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/high_scores`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                player_name: playerName, 
                score: score,
                ip_address: playerIP
            })
        });
        if (response.ok) {
            console.log(`🏆 Рекорд ${score} сохранён для ${playerName} (IP: ${playerIP})`);
            return true;
        }
    } catch (error) {
        console.log("Ошибка сохранения:", error);
    }
    return false;
}

async function loadHighScores() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/high_scores?order=score.desc&limit=10`, {
            headers: { 'apikey': SUPABASE_KEY }
        });
        const scores = await response.json();
        
        if (scores.length > 0 && scores[0].score > currentHighScore) {
            currentHighScore = scores[0].score;
        }
        
        return scores;
    } catch (error) {
        return [];
    }
}

function displayHighScores(scores) {
    const container = document.getElementById('highScoresList');
    if (!container) return;
    
    if (scores.length === 0) {
        container.innerHTML = '<div class="loading">Пока нет рекордов</div>';
        return;
    }
    
    container.innerHTML = '';
    scores.forEach((score, index) => {
        const item = document.createElement('div');
        item.className = 'highscore-item';
        item.innerHTML = `
            <span class="highscore-rank">${index + 1}</span>
            <span class="highscore-name">${escapeHtml(score.player_name)}</span>
            <span class="highscore-score">${score.score}</span>
        `;
        container.appendChild(item);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ====================== МОДАЛЬНОЕ ОКНО ВЫХОДА ======================

function showExitModal() {
    const modal = document.getElementById('exitModal');
    if (!modal) return;
    
    const input = document.getElementById('playerNameInput');
    if (input) input.value = playerName;
    
    document.getElementById('exitScore').innerText = score;
    document.getElementById('highScore').innerText = currentHighScore;
    
    modal.classList.add('active');
    paused = true;
}

function closeExitModal() {
    const modal = document.getElementById('exitModal');
    if (modal) {
        modal.classList.remove('active');
    }
    paused = false;
}

async function saveScoreAndExit() {
    if (demoMode) {
        closeExitModal();
        return;
    }
    await saveHighScore(score);
    await showHighScoresModal();
    closeExitModal();
}

// Кнопка обновления таблицы рекордов
// const refreshBtn = document.getElementById('refreshScoresBtn');
// if (refreshBtn) {
//    refreshBtn.addEventListener('click', () => {
//        updateSidebarScores();
//    });
// }
// ====================== МОДАЛЬНОЕ ОКНО РЕКОРДОВ ======================

async function showHighScoresModal() {
    const modal = document.getElementById('highScoresModal');
    if (!modal) return;
    
    modal.classList.add('active');
    paused = true;
    
    const scores = await loadHighScores();
    displayHighScores(scores);
}

function closeHighScoresModal() {
    const modal = document.getElementById('highScoresModal');
    if (modal) {
        modal.classList.remove('active');
    }
    paused = false;
}
// ====================== УПРАВЛЕНИЕ ИМЕНЕМ ИГРОКА ======================
function loadPlayerName() {
    const saved = localStorage.getItem('krakout_player_name');
    if (saved) {
        playerName = saved;
    } else {
        playerName = "Player";
    }
    const input = document.getElementById('playerNameInput');
    if (input) input.value = playerName;
}

function savePlayerName() {
    const input = document.getElementById('playerNameInput');
    if (input && input.value.trim()) {
        playerName = input.value.trim();
        localStorage.setItem('krakout_player_name', playerName);
      
    }
}
// Обработчик сохранения имени
const saveNameBtn = document.getElementById('savePlayerNameBtn');
if (saveNameBtn) {
    saveNameBtn.addEventListener('click', savePlayerName);
}
// ====================== БОКОВАЯ ПАНЕЛЬ РЕКОРДОВ ======================

//async function updateSidebarScores() {
//    const container = document.getElementById('sidebarHighScoresList');
//    if (!container) return;
    
//    container.innerHTML = '<div class="loading">Загрузка...</div>';
    
//    const scores = await loadHighScores();
    
//    if (scores.length === 0) {
//        container.innerHTML = '<div class="loading">Пока нет рекордов</div>';
//        return;
//    }
    
//    container.innerHTML = '';
//    scores.forEach((score, index) => {
 //       const item = document.createElement('div');
   //     item.className = 'sidebar-highscore-item';
     //   if (index === 0) item.classList.add('top-1');
     //   if (index === 1) item.classList.add('top-2');
     //   if (index === 2) item.classList.add('top-3');
        
    //    item.innerHTML = `
    //        <span class="sidebar-rank">${index + 1}</span>
     //       <span class="sidebar-name">${escapeHtml(score.player_name)}</span>
    //        <span class="sidebar-score">${score.score}</span>
    //    `;
//        container.appendChild(item);
 //   });
//  }

// Обновляем таблицу при старте и после сохранения рекорда
async function refreshSidebarAndModal() {
    // Только обновляем модальное окно, если оно открыто
    const modal = document.getElementById('highScoresModal');
    if (modal && modal.classList.contains('active')) {
        const scores = await loadHighScores();
        displayHighScores(scores);
    }
}


// ====================== ЗАПУСК ======================
window.addEventListener('load', initGame);