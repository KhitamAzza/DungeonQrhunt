// =============================================================================
// ACHIEVEMENT MEDALS — definitions + earn-check logic
// =============================================================================
// This file is loaded AFTER student.js. It reads currentUser and answers the
// question: "which of the 8 medals has this student earned?"
//
// The UI (medal reveal ceremony) will be added in a later stage.
// For now this is just data + a pure function.

window.MEDAL_DEFS = [
        {
        id: 'sniper',
        name: 'Si paling Suhu',
        desc: 'Mendapatkan akurasi 100% tanpa ada jawaban salah!',
        sprite: 'assets/medals/sym_sniper.png',
        // 100% FIRST-TRY accuracy. Meaningful in both casual and strict
        // modes — you cannot earn this by retrying.
        check: (u) => (u.firstTryAttempts || 0) > 0
                   && u.firstTryCorrect === u.firstTryAttempts
    },
    {
        id: 'speed',
        name: 'Paling Sat-set',
        desc: 'Rata-rata jawaban di bawah 8 detik!',
        sprite: 'assets/medals/sym_speed.png',
        check: (u) => {
            if (!u.correctAttempts || u.correctAttempts < 5) return false;
            const avgMs = u.totalAnswerTimeMs / u.correctAttempts;
            return avgMs < 8000;
        }
    },
        {
        id: 'langka',
        name: 'Pemburu Langka',
        desc: 'Membuka 2 peti Legendary atau Mythic!',
        sprite: 'assets/medals/sym_langka.png',
        check: (u) => {
            if (!u.answeredRarities) return false;
            const leg = u.answeredRarities.legendary || 0;
            const myth = u.answeredRarities.mythic || 0;
            return (leg + myth) >= 2;
        }
    },
    {
        id: 'streak',
        name: '5-Streak',
        desc: '5 jawaban benar berturut-turut!',
        sprite: 'assets/medals/sym_streak.png',
        check: (u) => (u.longestStreak || 0) >= 5
    },
    {
        id: 'scholar',
        name: 'Si paling rajin',
        desc: 'Membuka 10 peti atau lebih!',
        sprite: 'assets/medals/sym_scholar.png',
        check: (u) => (u.answeredQuestions ? u.answeredQuestions.size : 0) >= 10
    },
    {
        id: 'explorer',
        name: 'Penjelajah',
        desc: 'Menemukan 3 tingkat rarity berbeda!',
        sprite: 'assets/medals/sym_explorer.png',
        check: (u) => {
            if (!u.answeredRarities) return false;
            const rarities = ['common', 'rare', 'epic', 'legendary', 'mythic'];
            const found = rarities.filter(r => (u.answeredRarities[r] || 0) > 0);
            return found.length >= 3;
        }
    },
    {
        id: 'brave',
        name: 'Pemberani',
        desc: 'Selamat dari jebakan bom!',
        sprite: 'assets/medals/sym_brave.png',
        check: (u) => u.hitBomb === true
    },
    {
        id: 'conqueror',
        name: 'Penakluk Peta',
        desc: 'Menemukan seluruh peti di peta!',
        sprite: 'assets/medals/sym_conqueror.png',
        check: (u) => {
            if (!u.questionMaxUses || !u.answeredQuestions) return false;
            let resolved = 0;
            for (const [qId, maxUses] of Object.entries(u.questionMaxUses)) {
                const mine = u.answeredQuestions.has(qId);
                const global = (u.globalQuestionUses && u.globalQuestionUses[qId] || 0) >= maxUses;
                if (mine || global) resolved++;
            }
            return resolved >= u.totalQuestions && u.totalQuestions > 0;
        }
    }
];

// Safety net — nobody walks away with zero medals
window.MEDAL_FALLBACK = {
    id: 'adventurer',
    name: 'Petualang',
    desc: 'Kamu menuntaskan perjalananmu!',
    sprite: 'assets/medals/sym_adventurer.png'
};

/**
 * Returns the list of medals the given user has earned.
 * If they earned zero, returns a single fallback medal.
 */
window.getEarnedMedals = function (user) {
    if (!user) return [window.MEDAL_FALLBACK];

    const earned = [];
    for (const medal of window.MEDAL_DEFS) {
        try {
            if (medal.check(user)) earned.push(medal);
        } catch (e) {
            // A broken check shouldn't crash the ceremony
            console.warn('Medal check failed:', medal.id, e);
        }
    }

    if (earned.length === 0) return [window.MEDAL_FALLBACK];
    return earned;
};
// =============================================================================
// CEREMONY CONTROLLER — tap-to-advance medal reveal
// =============================================================================

window.runMedalCeremony = function () {
    const overlay       = document.getElementById('medal-ceremony');
    const stage         = document.getElementById('medal-stage');
    const spriteEl      = document.getElementById('medal-sprite');
    const nameEl        = document.getElementById('medal-name');
    const descEl        = document.getElementById('medal-desc');
    const progressEl    = document.getElementById('medal-progress');
    const skipBtn       = document.getElementById('medal-skip-btn');

    if (!overlay) return Promise.resolve();

    const medals = window.getEarnedMedals(currentUser);
    if (medals.length === 0) return Promise.resolve();

    let index = 0;
    let tapLocked = false;
    let finished = false;

    function renderMedal(i) {
        const m = medals[i];

        // Reset reveal animation so it replays per medal
        stage.classList.remove('reveal');
        void stage.offsetWidth;   // force reflow

        // Populate content
        if (spriteEl) {
            if (window.bindPixelImage) {
                window.bindPixelImage(spriteEl, m.sprite);
            } else {
                spriteEl.src = m.sprite;
            }
        }
        if (nameEl)     nameEl.textContent     = m.name;
        if (descEl)     descEl.textContent     = m.desc;
        if (progressEl) progressEl.textContent = `${i + 1} / ${medals.length}`;

        // Kick off reveal animation
        stage.classList.add('reveal');

        // Play the shared chime
        if (window.RetroAudio && window.RetroAudio.playLoot) {
            window.RetroAudio.playLoot();
        }

        // 500ms tap lock so double-taps don't skip medals
        tapLocked = true;
        setTimeout(() => { tapLocked = false; }, 500);
    }

    function advance() {
        if (finished || tapLocked) return;
        index++;
        if (index >= medals.length) {
            finish();
        } else {
            renderMedal(index);
        }
    }

    function skip() {
        if (finished) return;
        finish();
    }

    function finish() {
        if (finished) return;
        finished = true;

        // Clean up listeners
        stage.removeEventListener('click', advance);
        document.removeEventListener('keydown', onKey);
        if (skipBtn) skipBtn.removeEventListener('click', skip);

        overlay.classList.add('hidden');
        overlay.classList.remove('fade-out');
        resolveCeremony();
    }

    function onKey(e) {
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
            e.preventDefault();
            advance();
        }
    }

    // ---- Wire listeners ----
    stage.addEventListener('click', advance);
    document.addEventListener('keydown', onKey);
    if (skipBtn) {
        skipBtn.addEventListener('click', (e) => {
            e.stopPropagation();   // don't double-fire with stage click
            skip();
        });
    }

    // ---- Show overlay + first medal ----
    overlay.classList.remove('hidden');
    index = 0;
    renderMedal(0);

    // Return a promise resolved when the ceremony finishes
    let resolveCeremony;
    const donePromise = new Promise(res => { resolveCeremony = res; });
    return donePromise;
};