/**
 * radio-widget.js — встраиваемый виджет World Radio
 * Использует Radio Browser API (https://www.radio-browser.info)
 *
 * Подключение на странице:
 *   <link rel="stylesheet" href="js/radio-widget.css">
 *   <script src="js/radio-widget.js"></script>
 *
 * Страны-исключения задаются в EXCLUDED_COUNTRIES ниже.
 */

(function () {
    /* ── Настройки ───────────────────────────────────────────── */
    const EXCLUDED_COUNTRIES = ['Ukraine'];   // добавляй сюда нужные страны
    const STATIONS_LIMIT     = 2000;          // максимум загружаемых станций
    const RENDER_LIMIT       = 150;           // максимум строк в списке одновременно
    const SERVERS = [
        'de1.api.radio-browser.info',
        'at1.api.radio-browser.info',
        'nl1.api.radio-browser.info',
        'fr1.api.radio-browser.info',
        'fi1.api.radio-browser.info',
    ];
    /* ─────────────────────────────────────────────────────────── */

    // Вставляем HTML виджета в body
    const html = `
<div id="radio-btn" title="🎙️ World Radio">📻</div>
<div id="radio-panel">
    <div id="radio-header">
        <span>📻 WORLD RADIO</span>
        <button id="radio-close">×</button>
    </div>
    <div id="radio-now-playing">
        <div id="radio-station-name">— не выбрана —</div>
        <div style="display:flex;align-items:center;gap:8px;">
            <div id="radio-track-info">выберите станцию из списка</div>
            <button id="radio-stop" title="Стоп">⏹</button>
        </div>
    </div>
    <div id="radio-filters">
        <select id="radio-country"><option value="">🌍 Страна</option></select>
        <select id="radio-genre"><option value="">🎵 Жанр</option></select>
    </div>
    <div id="radio-search-wrap">
        <input id="radio-search" type="text" placeholder="🔍 поиск станции...">
    </div>
    <div id="radio-list"><div id="radio-loading">нажмите 📻 чтобы загрузить</div></div>
    <div id="radio-odessa-wrap">
        <button id="radio-odessa">📻 Всемирное Одесское</button>
    </div>
    <div id="radio-vol">
        <span>🔈</span>
        <input id="radio-volume" type="range" min="0" max="1" step="0.02" value="0.6">
        <span>🔊</span>
    </div>
</div>
<audio id="radio-audio" preload="none"></audio>`;

    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.appendChild(wrap);

    /* ── DOM refs ────────────────────────────────────────────── */
    const btn      = document.getElementById('radio-btn');
    const panel    = document.getElementById('radio-panel');
    const audio    = document.getElementById('radio-audio');
    const list     = document.getElementById('radio-list');
    const volEl    = document.getElementById('radio-volume');
    const nowName  = document.getElementById('radio-station-name');
    const nowTrack = document.getElementById('radio-track-info');
    const cntryEl  = document.getElementById('radio-country');
    const genreEl  = document.getElementById('radio-genre');
    const searchEl = document.getElementById('radio-search');

    let allStations = [];
    let currentUrl  = null;
    let loaded      = false;

    /* ── Громкость ───────────────────────────────────────────── */
    audio.volume = parseFloat(volEl.value);
    volEl.addEventListener('input', () => { audio.volume = parseFloat(volEl.value); });
    // Блокируем перехват клавиш игрой пока курсор в поле поиска
    searchEl.addEventListener('keydown',  e => { if (document.activeElement === searchEl) e.stopPropagation(); });
    searchEl.addEventListener('keyup',    e => { if (document.activeElement === searchEl) e.stopPropagation(); });
    searchEl.addEventListener('keypress', e => { if (document.activeElement === searchEl) e.stopPropagation(); });

    /* ── Открытие/закрытие ───────────────────────────────────── */
    btn.addEventListener('click', () => {
        panel.classList.toggle('open');
        if (panel.classList.contains('open') && !loaded) {
            loaded = true;
            loadStations();
        }
    });
    document.getElementById('radio-close').addEventListener('click', () => panel.classList.remove('open'));

    /* ── Поиск рабочего сервера ──────────────────────────────── */
    async function getWorkingServer() {
        for (const host of SERVERS) {
            try {
                const r = await fetch(`https://${host}/json/stats`, { signal: AbortSignal.timeout(3000) });
                if (r.ok) return host;
            } catch (e) { /* следующий */ }
        }
        return null;
    }

    /* ── Загрузка станций ────────────────────────────────────── */
    async function loadStations() {
        setLoading('поиск сервера…');
        try {
            const host = await getWorkingServer();
            if (!host) {
                setLoading('⚠️ все серверы недоступны.<br>Проверьте интернет-соединение.');
                return;
            }
            setLoading('загрузка станций…');
            const res  = await fetch(
                `https://${host}/json/stations/search?limit=${STATIONS_LIMIT}&order=clickcount&reverse=true&hidebroken=true`
            );
            const data = await res.json();
            allStations = data.filter(s => !EXCLUDED_COUNTRIES.includes((s.country || '').trim()));
            populateFilters();
            renderList(allStations);
        } catch (e) {
            setLoading(`⚠️ ошибка загрузки:<br>${e.message}`);
        }
    }

    function setLoading(msg) {
        list.innerHTML = `<div id="radio-loading">${msg}</div>`;
    }

    /* ── Заполнение фильтров ─────────────────────────────────── */
    function populateFilters() {
        const countries = [...new Set(allStations.map(s => (s.country || '').trim()).filter(c => c.length > 0))].sort();
        const genres    = [...new Set(
            allStations.flatMap(s => (s.tags || '').split(',').map(t => t.trim()))
                       .filter(t => t.length > 1 && t.length < 20)
        )].sort();

        countries.forEach(c => {
            const o = document.createElement('option');
            o.value = c; o.textContent = c;
            cntryEl.appendChild(o);
        });
        genres.slice(0, 100).forEach(g => {
            const o = document.createElement('option');
            o.value = g; o.textContent = g;
            genreEl.appendChild(o);
        });

        [cntryEl, genreEl, searchEl].forEach(el => el.addEventListener('input', applyFilters));
    }

    /* ── Фильтрация ──────────────────────────────────────────── */
    function applyFilters() {
        const country = cntryEl.value;
        const genre   = genreEl.value;
        const query   = searchEl.value.toLowerCase();
        renderList(allStations.filter(s => {
            if (country && (s.country || '').trim() !== country) return false;
            if (genre   && !(s.tags || '').includes(genre)) return false;
            if (query   && !s.name.toLowerCase().includes(query)) return false;
            return true;
        }));
    }

    /* ── Рендер списка ───────────────────────────────────────── */
    function esc(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function renderList(stations) {
        if (!stations.length) { setLoading('нет станций'); return; }
        list.innerHTML = stations.slice(0, RENDER_LIMIT).map(s => {
            const genre = (s.tags || '').split(',')[0].trim().substring(0, 14);
            const active = s.url_resolved === currentUrl ? 'active' : '';
            return `<div class="radio-item ${active}" data-url="${esc(s.url_resolved)}" data-name="${esc(s.name)}">
                
                <span class="ri-name">${esc(s.name)}</span>
                ${genre ? `<span class="ri-genre">${esc(genre)}</span>` : ''}
            </div>`;
        }).join('');

        // Делегирование клика — один обработчик на весь список
        list.onclick = e => {
            const item = e.target.closest('.radio-item');
            if (item) playStation(item);
        };
    }

    /* ── Воспроизведение ─────────────────────────────────────── */
    function playStation(el) {
        document.querySelectorAll('.radio-item').forEach(e => e.classList.remove('active'));
        el.classList.add('active');
        currentUrl = el.dataset.url;
        audio.src  = currentUrl;
        audio.play().catch(() => {});
        btn.classList.add('playing');
        nowName.textContent  = el.dataset.name;
        nowTrack.textContent = '▶ воспроизведение…';
    }

    /* ── Состояния аудио ─────────────────────────────────────── */
    audio.addEventListener('error', () => { nowTrack.textContent = '⚠️ ошибка потока'; btn.classList.remove('playing'); });

    document.getElementById('radio-odessa').addEventListener('click', () => {
        const url  = 'https://myradio24.org/odesradio';
        const name = 'Всемирное Одесское';
        audio.src  = url;
        audio.play().catch(() => {});
        currentUrl = url;
        btn.classList.add('playing');
        nowName.textContent  = name;
        nowTrack.textContent = '▶ воспроизведение…';
        document.querySelectorAll('.radio-item').forEach(e => e.classList.remove('active'));
    });

    document.getElementById('radio-stop').addEventListener('click', () => {
        audio.pause();
        audio.src = '';
        currentUrl = null;
        btn.classList.remove('playing');
        nowName.textContent  = '— не выбрана —';
        nowTrack.textContent = 'выберите станцию из списка';
        document.querySelectorAll('.radio-item').forEach(e => e.classList.remove('active'));
    });
    audio.addEventListener('pause', () => btn.classList.remove('playing'));
    audio.addEventListener('play',  () => btn.classList.add('playing'));

})();