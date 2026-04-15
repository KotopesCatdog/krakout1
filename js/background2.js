// background-smooth.js
const WORKER_URL = 'https://royal-mud-6b2c.ceresit-e11.workers.dev/';
let backgroundImages = [];
let currentIndex = 0;
let nextImageIndex = 1;

async function fetchBackgroundImages() {
    try {
        const response = await fetch(WORKER_URL);
        backgroundImages = await response.json();
        return backgroundImages.length > 0;
    } catch (e) {
        console.error('Background fetch error:', e);
        return false;
    }
}

function preloadImages() {
    backgroundImages.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}

function preloadNextImage() {
    if (backgroundImages[nextImageIndex]) {
        const img = new Image();
        img.src = backgroundImages[nextImageIndex];
        console.log('Предзагружено изображение:', nextImageIndex);
        nextImageIndex = (nextImageIndex + 1) % backgroundImages.length;
    }
}

function setBackgroundWithTransition(url) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: url(${url});
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        opacity: 0;
        transition: opacity 1s ease-in-out;
        z-index: -1;
    `;
    
    document.body.appendChild(overlay);
    
    setTimeout(() => { overlay.style.opacity = '1'; }, 50);
    
    setTimeout(() => {
        document.body.style.backgroundImage = `url(${url})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        overlay.remove();
    }, 1000);
}

async function startBackground() {
    const hasImages = await fetchBackgroundImages();
    if (!hasImages) {
        console.error('Нет изображений для фона');
        return;
    }
    
    console.log('Загружено изображений:', backgroundImages.length);
    
    // Предзагружаем все изображения
    preloadImages();
    
    // Устанавливаем первый фон
    setBackgroundWithTransition(backgroundImages[0]);
    
    // Запускаем циклическую смену фона
    setInterval(() => {
        // Предзагружаем следующее изображение заранее
        preloadNextImage();
        
        // Меняем фон
        currentIndex = (currentIndex + 1) % backgroundImages.length;
        console.log('Смена фона на индекс:', currentIndex);
        setBackgroundWithTransition(backgroundImages[currentIndex]);
    }, 30000); // Меняем каждые 30 секунд
}

// Запускаем при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startBackground);
} else {
    startBackground();
}