// =============================================================================
// BOOT LOADING SCREEN — preloads critical assets before showing the app
// =============================================================================
(function () {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');

    if (!loadingScreen) return;

    // ---- Collect every URL we want preloaded -------------------------------
    function collectImageUrls() {
        const urls = new Set();
        const cfg = window.ASSET_CONFIG || {};

        // Chest & bomb frames (arrays of paths)
        if (Array.isArray(cfg.chest_glow_frames)) cfg.chest_glow_frames.forEach(u => urls.add(u));
        if (Array.isArray(cfg.chest_open_frames)) cfg.chest_open_frames.forEach(u => urls.add(u));
        if (Array.isArray(cfg.bomb_frames))       cfg.bomb_frames.forEach(u => urls.add(u));

        // Single chest + scroll sprites
        ['chest_closed', 'chest_open', 'chest_locked_glow',
         'scroll_rolled', 'parchment_unrolled'].forEach(k => {
            if (cfg[k]) urls.add(cfg[k]);
        });

        // Item sprites
        if (cfg.items) Object.values(cfg.items).forEach(u => urls.add(u));

        return [...urls];
    }

    function collectAudioUrls() {
        const urls = [];
        const cfg = window.ASSET_CONFIG || {};
        if (cfg.bomb_fuse_sound)      urls.push(cfg.bomb_fuse_sound);
        if (cfg.bomb_explosion_sound) urls.push(cfg.bomb_explosion_sound);
        return urls;
    }

    // ---- Loader helpers ----------------------------------------------------
    function preloadImage(url) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;   // missing file ≠ crash; fall back handles it
            img.src = url;
        });
    }

    function preloadAudio(url) {
        return new Promise(resolve => {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.oncanplaythrough = resolve;
            audio.onerror = resolve;
            setTimeout(resolve, 3000);  // timeout fallback
            audio.src = url;
        });
    }

    function preloadJSON(url) {
        return fetch(url).then(r => r.ok ? r.json() : null).catch(() => null);
    }

    // ---- Progress UI -------------------------------------------------------
    function updateProgress(done, total, label) {
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
        if (loadingBar)  loadingBar.style.width = percent + '%';
        if (loadingText) loadingText.textContent = `${label} ${percent}%`;
    }

    // ---- Run the preload ---------------------------------------------------
    async function run() {
        const imageUrls = collectImageUrls();
        const audioUrls = collectAudioUrls();
        const total = imageUrls.length + audioUrls.length + 2;  // +2: loot_table.json + Firebase ping
        let done = 0;

        // Images (in parallel)
        await Promise.all(imageUrls.map(u => preloadImage(u).then(() => {
            done++;
            updateProgress(done, total, 'Memuat aset...');
        })));

        // Audio (in parallel)
        await Promise.all(audioUrls.map(u => preloadAudio(u).then(() => {
            done++;
            updateProgress(done, total, 'Memuat suara...');
        })));

        // Loot table
        await preloadJSON('loot_table.json');
        done++;
        updateProgress(done, total, 'Memuat data...');

        // Warm up Firebase game settings so the login flow is instant
        try {
            if (window.FIREBASE_URL && window.FIREBASE_SECRET) {
                await fetch(`${window.FIREBASE_URL}/gameSettings.json?auth=${window.FIREBASE_SECRET}`)
                    .catch(() => {});
            }
        } catch (e) {}
        done++;
        updateProgress(done, total, 'Siap!');

        // Fade out
        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => loadingScreen.remove(), 600);
        }, 300);
    }

    run().catch(err => {
        console.warn('Preload failed:', err);
        // Fail-safe: never leave the user stuck on the loading screen
        loadingScreen.classList.add('fade-out');
        setTimeout(() => loadingScreen.remove(), 600);
    });
})();