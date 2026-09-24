// =============================================================================
// 1. CONFIGURATION & SAFE DOM ELEMENTS
// =============================================================================
const EXPORT_API_URL = 'https://script.google.com/macros/s/AKfycbyyfXoe7tzhnyGy17O5azHjoS8eVDfP7oh4UXiuX41rxnfo-f2FgX_Mb-cPEYdnejYZwg/exec';

const getEl = (id) => document.getElementById(id);

const gameDurationInput = getEl('game-duration');
const startGameBtn = getEl('start-game-btn');
const stopGameBtn = getEl('stop-game-btn');
const gameStatusText = getEl('game-status-text');
const refreshScoresBtn = getEl('refresh-scores-btn');
const leaderboardBody = getEl('leaderboard-body');
const purgeSubmissionsBtn = getEl('purge-submissions-btn');
const exportSheetsBtn = getEl('export-sheets-btn');
const saveConfigBtn = getEl('save-config-btn');
const configSaveStatus = getEl('config-save-status');
const configLockNotice = getEl('config-lock-notice');
const speedThresholdsList = getEl('speed-thresholds-list');
const addSpeedThresholdBtn = getEl('add-speed-threshold-btn');

let currentLeaderboardData = [];
let currentMaxScore = 0;

// =============================================================================
// 2. TAB SWITCHING LOGIC
// =============================================================================
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
        tabBtns.forEach(b => b.classList.remove('active-tab'));
        tabContents.forEach(c => c.classList.remove('active-tab-content'));

        btn.classList.add('active-tab');
        const targetId = btn.getAttribute('data-tab');
        const targetContent = document.getElementById(targetId);
        if (targetContent) targetContent.classList.add('active-tab-content');

        if (targetId === 'tab-config') {
            await checkTeacherGameStatus();
            populateConfigForm();
            updateConfigLockState(isGameActive);
        } else if (targetId === 'tab-assets') {
            if (typeof window.loadLootTable === 'function') await window.loadLootTable();
            renderAssetStudio();
        }
    });
});

// =============================================================================
// 3. TEACHER DASHBOARD INIT & STATUS
// =============================================================================
async function loadTeacherDashboard() {
    if (typeof window.loadLootTable === 'function') await window.loadLootTable();
    await checkTeacherGameStatus();
    calculateAndRenderLeaderboard();
    await gameConfigLoaded;
    populateConfigForm();
    updateConfigLockState(isGameActive);
    renderAssetStudio();
}

async function checkTeacherGameStatus() {
    if (!gameStatusText) return;
    try {
        const response = await fetch(`${FIREBASE_URL}/gameSettings.json?auth=${FIREBASE_SECRET}`);
        const settings = await response.json();
        if (settings && settings.isActive) {
            const now = Date.now();
            if (now < settings.endTime) {
                const minsLeft = Math.ceil((settings.endTime - now) / 60000);
                gameStatusText.textContent = `🟢 GAME AKTIF - Sisa Waktu: ~${minsLeft} menit.`;
                gameStatusText.style.color = "var(--green-emerald)";
                isGameActive = true;
            } else {
                gameStatusText.textContent = `🔴 GAME BERAKHIR (Waktu Habis).`;
                gameStatusText.style.color = "var(--red-crimson)";
                isGameActive = false;
            }
        } else {
            gameStatusText.textContent = `🔴 GAME BERHENTI / BELUM DIMULAI.`;
            gameStatusText.style.color = "var(--red-crimson)";
            isGameActive = false;
        }
    } catch (error) {
        gameStatusText.textContent = "⚠️ Tidak dapat memeriksa status game.";
    }
}

// =============================================================================
// 4. GAME CONTROLS
// =============================================================================
if (startGameBtn) {
    startGameBtn.addEventListener('click', async () => {
        const duration = parseInt(gameDurationInput.value);
        if (!duration || duration < 1) {
            alert("Masukkan durasi permainan yang valid (dalam menit).");
            return;
        }
        const now = Date.now();
        const settings = {
            isActive: true,
            durationMinutes: duration,
            startTime: now,
            endTime: now + (duration * 60 * 1000)
        };
        startGameBtn.disabled = true;
        startGameBtn.textContent = "MEMULAI...";
        try {
            await fetch(`${FIREBASE_URL}/gameSettings.json?auth=${FIREBASE_SECRET}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            alert("🎮 Permainan Berhasil Dimulai!");
            await checkTeacherGameStatus();
            updateConfigLockState(isGameActive);
        } finally {
            startGameBtn.disabled = false;
            startGameBtn.textContent = "▶️ MULAI GAME";
        }
    });
}

if (stopGameBtn) {
    stopGameBtn.addEventListener('click', async () => {
        if (!confirm("Hentikan permainan sekarang? Siswa tidak akan bisa menjawab lagi.")) return;
        stopGameBtn.disabled = true;
        stopGameBtn.textContent = "MENGHENTIKAN...";
        try {
            await fetch(`${FIREBASE_URL}/gameSettings.json?auth=${FIREBASE_SECRET}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: false })
            });
            alert("⏹️ Permainan Telah Dihentikan.");
            await checkTeacherGameStatus();
            updateConfigLockState(isGameActive);
        } finally {
            stopGameBtn.disabled = false;
            stopGameBtn.textContent = "⏹️ HENTIKAN SEKARANG";
        }
    });
}

// =============================================================================
// 5. LEADERBOARD & EXPORT
// =============================================================================
if (refreshScoresBtn) refreshScoresBtn.addEventListener('click', calculateAndRenderLeaderboard);

async function calculateAndRenderLeaderboard() {
    if (!leaderboardBody) return;
    leaderboardBody.innerHTML = "<tr><td colspan='6' style='text-align:center; padding:20px; color:var(--gold-bright);'>Menghitung nilai siswa...</td></tr>";
    await gameConfigLoaded;

    try {
        const [studentsRes, questionsRes, submissionsRes] = await Promise.all([
            fetch(`${FIREBASE_URL}/students.json?auth=${FIREBASE_SECRET}`).then(r => r.json()),
            fetch(`${FIREBASE_URL}/questions.json?auth=${FIREBASE_SECRET}`).then(r => r.json()),
            fetch(`${FIREBASE_URL}/submissions.json?auth=${FIREBASE_SECRET}`).then(r => r.json())
        ]);

        const students = studentsRes || {};
        const questions = questionsRes || {};
        const submissions = submissionsRes ? Object.values(submissionsRes) : [];

        let maxPossibleScore = 0;
        for (const qId in questions) {
            const q = questions[qId];
            if (q && (q.chest_type === 'bomb' || q.chest_type === 'hint')) continue;
            const rarity = q.rarity ? q.rarity.toLowerCase().trim() : 'common';
            maxPossibleScore += (GAME_CONFIG.rarityPoints[rarity] || 10);
        }
        if (maxPossibleScore === 0) maxPossibleScore = 1;
        currentMaxScore = maxPossibleScore;

        const scores = {};
        for (const [password, data] of Object.entries(students)) {
            scores[password] = { name: data.name, class: data.class, rawScore: 0, questionsAnswered: new Set() };
        }

        submissions.forEach(sub => {
            const qId = sub.question_id;
            const studentPwd = sub.student_password;
            if (!scores[studentPwd]) return;

            const question = questions[qId];

            if (qId === 'BOMB_TRAP' || (question && question.chest_type === 'bomb')) {
                if (!scores[studentPwd].questionsAnswered.has(qId)) {
                    scores[studentPwd].questionsAnswered.add(qId);
                    scores[studentPwd].rawScore -= GAME_CONFIG.bombPenalty;
                }
                return;
            }

            if (question && question.chest_type === 'hint') return;
            if (!question) return;

            if (!scores[studentPwd].questionsAnswered.has(qId)) {
                scores[studentPwd].questionsAnswered.add(qId);
                if (sub.selected_answer === question.correct_answer) {
                    const rarity = question.rarity ? question.rarity.toLowerCase().trim() : 'common';
                    scores[studentPwd].rawScore += (typeof sub.points_earned === 'number'
                        ? sub.points_earned
                        : (GAME_CONFIG.rarityPoints[rarity] || 10));
                }
            }
        });

        const leaderboard = Object.values(scores).map(s => {
            const percentage = (s.rawScore / maxPossibleScore) * 100;
            let rank = "Parah";
            if (percentage >= 90) rank = "🏆 Super";
            else if (percentage >= 80) rank = "A-Rank";
            else if (percentage >= 70) rank = "B-Rank";
            else if (percentage >= 60) rank = "C-Rank";
            return {
                ...s,
                questionsAnswered: s.questionsAnswered.size,
                percentage: percentage.toFixed(1),
                rank: rank
            };
        }).sort((a, b) => b.rawScore - a.rawScore);

        currentLeaderboardData = leaderboard.map((s, i) => ({
            rank_num: `#${i + 1}`,
            name: s.name,
            class: s.class,
            raw_score: `${s.rawScore} / ${maxPossibleScore}`,
            percentage: `${s.percentage}%`,
            arcade_rank: s.rank
        }));

        if (leaderboard.length === 0) {
            leaderboardBody.innerHTML = "<tr><td colspan='6' style='text-align:center; padding:20px; color:#aaa;'>Belum ada data siswa.</td></tr>";
            return;
        }

        leaderboardBody.innerHTML = leaderboard.map((s, i) => `
            <tr>
                <td style="font-family:var(--font-pixel); font-size:10px; color:var(--gold-bright);">#${i + 1}</td>
                <td><strong>${s.name}</strong></td>
                <td>${s.class}</td>
                <td style="font-family:monospace; font-size:14px;">${s.rawScore} / ${maxPossibleScore}</td>
                <td style="font-family:monospace; font-weight:bold;">${s.percentage}%</td>
                <td style="font-weight:bold; color: ${s.percentage >= 80 ? 'var(--gold-bright)' : (s.percentage >= 60 ? 'var(--green-emerald)' : 'var(--red-crimson)')};">${s.rank}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error("Leaderboard error:", error);
        leaderboardBody.innerHTML = "<tr><td colspan='6' style='color:var(--red-crimson); text-align:center;'>Gagal memuat nilai leaderboard.</td></tr>";
    }
}

// Export to Google Sheets
if (exportSheetsBtn) {
    exportSheetsBtn.addEventListener('click', async () => {
        if (currentLeaderboardData.length === 0) {
            alert("Tidak ada data untuk di-export. Refresh leaderboard terlebih dahulu.");
            return;
        }
        const sessionName = prompt("Nama Sesi / Kelas:", "Sesi Kuis Berburu Harta");
        if (!sessionName) return;

        exportSheetsBtn.textContent = "EXPORTING...";
        exportSheetsBtn.disabled = true;

        try {
            await fetch(EXPORT_API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionName, leaderboard: currentLeaderboardData })
            });
            alert(`✅ Berhasil mengekspor data ${currentLeaderboardData.length} siswa ke Google Sheets!`);
        } catch (error) {
            alert("❌ Gagal mengekspor data ke Sheets.");
        } finally {
            exportSheetsBtn.textContent = "📊 EXPORT TO SHEETS";
            exportSheetsBtn.disabled = false;
        }
    });
}

// Clear Answers
if (purgeSubmissionsBtn) {
    purgeSubmissionsBtn.addEventListener('click', async () => {
        if (!confirm("⚠️ PERINGATAN: Hapus SEMUA jawaban, riwayat peti, dan loot sesi ini? Tindakan ini tidak bisa dibatalkan!")) return;
        purgeSubmissionsBtn.textContent = "MENGHAPUS...";
        purgeSubmissionsBtn.disabled = true;
        try {
            await Promise.all([
                fetch(`${FIREBASE_URL}/submissions.json?auth=${FIREBASE_SECRET}`, { method: 'DELETE' }),
                fetch(`${FIREBASE_URL}/announcements.json?auth=${FIREBASE_SECRET}`, { method: 'DELETE' }),
                fetch(`${FIREBASE_URL}/inventory.json?auth=${FIREBASE_SECRET}`, { method: 'DELETE' })
            ]);
            alert("✅ Seluruh jawaban & progres siswa telah dibersihkan!");
            calculateAndRenderLeaderboard();
        } catch (error) {
            alert("❌ Gagal membersihkan data.");
        } finally {
            purgeSubmissionsBtn.textContent = "🗑️ BERSIHKAN SEMUA DATA SESI";
            purgeSubmissionsBtn.disabled = false;
        }
    });
}

// =============================================================================
// 6. GAME RULES / CONFIG EDITOR
// =============================================================================
function populateConfigForm() {
    if (!getEl('cfg-points-common')) return;

    getEl('cfg-points-common').value = GAME_CONFIG.rarityPoints.common;
    getEl('cfg-points-rare').value = GAME_CONFIG.rarityPoints.rare;
    getEl('cfg-points-epic').value = GAME_CONFIG.rarityPoints.epic;
    getEl('cfg-points-legendary').value = GAME_CONFIG.rarityPoints.legendary;
    getEl('cfg-points-mythic').value = GAME_CONFIG.rarityPoints.mythic;

    getEl('cfg-time-common').value = GAME_CONFIG.timeLimits.common / 1000;
    getEl('cfg-time-rare').value = GAME_CONFIG.timeLimits.rare / 1000;
    getEl('cfg-time-epic').value = GAME_CONFIG.timeLimits.epic / 1000;
    getEl('cfg-time-legendary').value = GAME_CONFIG.timeLimits.legendary / 1000;
    getEl('cfg-time-mythic').value = GAME_CONFIG.timeLimits.mythic / 1000;

    renderSpeedThresholdRows(GAME_CONFIG.speedThresholds);

    getEl('cfg-timeout-0').value = GAME_CONFIG.timeoutMultipliers[0];
    getEl('cfg-timeout-1').value = GAME_CONFIG.timeoutMultipliers[1];
    getEl('cfg-timeout-2').value = GAME_CONFIG.timeoutMultipliers[2];

    getEl('cfg-bomb-penalty').value = GAME_CONFIG.bombPenalty;
        // 🔁 NEW: populate redemption toggle
    const redemptionCheckbox = getEl('cfg-redemption-enabled');
    if (redemptionCheckbox) {
        redemptionCheckbox.checked = GAME_CONFIG.redemptionEnabled !== false;
    }
}

function createSpeedThresholdRow(minPercent, multiplier) {
    const row = document.createElement('div');
    row.className = 'speed-threshold-row';
    row.style.cssText = 'display:flex; gap:10px; align-items:flex-end; margin-bottom:8px;';
    row.innerHTML = `
        <label style="flex:1;">% Sisa Waktu Min:
            <input type="number" class="cfg-speed-minpercent" step="0.01" min="0" max="1" value="${minPercent}">
        </label>
        <label style="flex:1;">Multiplier:
            <input type="number" class="cfg-speed-multiplier" step="0.01" min="0" value="${multiplier}">
        </label>
        <button type="button" class="btn-logout btn-remove-tier" style="padding:8px 14px; width:auto;">✕</button>
    `;
    row.querySelector('.btn-remove-tier').addEventListener('click', () => {
        if (speedThresholdsList.querySelectorAll('.speed-threshold-row').length > 1) {
            row.remove();
        } else if (configSaveStatus) {
            configSaveStatus.style.color = "var(--red-crimson)";
            configSaveStatus.textContent = "⚠️ Minimal harus ada 1 tier kecepatan.";
        }
    });
    return row;
}

function renderSpeedThresholdRows(thresholds) {
    if (!speedThresholdsList) return;
    speedThresholdsList.innerHTML = '';
    const sorted = [...(thresholds || [])].sort((a, b) => b.minPercent - a.minPercent);
    (sorted.length > 0 ? sorted : [{ minPercent: 0, multiplier: 1.0 }])
        .forEach(t => speedThresholdsList.appendChild(createSpeedThresholdRow(t.minPercent, t.multiplier)));
}

function readSpeedThresholdRows() {
    if (!speedThresholdsList) return GAME_CONFIG.speedThresholds;
    const rows = [...speedThresholdsList.querySelectorAll('.speed-threshold-row')];
    const tiers = rows.map(row => ({
        minPercent: Number(row.querySelector('.cfg-speed-minpercent').value) || 0,
        multiplier: Number(row.querySelector('.cfg-speed-multiplier').value) || 0
    }));
    if (!tiers.some(t => t.minPercent <= 0)) {
        const lowest = tiers.reduce((min, t) => (t.minPercent < min.minPercent ? t : min), tiers[0]);
        tiers.push({ minPercent: 0, multiplier: lowest ? lowest.multiplier : 0.5 });
    }
    return tiers;
}

if (addSpeedThresholdBtn) {
    addSpeedThresholdBtn.addEventListener('click', () => {
        if (speedThresholdsList) speedThresholdsList.appendChild(createSpeedThresholdRow(0.5, 0.8));
    });
}

function updateConfigLockState(locked) {
    document.querySelectorAll('#tab-config input, #tab-config button').forEach(input => {
        input.disabled = locked;
    });
    if (saveConfigBtn) saveConfigBtn.disabled = locked;
    if (configLockNotice) configLockNotice.classList.toggle('hidden', !locked);
    if (!locked && configSaveStatus) configSaveStatus.textContent = '';
}

async function isGameCurrentlyActive() {
    try {
        const res = await fetch(`${FIREBASE_URL}/gameSettings.json?auth=${FIREBASE_SECRET}`);
        const settings = await res.json();
        if (!settings || !settings.isActive) return false;
        return Date.now() < settings.endTime;
    } catch (error) {
        return true;
    }
}

if (saveConfigBtn) {
    saveConfigBtn.addEventListener('click', async () => {
        saveConfigBtn.disabled = true;
        saveConfigBtn.textContent = "MEMERIKSA STATUS...";

        const active = await isGameCurrentlyActive();
        if (active) {
            isGameActive = true;
            updateConfigLockState(true);
            if (configSaveStatus) {
                configSaveStatus.style.color = "var(--red-crimson)";
                configSaveStatus.textContent = "⚠️ Game sedang berjalan — hentikan dulu untuk mengubah aturan.";
            }
            saveConfigBtn.textContent = "💾 SIMPAN ATURAN";
            return;
        }

        const newConfig = {
    rarityPoints: {
        common: Number(getEl('cfg-points-common').value) || 10,
        rare: Number(getEl('cfg-points-rare').value) || 25,
        epic: Number(getEl('cfg-points-epic').value) || 50,
        legendary: Number(getEl('cfg-points-legendary').value) || 100,
        mythic: Number(getEl('cfg-points-mythic').value) || 250
    },
    timeLimits: {
        common: (Number(getEl('cfg-time-common').value) || 30) * 1000,
        rare: (Number(getEl('cfg-time-rare').value) || 20) * 1000,
        epic: (Number(getEl('cfg-time-epic').value) || 15) * 1000,
        legendary: (Number(getEl('cfg-time-legendary').value) || 10) * 1000,
        mythic: (Number(getEl('cfg-time-mythic').value) || 5) * 1000
    },
    speedThresholds: readSpeedThresholdRows(),
    timeoutMultipliers: {
        0: Number(getEl('cfg-timeout-0').value),
        1: Number(getEl('cfg-timeout-1').value),
        2: Number(getEl('cfg-timeout-2').value)
    },
    bombPenalty: Number(getEl('cfg-bomb-penalty').value) || 30,

    // 🔁 NEW: preserve redemption setting
    redemptionEnabled: !!(getEl('cfg-redemption-enabled') && getEl('cfg-redemption-enabled').checked)
};

        saveConfigBtn.textContent = "MENYIMPAN...";
        try {
            await fetch(`${FIREBASE_URL}/config.json?auth=${FIREBASE_SECRET}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig)
            });
            GAME_CONFIG = newConfig;
            if (configSaveStatus) {
                configSaveStatus.style.color = "var(--green-emerald)";
                configSaveStatus.textContent = "✅ Aturan game berhasil tersimpan di Firebase!";
            }
        } catch (error) {
            if (configSaveStatus) {
                configSaveStatus.style.color = "var(--red-crimson)";
                configSaveStatus.textContent = "❌ Gagal menyimpan aturan.";
            }
        } finally {
            saveConfigBtn.disabled = false;
            saveConfigBtn.textContent = "💾 SIMPAN ATURAN";
        }
    });
}

// =============================================================================
// 7. ASSET STUDIO (Live Pixel Art Inspector & Testing)
// =============================================================================
function renderAssetStudio() {
    const studioContainer = document.getElementById('asset-studio-grid');
    if (!studioContainer) return;
    studioContainer.innerHTML = '';

    const assetEntries = [
        { label: 'Chest: Tertutup', key: 'chest_closed' },
        { label: 'Chest Glow: Frame 1', key: 'chest_glow_1' },
        { label: 'Chest Glow: Frame 2', key: 'chest_glow_2' },
        { label: 'Chest Glow: Frame 3', key: 'chest_glow_3' },
        { label: 'Chest Glow: Frame 4 (Peak)', key: 'chest_glow_4' },
        { label: 'Chest Glow: Frame 5', key: 'chest_glow_5' },
        { label: 'Chest Glow: Frame 6', key: 'chest_glow_6' },
        { label: 'Chest Open: Frame 1 (Unlatch)', key: 'chest_open_1' },
        { label: 'Chest Open: Frame 2 (Crack)', key: 'chest_open_2' },
        { label: 'Chest Open: Frame 3 (Lift 25°)', key: 'chest_open_3' },
        { label: 'Chest Open: Frame 4 (Lift 50°)', key: 'chest_open_4' },
        { label: 'Chest Open: Frame 5 (Lift 75°)', key: 'chest_open_5' },
        { label: 'Chest Open: Frame 6 (Radiant)', key: 'chest_open_6' },
        { label: 'Gulungan Tertutup', key: 'scroll_rolled' },
        { label: 'Parchment Soal', key: 'parchment_unrolled' },
        { label: 'Bomb Frame 1 (Lit)', key: 'bomb_1' },
        { label: 'Bomb Frame 2 (Sparks)', key: 'bomb_2' },
        { label: 'Bomb Frame 3 (Fuse Low)', key: 'bomb_3' },
        { label: 'Bomb Frame 4 (Red Shell)', key: 'bomb_4' },
        { label: 'Bomb Frame 5 (Cracking)', key: 'bomb_5' },
        { label: 'Bomb Frame 6 (Flash Core)', key: 'bomb_6' },
        { label: 'Bomb Frame 7 (Fire Petals)', key: 'bomb_7' },
        { label: 'Bomb Frame 8 (Inferno)', key: 'bomb_8' },
        { label: 'Bomb Frame 9 (Shockwave)', key: 'bomb_9' },
        { label: 'Bomb Frame 10 (Smoke)', key: 'bomb_10' },
        { label: 'Bomb Frame 11 (Fiery Cloud)', key: 'bomb_11' },
        { label: 'Bomb Frame 12 [FULLSCREEN BLAST]', key: 'bomb_12' }
    ];

    if (window.lootItemsById) {
        Object.entries(window.lootItemsById).forEach(([itemId, item]) => {
            assetEntries.push({
                label: `[${(item.rarity || 'item').toUpperCase()}] ${item.name}`,
                key: itemId,
                customPath: item.image || (window.ASSET_CONFIG && window.ASSET_CONFIG.items && window.ASSET_CONFIG.items[itemId]) || `assets/items/${itemId}.png`
            });
        });
    }

    assetEntries.forEach(entry => {
        const card = document.createElement('div');
        card.className = 'asset-studio-card';

        const img = document.createElement('img');
        img.alt = entry.label;
        if (window.bindPixelImage) {
            window.bindPixelImage(img, entry.key);
        }

        const title = document.createElement('span');
        title.textContent = entry.label;

        const pathInfo = document.createElement('span');
        pathInfo.style.cssText = 'font-size:7px; opacity:0.75; font-family:monospace; word-break:break-all;';
        pathInfo.textContent = entry.customPath || window.resolveAssetUrl(entry.key);

        card.appendChild(img);
        card.appendChild(title);
        card.appendChild(pathInfo);
        studioContainer.appendChild(card);
    });
}

// Interactive Asset Tests
const testChestBtn = document.getElementById('test-chest-btn');
if (testChestBtn) {
    testChestBtn.addEventListener('click', async () => {
        if (typeof startChestSequence !== 'function') return;

        // Set up test state so submitAnswer() doesn't bail
        currentQuestionId = 'TEST_CHEST';
        if (!currentUser) {
            currentUser = {
                password: 'test',
                name: 'Tester',
                class: 'Admin',
                answeredQuestions: new Set(),
                collectedItems: [],
                globalQuestionUses: {},
                questionTimeouts: {},
                answeredRarities: { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
                correctCount: 0,
                rawScore: 0
            };
        }
        isGameActive = true;

        startChestSequence({
            text: "Ini adalah tes pertanyaan dari Asset Studio! Manakah jawaban yang benar?",
            options: ["Pilihan Satu", "Pilihan Dua (Benar)", "Pilihan Tiga", "Pilihan Empat"],
            correct_answer: "B",
            rarity: "legendary"
        }, "legendary");
    });
}

const testBombBtn = document.getElementById('test-bomb-btn');
if (testBombBtn) {
    testBombBtn.addEventListener('click', async () => {
        if (typeof playBombSequence === 'function') {
            currentQuestionId = 'TEST_BOMB';
            currentUser = currentUser || { password: 'test', name: 'Tester', class: 'Admin', answeredQuestions: new Set(), globalQuestionUses: {} };
            await playBombSequence();
        }
    });
}
window.loadTeacherDashboard = loadTeacherDashboard;