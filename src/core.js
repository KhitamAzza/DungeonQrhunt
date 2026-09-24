// =============================================================================
// 1. CONFIGURATION & GLOBAL STATE
// =============================================================================
window.FIREBASE_URL = 'https://qr-codehunt-default-rtdb.asia-southeast1.firebasedatabase.app';
window.FIREBASE_SECRET = 'yhqWJQqmv7KY1gAGBUubYbbwaQtfnV3kjYR1hSIK';

window.currentUser = null;
window.isGameActive = false;

window.GAME_CONFIG = {
    rarityPoints:       { common: 10, rare: 25, epic: 50, legendary: 100, mythic: 250 },
    timeLimits:         { common: 30000, rare: 20000, epic: 15000, legendary: 10000, mythic: 5000 },
    speedThresholds: [
        { minPercent: 0.833, multiplier: 1.0 },
        { minPercent: 0.333, multiplier: 0.7 },
        { minPercent: 0,     multiplier: 0.5 }
    ],
    timeoutMultipliers: { 0: 1.0, 1: 0.7, 2: 0.5 },
    bombPenalty: 30,
    // 🔁 REDEMPTION — if true, answering a chest wrong no longer locks it
    // immediately. The student can go back and retry, sharing the SAME
    // attempt counter and the SAME timeoutMultipliers tiers above as a
    // timeout uses: 1st miss (wrong OR timeout) = 0.7x reward, 2nd = 0.5x,
    // 3rd = locked for good with 0 reward — identical to the existing
    // timeout rule. Set to false to restore the old behavior (any wrong
    // answer locks the chest immediately, no retry).
    redemptionEnabled: true
};

const DEFAULT_LOOT_TABLE = {
    "common": [
        { "item_id": "sandalswallow", "name": "Sandal Suwaloow", "description": "Pasangan hilang entah kemana", "minPercent": 0.75 },
        { "item_id": "snek", "name": "Snek populer", "description": "Jadi rebutan di koperasi", "minPercent": 0.4 },
        { "item_id": "es_teh_manis", "name": "Sweet Es teh", "description": "Menyegarkan jiwa yang bersedih", "minPercent": 0 }
    ],
    "rare": [
        { "item_id": "parfum", "name": "Parfum mahal", "description": "Membuatmu wangi dan disukai banyak orang", "minPercent": 0.75 },
        { "item_id": "dasi", "name": "Dasi kebanggaan", "description": "jika tidak ada tatib bertindak.", "minPercent": 0.4 },
        { "item_id": "kunci", "name": "Kunci emas", "description": "bisa membuka pintu disekitar sini", "minPercent": 0 }
    ],
    "epic": [
        { "item_id": "router", "name": "Router Fb LING", "description": "Sipaling dicari kaum mendang-mending.", "minPercent": 0.8 },
        { "item_id": "TWSkaumhave", "name": "TWS Kaum Have", "description": "Favorit GenZ biar keliatan kaum HAVE", "minPercent": 0.6 },
        { "item_id": "chargerhp", "name": "Charger HP langka", "description": "Teman setia yang dipake rebutan genZ.", "minPercent": 0.4 },
        { "item_id": "micpenaikihsg", "name": "Mic pengguncang negara", "description": "sekali bicara kiamat maju 1 hari", "minPercent": 0.2 }
    ],
    "legendary": [
        { "item_id": "kopyah", "name": "Songkok Pak Rahmad", "description": "Songkok misterius pak rahmad yang tahan banting.", "minPercent": 0.8 },
        { "item_id": "hpkuat", "name": "HP Nokia 3310", "description": "Konon katanya tidak bisa dihancurkan oleh tangan manusia biasa.", "minPercent": 0.4 },
        { "item_id": "kamerabunabila", "name": "Kamera bu Nabila", "description": "Lebih tajam dari mata elang, bisa melihat masa depan.", "minPercent": 0 }
    ],
    "mythic": [
        { "item_id": "mahkota", "name": "Mahkota raja", "description": "Lebih berharga daripada kebun sawit", "minPercent": 0.75 },
        { "item_id": "buku_ala_ala", "name": "Buku ala-ala", "description": "saat buku ini tercipta 5 gunung meletus, dan hutan terbakar", "minPercent": 0.4 },
        { "item_id": "ijazah", "name": "Ijazah yang hilang", "description": "Sepertinya ini milik seseorang..", "minPercent": 0.15 },
        { "item_id": "malapangankerja", "name": "Map yang dijanjikan", "description": "bisa digunakan mencari 19 juta lapangan pekerjaan.", "minPercent": 0 }
    ]
};

// Initialize default loot table immediately so it works even on file:// protocol without local server
window.lootTable = DEFAULT_LOOT_TABLE;
window.lootItemsById = {};
Object.entries(DEFAULT_LOOT_TABLE).forEach(([rarity, drops]) => {
    drops.forEach(drop => {
        const imagePath = drop.image || `assets/items/${drop.item_id}.png`;
        window.lootItemsById[drop.item_id] = { ...drop, rarity, image: imagePath };
    });
});

/**
 * Loads loot_table.json dynamically from local file or server,
 * updating item metadata, descriptions, minPercent, and image asset paths.
 */
async function loadLootTable() {
    try {
        const res = await fetch('loot_table.json');
        if (res.ok) {
            const data = await res.json();
            if (data && typeof data === 'object') {
                window.lootTable = data;
                window.lootItemsById = {};
                if (!window.ASSET_CONFIG) window.ASSET_CONFIG = {};
                if (!window.ASSET_CONFIG.items) window.ASSET_CONFIG.items = {};

                Object.entries(data).forEach(([rarity, drops]) => {
                    if (Array.isArray(drops)) {
                        drops.forEach(drop => {
                            const imagePath = drop.image || drop.icon || drop.asset || `assets/items/${drop.item_id}.png`;
                            window.lootItemsById[drop.item_id] = { ...drop, rarity, image: imagePath };
                            window.ASSET_CONFIG.items[drop.item_id] = imagePath;
                        });
                    }
                });
                console.log("💎 Loot table successfully loaded from loot_table.json:", Object.keys(window.lootItemsById).length, "items.");
                return window.lootTable;
            }
        }
    } catch (e) {
        console.warn("Using built-in default loot table.", e);
    }
    return window.lootTable;
}
window.loadLootTable = loadLootTable;
let lootTableLoaded = loadLootTable();

// Start fetching remote config immediately
window.gameConfigLoaded = fetchGameConfig();

async function fetchGameConfig() {
    try {
        const res = await fetch(`${FIREBASE_URL}/config.json?auth=${FIREBASE_SECRET}`);
        const remote = await res.json();
        if (remote) {
            GAME_CONFIG = {
                rarityPoints: { ...GAME_CONFIG.rarityPoints, ...(remote.rarityPoints || {}) },
                timeLimits: { ...GAME_CONFIG.timeLimits, ...(remote.timeLimits || {}) },
                speedThresholds: (Array.isArray(remote.speedThresholds) && remote.speedThresholds.length > 0)
                    ? remote.speedThresholds
                    : GAME_CONFIG.speedThresholds,
                timeoutMultipliers: { ...GAME_CONFIG.timeoutMultipliers, ...(remote.timeoutMultipliers || {}) },
                bombPenalty: (typeof remote.bombPenalty === 'number') ? remote.bombPenalty : GAME_CONFIG.bombPenalty,
                redemptionEnabled: (typeof remote.redemptionEnabled === 'boolean') ? remote.redemptionEnabled : GAME_CONFIG.redemptionEnabled
            };
        }
    } catch (e) {
        console.warn("Using built-in default config.", e);
    }
}

// =============================================================================
// 2. DOM ELEMENTS (Shared & Core)
// =============================================================================
const loginScreen = document.getElementById('login-screen');
const studentDashboard = document.getElementById('student-dashboard');
const teacherDashboard = document.getElementById('teacher-dashboard');
const gameOverOverlay = document.getElementById('game-over-overlay');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const teacherLogoutBtn = document.getElementById('teacher-logout-btn');
const gameOverLogoutBtn = document.getElementById('game-over-logout-btn');
const displayName = document.getElementById('display-name');
const displayClass = document.getElementById('display-class');
const soundToggleBtn = document.getElementById('sound-toggle-btn');
const teacherSoundToggleBtn = document.getElementById('teacher-sound-toggle-btn');

// =============================================================================
// 3. AUDIO TOGGLE HELPER
// =============================================================================
function updateSoundIcons() {
    const isMuted = window.RetroAudio ? window.RetroAudio.isMuted() : false;
    const icon = isMuted ? '🔇' : '🔊';
    if (soundToggleBtn) soundToggleBtn.textContent = icon;
    if (teacherSoundToggleBtn) teacherSoundToggleBtn.textContent = icon;
}

if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
        if (window.RetroAudio) {
            window.RetroAudio.toggleMute();
            updateSoundIcons();
            if (!window.RetroAudio.isMuted()) window.RetroAudio.playClick();
        }
    });
}
if (teacherSoundToggleBtn) {
    teacherSoundToggleBtn.addEventListener('click', () => {
        if (window.RetroAudio) {
            window.RetroAudio.toggleMute();
            updateSoundIcons();
            if (!window.RetroAudio.isMuted()) window.RetroAudio.playClick();
        }
    });
}
updateSoundIcons();

// Global click sound for interactive elements
document.addEventListener('click', (e) => {
    if (e.target.matches('button, .tab-btn, .option-btn, .close-btn, .loot-slot')) {
        if (window.RetroAudio) window.RetroAudio.playClick();
    }
}, true);

// core.js
function resetStudentUI() {
    // Re-show the scanner area (it may have been hidden by loadQuestion
    // in a previous session on this same device).
    const scannerArea = document.getElementById('scanner-area');
    if (scannerArea) scannerArea.classList.remove('hidden');

    // Every overlay / modal that could still be open from a prior session.
    const elementsToHide = [
        'finish-overlay',
        'parchment-overlay',
        'chest-overlay',
        'scroll-overlay',
        'bomb-overlay',
        'locked-overlay',
        'hint-overlay',
        'secret-code-modal',
        'game-over-overlay',
        'loot-reveal-modal',
        'inventory-modal',
        'item-detail-modal',
        'question-modal',
        'feedback-area'
    ];
    elementsToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    // Clear any stale question/answer markup left behind.
    const parchmentOptions = document.getElementById('parchment-q-options');
    if (parchmentOptions) parchmentOptions.innerHTML = '';

    const qOptionsEl = document.getElementById('q-options');
    if (qOptionsEl) qOptionsEl.innerHTML = '';

    const qTextEl = document.getElementById('q-text');
    if (qTextEl) {
        qTextEl.textContent = '';
        qTextEl.style.color = 'var(--text-light)';
    }

    const parchmentQTextEl = document.getElementById('parchment-q-text');
    if (parchmentQTextEl) {
        parchmentQTextEl.textContent = '';
        parchmentQTextEl.classList.remove('time-up-text');
        parchmentQTextEl.style.color = 'var(--ink-dark)';
    }

    // Reset the parchment timer bar back to full / default colour.
    const timerBar = document.querySelector('.parchment-timer-bar');
    if (timerBar) {
        timerBar.style.width = '100%';
        timerBar.style.backgroundColor = '';
    }

    // Reset the shuffled suspense phrase so it doesn't flash stale text.
    const suspenseTextEl = document.getElementById('chest-suspense-text');
    if (suspenseTextEl) {
        suspenseTextEl.classList.remove('visible');
        suspenseTextEl.textContent = '';
    }

    // Hide the back button on the chest overlay (loadQuestion flow re-shows it).
    const chestBackBtn = document.getElementById('chest-back-btn');
    if (chestBackBtn) chestBackBtn.classList.add('hidden');
}
// =============================================================================
// 4. SCREEN MANAGEMENT
// =============================================================================
function showScreen(screenElement) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    screenElement.classList.add('active');
    screenElement.style.display = (screenElement.id === 'student-dashboard' || screenElement.id === 'login-screen') ? 'flex' : 'block';
    if (gameOverOverlay) gameOverOverlay.classList.add('hidden');
    window.scrollTo(0, 0);
}

function showGameOver() {
    if (gameOverOverlay) gameOverOverlay.classList.remove('hidden');
    if (window.html5QrcodeScanner) {
        window.html5QrcodeScanner.stop().then(() => {
            window.html5QrcodeScanner.clear();
            window.html5QrcodeScanner = null;
        }).catch(err => console.log(err));
    }
    if (window.studentTimerInterval) clearInterval(window.studentTimerInterval);
}

// =============================================================================
// 5. LOGIN & LOGOUT LOGIC
// =============================================================================
loginBtn.addEventListener('click', async () => {
    const password = passwordInput.value.trim();
    if (!password) {
        alert("Masukkan password terlebih dahulu!");
        return;
    }

    // Teacher Route (immediate switch)
    if (password.toLowerCase() === 'admin') {
        showScreen(teacherDashboard);
        if (typeof loadTeacherDashboard === 'function') loadTeacherDashboard();
        passwordInput.value = '';
        return;
    }

    await gameConfigLoaded;

    // Student Route
    loginBtn.textContent = "MEMERIKSA...";
    loginBtn.disabled = true;

    try {
        const response = await fetch(`${FIREBASE_URL}/students/${password}.json?auth=${FIREBASE_SECRET}`);
        const studentData = await response.json();

        if (studentData && studentData.name) {
            currentUser = {
                password,
                name: studentData.name,
                class: studentData.class,
                answeredQuestions: new Set(),
                collectedItems: [],
                questionTimeouts: {}
            };

            // Reload previously collected loot for this student
            try {
                const invRes = await fetch(`${FIREBASE_URL}/inventory/${password}.json?auth=${FIREBASE_SECRET}`);
                const invData = await invRes.json();
                currentUser.collectedItems = invData
                    ? Object.values(invData).map(entry =>
                        typeof entry === 'string' ? { item_id: entry, points: 0 } : entry
                      )
                    : [];
            } catch (e) {
                console.warn("Failed to load saved inventory", e);
            }

            // Fetch past submissions
            const subsRes = await fetch(`${FIREBASE_URL}/submissions.json?auth=${FIREBASE_SECRET}`);
            const allSubs = await subsRes.json();
            currentUser.globalQuestionUses = {};

            if (allSubs) {
                Object.values(allSubs).forEach(sub => {
                    if (sub.student_password === currentUser.password) {
    if (sub.is_correct === true) {
        currentUser.answeredQuestions.add(sub.question_id);
    }
}
                    const qId = sub.question_id;
                    currentUser.globalQuestionUses[qId] = (currentUser.globalQuestionUses[qId] || 0) + 1;
                });
            }

            // Fetch Questions & Calculate Objectives
            const questionsRes = await fetch(`${FIREBASE_URL}/questions.json?auth=${FIREBASE_SECRET}`);
            const allQuestions = await questionsRes.json();

            currentUser.totalQuestions = 0;
            currentUser.questionMaxUses = {};
            currentUser.maxPossibleScore = 0;

            if (allQuestions) {
                for (const [qId, q] of Object.entries(allQuestions)) {
                    const chestType = q.chest_type ? q.chest_type.toLowerCase().trim() : 'reward';
                    if (chestType === 'hint' || chestType === 'bomb') continue;

                    currentUser.totalQuestions++;
                    currentUser.questionMaxUses[qId] = q.max_uses || 99;
                    const rarity = q.rarity ? q.rarity.toLowerCase().trim() : 'common';
                    currentUser.maxPossibleScore += (GAME_CONFIG.rarityPoints[rarity] || 10);
                }
            }
            if (currentUser.maxPossibleScore === 0) currentUser.maxPossibleScore = 1;

            // Calculate Local Stats for Finish Screen
            currentUser.correctCount = 0;
            currentUser.rawScore = 0;
            currentUser.answeredRarities = { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 };

            if (allQuestions && allSubs) {
                Object.values(allSubs).forEach(sub => {
                    if (sub.student_password === currentUser.password) {
                        const qId = sub.question_id;
                        const q = allQuestions[qId];
                        if (q) {
                            const rarity = q.rarity ? q.rarity.toLowerCase().trim() : 'common';
                            if (currentUser.answeredRarities[rarity] !== undefined) {
                                currentUser.answeredRarities[rarity]++;
                            }
                            const chestType = q.chest_type ? q.chest_type.toLowerCase().trim() : 'reward';
                            if (chestType !== 'bomb' && sub.selected_answer === q.correct_answer) {
                                currentUser.correctCount++;
                                currentUser.rawScore += (typeof sub.points_earned === 'number'
                                    ? sub.points_earned
                                    : (GAME_CONFIG.rarityPoints[rarity] || 10));
                            }
                        }
                    }
                });
            }

            // Check if already finished — counts ONLY chests THIS student personally
            // opened (answeredQuestions). Chests other students used up their max_uses
            // on are handled separately by the "locked" overlay when this student
            // actually tries to scan that specific one — they should NOT count toward
            // finishing the whole game for someone who never touched them.
            let resolvedChests = 0;
            if (currentUser.questionMaxUses) {
                for (const qId of Object.keys(currentUser.questionMaxUses)) {
                    if (currentUser.answeredQuestions.has(qId)) resolvedChests++;
                }
            }
            const isFinished = resolvedChests >= currentUser.totalQuestions && currentUser.totalQuestions > 0;

            // Refresh loot table if fetch is available
            await loadLootTable();

            displayName.textContent = currentUser.name;
            displayClass.textContent = currentUser.class;

            await checkGameStatusAndUpdateTimer();

           if (isFinished) {
    resetStudentUI();
    showScreen(studentDashboard);
    showFinishScreen();
} else if (isGameActive) {
    resetStudentUI();
    showScreen(studentDashboard);
    updateProgressTracker();
    startStudentTimer();
    startScanner();
    startAnnouncementPolling();
} else {
    resetStudentUI();
    showGameOver();
}
        } else {
            alert("Password tidak ditemukan. Silakan hubungi Guru / Admin.");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("Gagal terhubung. Periksa koneksi internet.");
    } finally {
        loginBtn.textContent = "MASUK KE GAME";
        loginBtn.disabled = false;
        passwordInput.value = '';
    }
});

passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginBtn.click();
});

function handleLogout() {
    currentUser = null;
    if (window.studentTimerInterval) clearInterval(window.studentTimerInterval);
    if (window.html5QrcodeScanner) {
        window.html5QrcodeScanner.stop().then(() => {
            window.html5QrcodeScanner.clear();
            window.html5QrcodeScanner = null;
        }).catch(err => console.log(err));
    }

    resetStudentUI();       // ← replaces the old overlaysToHide.forEach(...) block

    showScreen(loginScreen);
    if (passwordInput) passwordInput.value = '';
}

logoutBtn.addEventListener('click', handleLogout);
teacherLogoutBtn.addEventListener('click', handleLogout);
gameOverLogoutBtn.addEventListener('click', handleLogout);

window.showGameOver = showGameOver;
window.handleLogout = handleLogout;