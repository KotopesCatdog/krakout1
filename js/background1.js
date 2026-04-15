const WORKER_URL = 'https://royal-mud-6b2c.ceresit-e11.workers.dev/';

let backgroundImages = [];
let currentBackgroundIndex = 0;
let backgroundImageObj = new Image();
let backgroundChangeInterval = null;

async function fetchBackgroundImages() {
    try {
        const response = await fetch(WORKER_URL);
        backgroundImages = await response.json();
    } catch (e) {
        console.error('Background fetch error:', e);
        backgroundImages = [];
    }
}

function loadBackground(index) {
    if (!backgroundImages.length) return;
    const url = backgroundImages[index % backgroundImages.length];
    const img = new Image();
    img.onload = () => { backgroundImageObj = img; };
    img.onerror = () => { loadBackground(index + 1); };
    img.src = url;
}

async function startBackgroundRotation() {
    await fetchBackgroundImages();
    loadBackground(0);
    backgroundChangeInterval = setInterval(() => {
        currentBackgroundIndex++;
        if (currentBackgroundIndex >= backgroundImages.length) {
            currentBackgroundIndex = 0;
            fetchBackgroundImages().then(() => loadBackground(0));
        } else {
            loadBackground(currentBackgroundIndex);
        }
    }, 30000);
}

function drawBackground(ctx) {
    if (backgroundImageObj && backgroundImageObj.complete && backgroundImageObj.naturalWidth > 0) {
        const img = backgroundImageObj;
        const imgRatio = img.width / img.height;
        const drawHeight = H;
        const drawWidth = H * imgRatio;
        const offsetX = (W - drawWidth) / 2;
        ctx.drawImage(img, offsetX, 0, drawWidth, drawHeight);
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.fillRect(0, 0, W, H);
    } else {
        ctx.fillStyle = "#01020b";
        ctx.fillRect(0, 0, W, H);
    }
}