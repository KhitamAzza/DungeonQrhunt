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
    gameMode: 'casual'
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

// =============================================================================
// SERVER TIME, CHEST CLAIMS & SHARED SCORING
// =============================================================================

// ---- Server clock ----------------------------------------------------------
// Every device has its own clock (and some phones are WAY off). So all game
// timing uses the Firebase server clock: we ask Firebase to stamp the time,
// compare it to our local clock, and keep the difference as an offset.
window.serverTimeOffset = 0;
window.serverNow = () => Date.now() + window.serverTimeOffset;

window.syncServerTime = async function (samples = 3) {
    let best = null;
    for (let i = 0; i < samples; i++) {
        try {
            const t0 = Date.now();
            const res = await fetch(`${FIREBASE_URL}/serverTime.json?auth=${FIREBASE_SECRET}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ '.sv': 'timestamp' })
            });
            let serverTs = await res.json();
            if (typeof serverTs !== 'number') {
                const r2 = await fetch(`${FIREBASE_URL}/serverTime.json?auth=${FIREBASE_SECRET}`);
                serverTs = await r2.json();
            }
            const t1 = Date.now();
            if (typeof serverTs !== 'number') continue;
            const rtt = t1 - t0;
            // keep the sample with the lowest round-trip = most accurate
            if (!best || rtt < best.rtt) best = { rtt, offset: serverTs - (t0 + t1) / 2 };
        } catch (e) { /* try next sample */ }
    }
    if (best) window.serverTimeOffset = best.offset;
    return !!best;
};

// End of game = server-stamped startTime + duration. (Old records that still
// have an explicit endTime keep working.)
window.getGameEnd = function (settings) {
    if (!settings) return null;
    if (typeof settings.endTime === 'number') return settings.endTime;
    if (typeof settings.startTime === 'number' && settings.durationMinutes) {
        return settings.startTime + settings.durationMinutes * 60000;
    }
    return null;
};

// ---- max_uses: enforced on the SERVER side ---------------------------------
// Each correct answer on a real chest POSTs a claim to /chestClaims/<qId>.
// Firebase generates the push-key on the server, so keys sort in the order the
// claims actually landed. Everybody reads the same list; the first `max_uses`
// distinct students win. No stale local counters involved.
function rankClaims(data) {
    if (!data) return [];
    const seen = new Set();
    const out = [];
    Object.keys(data).sort().forEach(key => {
        const pwd = data[key] && data[key].pwd;
        if (!pwd || seen.has(pwd)) return;
        seen.add(pwd);
        out.push({ key, pwd });
    });
    return out;
}

window.fetchChestClaims = async function (qId) {
    const res = await fetch(`${FIREBASE_URL}/chestClaims/${qId}.json?auth=${FIREBASE_SECRET}`);
    return rankClaims(await res.json());
};

window.fetchAllChestClaimCounts = async function () {
    const res = await fetch(`${FIREBASE_URL}/chestClaims.json?auth=${FIREBASE_SECRET}`);
    const data = (await res.json()) || {};
    const counts = {};
    for (const [qId, claims] of Object.entries(data)) counts[qId] = rankClaims(claims).length;
    return counts;
};

// Returns { won, count }. Throws on network errors (caller shows "try again").
window.claimChest = async function (qId, maxUses) {
    const pwd = currentUser.password;
    const post = await fetch(`${FIREBASE_URL}/chestClaims/${qId}.json?auth=${FIREBASE_SECRET}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pwd, name: currentUser.name, ts: { '.sv': 'timestamp' } })
    });
    if (!post.ok) throw new Error('claim write failed');
    const ranked = await window.fetchChestClaims(qId);
    const idx = ranked.findIndex(c => c.pwd === pwd);
    return { won: idx !== -1 && idx < maxUses, count: ranked.length };
};

// ---- Miss limit: ONE rule for live play AND re-login --------------------------
// A "miss" = wrong answer OR timeout on a real chest.
//   penilaian -> 1st miss locks the chest
//   casual    -> 3rd miss locks the chest
//   latihan   -> never locks
window.shouldLockChest = function (mode, misses) {
    if (mode === 'penilaian') return misses >= 1;
    if (mode === 'latihan') return false;
    return misses >= 3;
};

// ---- ONE scoring function, used by BOTH student and teacher ----------------
// Rules (so the phone and the leaderboard can never disagree):
//  - real chest: the student's first CORRECT submission counts, worth its
//    stored points_earned (so retry/speed multipliers are respected)
//  - wrong answers / timeouts: 0
//  - bomb: -penalty, once per bomb chest
//  - hint chests: ignored
window.computeScores = function (submissions, questions) {
    const result = {};
    const list = Array.isArray(submissions) ? submissions : Object.values(submissions || {});
    questions = questions || {};
    list.slice()
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
        .forEach(sub => {
            const pwd = sub.student_password;
            if (!pwd) return;
            const r = result[pwd] || (result[pwd] = {
                rawScore: 0,
                correctCount: 0,
                answeredRarities: { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
                scored: new Set(),
                bombed: new Set()
            });
            const qId = sub.question_id;
            const q = questions[qId];
            const isBomb = sub.is_bomb === true || qId === 'BOMB_TRAP' || (q && q.chest_type === 'bomb');

            if (isBomb) {
                if (!r.bombed.has(qId)) {
                    r.bombed.add(qId);
                    r.rawScore += (typeof sub.points_earned === 'number' && sub.points_earned < 0)
                        ? sub.points_earned
                        : -GAME_CONFIG.bombPenalty;
                }
                return;
            }
            if (!q || q.chest_type === 'hint') return;
            if (sub.is_correct !== true || r.scored.has(qId)) return;

            r.scored.add(qId);
            const rarity = q.rarity ? q.rarity.toLowerCase().trim() : 'common';
            r.rawScore += (typeof sub.points_earned === 'number')
                ? sub.points_earned
                : (GAME_CONFIG.rarityPoints[rarity] || 10);
            r.correctCount++;
            if (r.answeredRarities[rarity] !== undefined) r.answeredRarities[rarity]++;
        });
    return result;
};

window.computeMaxScore = function (questions) {
    let max = 0;
    for (const q of Object.values(questions || {})) {
        if (!q) continue;
        const type = q.chest_type ? q.chest_type.toLowerCase().trim() : 'reward';
        if (type === 'hint' || type === 'bomb') continue;
        const rarity = q.rarity ? q.rarity.toLowerCase().trim() : 'common';
        max += (GAME_CONFIG.rarityPoints[rarity] || 10);
    }
    return max || 1;
};

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
                gameMode: (typeof remote.gameMode === 'string' && ['penilaian','casual','latihan'].includes(remote.gameMode))
                ? remote.gameMode
                : GAME_CONFIG.gameMode
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
    questionTimeouts: {},

    // --- Achievement tracking (used by medals.js) ---
    correctStreak: 0,
    longestStreak: 0,
    totalAnswerTimeMs: 0,
    correctAttempts: 0,
    hitBomb: false,

    // --- First-try scoring (used by submitAnswer, handleTimeUp, medals) ---
    questionAttempted: new Set(),     // chests this student has tried at least once
    questionFirstTryFailed: new Set(), // chests where the FIRST attempt was wrong/timeout
    firstTryCorrect: 0,               // count of chests correct on the 1st attempt
    firstTryAttempts: 0               // count of chests attempted for the 1st time
};
            // Fetch question list to build max_uses map + total real question count.
            // "Real" chests exclude bomb traps and hint chests (matches teacher.js
            // leaderboard logic) since those aren't things a student "completes".
                        let qData = null;
            try {
                const qRes = await fetch(`${FIREBASE_URL}/questions.json?auth=${FIREBASE_SECRET}`);
                qData = await qRes.json();   // ← assign, not declare
                currentUser.questionMaxUses = {};
                let total = 0;
                if (qData) {
                    for (const [qId, q] of Object.entries(qData)) {
                        if (q && (q.chest_type === 'bomb' || q.chest_type === 'hint')) continue;
                        currentUser.questionMaxUses[qId] = q.max_uses || 99;
                        total++;
                    }
                }
                currentUser.totalQuestions = total;
            } catch (e) {
                console.warn("Failed to load question list", e);
                currentUser.questionMaxUses = {};
                currentUser.totalQuestions = 0;
            }

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
                        // Fetch past submissions
            const subsRes = await fetch(`${FIREBASE_URL}/submissions.json?auth=${FIREBASE_SECRET}`);
            const allSubs = await subsRes.json();
            currentUser.globalQuestionUses = await fetchAllChestClaimCounts().catch(() => ({}));

            // Single pass: reconstruct per-student state AND global claim counts
            const byQuestion = {};   // qId -> earliest submission by THIS student

            if (allSubs) {
                Object.values(allSubs).forEach(sub => {
                    // --- Per-student state ---
                    if (sub.student_password === currentUser.password) {
                        if (sub.is_correct === true || sub.is_bomb === true) {
                            currentUser.answeredQuestions.add(sub.question_id);
                        }
                        // Count misses (wrong answers + timeouts) per chest, from the server record
                        if (sub.is_correct !== true && !sub.is_bomb && sub.question_id !== 'BOMB_TRAP') {
                            currentUser.questionTimeouts[sub.question_id] =
                                (currentUser.questionTimeouts[sub.question_id] || 0) + 1;
                        }
                        // Track earliest submission per question, for first-try reconstruction
                        const qId = sub.question_id;
                        if (!byQuestion[qId] || sub.timestamp < byQuestion[qId].timestamp) {
                            byQuestion[qId] = sub;
                        }
                    }
                    // (global max_uses is now read from /chestClaims — see claimChest in this file)
                });
            }

            // Re-apply the miss limit so logging out/in can't reset a locked chest
            // (and the 0.7x / 0.5x retry multipliers survive a re-login too).
            for (const [qId, misses] of Object.entries(currentUser.questionTimeouts)) {
                if (shouldLockChest(GAME_CONFIG.gameMode || 'casual', misses)) {
                    currentUser.answeredQuestions.add(qId);
                }
            }

            // Reconstruct first-try tracking from this student's earliest attempts
            for (const qId in byQuestion) {
                const sub = byQuestion[qId];
                if (sub.is_bomb) continue;                     // bombs don't count
                if (sub.question_id === 'BOMB_TRAP') continue; // legacy
                currentUser.questionAttempted.add(qId);
                currentUser.firstTryAttempts++;
                if (sub.is_correct === true) {
                    currentUser.firstTryCorrect++;
                } else {
                    currentUser.questionFirstTryFailed.add(qId);
                }
            }
                        // --- Initialize stats fields for the finish screen ---
            currentUser.correctCount = 0;
            currentUser.rawScore = 0;
            currentUser.answeredRarities = { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 };
            currentUser.maxPossibleScore = 0;

            // Max possible score — sum of rarity points for all real chests
            if (qData) {
                for (const [qId, q] of Object.entries(qData)) {
                    const chestType = q.chest_type ? q.chest_type.toLowerCase().trim() : 'reward';
                    if (chestType === 'hint' || chestType === 'bomb') continue;
                    const rarity = q.rarity ? q.rarity.toLowerCase().trim() : 'common';
                    currentUser.maxPossibleScore += (GAME_CONFIG.rarityPoints[rarity] || 10);
                }
            }
            if (currentUser.maxPossibleScore === 0) currentUser.maxPossibleScore = 1;

            // Rebuild correctCount / rawScore / answeredRarities with the SAME
            // scorer the teacher leaderboard uses (bomb penalties included).
            if (qData && allSubs) {
                const mine = computeScores(Object.values(allSubs), qData)[currentUser.password];
                if (mine) {
                    currentUser.rawScore = mine.rawScore;
                    currentUser.correctCount = mine.correctCount;
                    currentUser.answeredRarities = mine.answeredRarities;
                }
            }
            // Medals: 'brave' must survive a re-login, so rebuild it from past submissions.
            currentUser.hitBomb = !!allSubs && Object.values(allSubs).some(sub =>
                sub.student_password === currentUser.password && sub.is_bomb === true);

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

            await syncServerTime();
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
    waitForGameStart();
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

// If the student logs in BEFORE the teacher presses start, keep checking and
// drop them into the game the moment it starts (no re-login needed).
let waitingForGameTimer = null;
function waitForGameStart() {
    clearInterval(waitingForGameTimer);
    waitingForGameTimer = setInterval(async () => {
        if (!currentUser) { clearInterval(waitingForGameTimer); return; }
        await checkGameStatusAndUpdateTimer();
        if (isGameActive) {
            clearInterval(waitingForGameTimer);
            resetStudentUI();
            showScreen(studentDashboard);
            updateProgressTracker();
            startStudentTimer();
            startScanner();
            startAnnouncementPolling();
        }
    }, 4000);
}

passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginBtn.click();
});

function handleLogout() {
    currentUser = null;
    if (typeof waitingForGameTimer !== 'undefined') clearInterval(waitingForGameTimer);
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