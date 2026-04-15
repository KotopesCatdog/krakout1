const backgroundImages = [
'https://foe-help.moy.su/imgdisk/Screenshot_6.png',
'https://foe-help.moy.su/imgdisk/0ZNWTnu.png',
'https://foe-help.moy.su/imgdisk/B0fqCqO.jpeg',
'https://foe-help.moy.su/imgdisk/7g1x175.jpeg',
'https://foe-help.moy.su/imgdisk/UinY9uu.jpeg',
'https://foe-help.moy.su/imgdisk/X6UF0y3.jpeg',
'https://foe-help.moy.su/imgdisk/ry8L0qy.jpeg',
'https://foe-help.moy.su/imgdisk/p5zXSvC.jpeg',
'https://foe-help.moy.su/imgdisk/a5HSwQs.jpeg',
'https://foe-help.moy.su/imgdisk/tX3123R.jpeg',
'https://foe-help.moy.su/imgdisk/X0UnHsb.jpeg',
'https://foe-help.moy.su/imgdisk/r3tUQfj.jpeg',
'https://foe-help.moy.su/imgdisk/ntjNHx3.jpeg',
'https://foe-help.moy.su/imgdisk/HiYMg3m.jpeg',
'https://foe-help.moy.su/imgdisk/x84HPVL.jpeg',
'https://foe-help.moy.su/imgdisk/gHKPM6l.jpeg',
'https://foe-help.moy.su/imgdisk/EabRk7O.jpeg',
'https://foe-help.moy.su/imgdisk/VkwKURr.jpeg',
'https://foe-help.moy.su/imgdisk/SPCfYxQ.jpeg',
'https://foe-help.moy.su/imgdisk/rhkbf3E.jpeg',
'https://foe-help.moy.su/imgdisk/EpkkL4w.jpeg',
'https://foe-help.moy.su/imgdisk/8AYni06.jpeg',
'https://foe-help.moy.su/imgdisk/uVzQIAB.jpeg',
'https://foe-help.moy.su/imgdisk/SnraLpV.jpeg',
'https://foe-help.moy.su/imgdisk/FELLOWSHIP_A_Loading_Screen_1.png',

];

let currentBackgroundIndex = 0;
let backgroundImageObj = new Image();
let backgroundChangeInterval = null;

function loadBackground(index) {
    const url = backgroundImages[index % backgroundImages.length];
    const img = new Image();
    img.onload = () => backgroundImageObj = img;
    img.onerror = () => loadBackground(index + 1);
    img.src = url;
}

function startBackgroundRotation() {
    loadBackground(0);
    backgroundChangeInterval = setInterval(() => {
        currentBackgroundIndex++;
        loadBackground(currentBackgroundIndex);
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