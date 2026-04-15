// music.js — музыка с случайным выбором трека и случайным стартом

let currentAudio = null;
let isPlaying = false;
let currentTrackIndex = 0;

// Список твоих длинных треков
const musicList = [
    'https://foehelp.ru/game/songs/5.mp3',
    'https://foehelp.ru/game/songs/6.mp3',
    'https://foehelp.ru/game/songs/7.mp3',
    'https://foehelp.ru/game/songs/8.mp3',
    'https://foehelp.ru/game/songs/9.mp3',
    'https://foehelp.ru/game/songs/10.mp3',
    'https://foehelp.ru/game/songs/11.mp3',
    'https://foehelp.ru/game/songs/12.mp3',
    'https://foehelp.ru/game/songs/13.mp3',
    'https://foehelp.ru/game/songs/14.mp3',
    'https://foehelp.ru/game/songs/15.mp3',
    'https://foehelp.ru/game/songs/2.mp3',
    'https://foehelp.ru/game/songs/1.mp3',
    'https://foehelp.ru/game/songs/3.mp3',
   // 'https://foehelp.ru/game/songs/4.mp3',
    
    
];

function getRandomIndex() {
    return Math.floor(Math.random() * musicList.length);
}

function loadTrack(index) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    
    const trackUrl = musicList[index];
 
    
    currentAudio = new Audio(trackUrl);
    currentAudio.loop = false;     // важно: не loop, чтобы срабатывал 'ended'
    currentAudio.volume = 0.3;

    // Случайный старт внутри выбранного трека
    currentAudio.addEventListener('loadedmetadata', () => {
        if (currentAudio.duration && currentAudio.duration > 60) {
            // Начинаем со случайного места, оставляя минимум 30 сек до конца
            const safeDuration = currentAudio.duration - 30;
            const randomStart = Math.random() * safeDuration;
            
            currentAudio.currentTime = randomStart;
            
    
        }
    });

    // Когда трек закончится — переходим к следующему (случайному)
    currentAudio.addEventListener('ended', () => {
        if (isPlaying) {
         
            nextTrack();
        }
    });
    
    return currentAudio;
}

function playMusic() {
    if (currentAudio && currentAudio.src) {
        currentAudio.play().then(() => {
            isPlaying = true;
          
        }).catch(e => console.error('Ошибка воспроизведения:', e));
        return;
    }

    if (musicList.length === 0) {
        console.error('Нет треков в плейлисте!');
        return;
    }

    // Первый запуск: выбираем случайный трек
    currentTrackIndex = getRandomIndex();
    loadTrack(currentTrackIndex);
    
    currentAudio.play().then(() => {
        isPlaying = true;
       
    }).catch(e => {
        console.error('Ошибка:', e);
        // Автозапуск после клика пользователя (браузерные ограничения)
        document.body.addEventListener('click', () => playMusic(), { once: true });
    });
}

function pauseMusic() {
    if (currentAudio && isPlaying) {
        currentAudio.pause();
        isPlaying = false;
      
    }
}

function nextTrack() {
    if (musicList.length === 0) return;
    
    currentTrackIndex = getRandomIndex();        // ← каждый раз новый случайный трек
    loadTrack(currentTrackIndex);
    
    currentAudio.play().then(() => {
        isPlaying = true;
     
    }).catch(e => console.error('Ошибка:', e));
}

function toggleMusic() {
    if (isPlaying) {
        pauseMusic();
    } else {
        playMusic();
    }
}

// Управление клавишами
document.addEventListener('keydown', (event) => {
    // Если открыто окно выхода — не управляем музыкой
    if (document.getElementById('exitModal')?.classList.contains('active')) {
        return;
    }
    
    // M / Ь - музыка вкл/выкл
//    if (event.code === 'KeyM' || event.key === 'm' || event.key === 'ь') {
  //      event.preventDefault();
  //      event.stopPropagation();
 //       toggleMusic();
//    }
    
    // N / Т - следующий трек
//    if (event.code === 'KeyN' || event.key === 'n' || event.key === 'т') {
//        event.preventDefault();
//        event.stopPropagation();
//        if (isPlaying) nextTrack();
//    }
});

// Автозапуск после первого клика по странице
// document.body.addEventListener('click', () => {
//    if (!isPlaying && !currentAudio) {
//        playMusic();
//    }
// }, { once: true });

// Для удобства в консоли
window.toggleMusic = toggleMusic;
window.nextTrack = nextTrack;
