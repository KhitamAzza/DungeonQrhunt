// =============================================================================
// 1. STUDENT STATE & DOM ELEMENTS
// =============================================================================
window.html5QrcodeScanner = null;
window.currentQuestionId = null;
window.studentTimerInterval = null;
window.questionTimerInterval = null;

const studentTimer = document.getElementById('student-timer');
const scannerArea = document.getElementById('scanner-area');
const questionModal = document.getElementById('question-modal');
const qText = document.getElementById('q-text');
const qOptions = document.getElementById('q-options');
const feedbackArea = document.getElementById('feedback-area');
const feedbackText = document.getElementById('feedback-text');
const manualInput = document.getElementById('manual-qr-input');
const manualSubmitBtn = document.getElementById('manual-submit-btn');
const progressTracker = document.getElementById('progress-tracker');
const announcementHistoryToggle = document.getElementById('announcement-history-toggle');
const announcementHistoryDropdown = document.getElementById('announcement-history-dropdown');

if (announcementHistoryToggle && announcementHistoryDropdown) {
    announcementHistoryToggle.addEventListener('click', () => {
        announcementHistoryDropdown.classList.toggle('hidden');
    });
}

// Inventory / Loot UI Elements
const openInventoryBtn = document.getElementById('open-inventory-btn');
const inventoryModal = document.getElementById('inventory-modal');
const closeInventoryBtn = document.getElementById('close-inventory-btn');
const inventoryBackScannerBtn = document.getElementById('inventory-back-scanner');
const inventoryTotalValueEl = document.getElementById('inventory-total-value');
const itemDetailModal = document.getElementById('item-detail-modal');
const closeDetailBtn = document.getElementById('close-detail-btn');

// Retro Overlay Elements
const chestOverlay = document.getElementById('chest-overlay');
const chestSprite = document.getElementById('chest-sprite');
const chestInstruction = document.getElementById('chest-instruction');
const screenFlash = document.getElementById('screen-flash');
const scrollOverlay = document.getElementById('scroll-overlay');
const parchmentOverlay = document.getElementById('parchment-overlay');

function getSpeedMultiplier(timeRemaining, timeLimit) {
    let speedPercent = timeLimit > 0 ? (timeRemaining / timeLimit) : 0;
    speedPercent = Math.max(0, Math.min(1, speedPercent));

    const sorted = [...GAME_CONFIG.speedThresholds].sort((a, b) => b.minPercent - a.minPercent);
    const tier = sorted.find(t => speedPercent >= t.minPercent) || sorted[sorted.length - 1];
    return tier.multiplier;
}

function getTimeoutMultiplier(timeouts) {
    if (timeouts >= 3) return 0;
    return GAME_CONFIG.timeoutMultipliers[timeouts] ?? 1.0;
}

const CHEST_SUSPENSE_PHRASES = [
    "Berani buka kotak misteri ini?",
    "Tunggu sebentar... apakah ini jebakan bomb?",
    "Jangan dibuka ini berisi jebakan!",
    "Siapa yang berani, dia yang menang!",
    "Coba tebak, apa isi di dalamnya?",
    "Ngomon-ngomon kamu sudah nyawit belum?",
    "jika tidak tau, bertanyalah, tapi kebanyakan nanya malu-maluin",
    "Hati-hati, aura kotak ini sangat mistis!",
    "Ayo berdoa, semoga keberuntungan memihakmu!",
    "Mungkin kotak ini berisi ijazah beliau!"
];

// =============================================================================
// 2. GAME TIMER & STATUS
// =============================================================================
async function checkGameStatusAndUpdateTimer() {
    try {
        const response = await fetch(`${FIREBASE_URL}/gameSettings.json?auth=${FIREBASE_SECRET}`);
        const settings = await response.json();
        if (settings && settings.isActive && settings.endTime) {
            const now = Date.now();
            const remaining = settings.endTime - now;
            if (remaining <= 0) {
                isGameActive = false;
                if (studentTimer) studentTimer.textContent = "00:00";
            } else {
                isGameActive = true;
                const mins = Math.floor(remaining / 60000);
                const secs = Math.floor((remaining % 60000) / 1000);
                if (studentTimer) {
                    studentTimer.textContent = `⏳ ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                }
            }
        } else {
            isGameActive = false;
            if (studentTimer) studentTimer.textContent = "⏳ SELESAI";
        }
    } catch (error) {
        console.warn("Timer status error:", error);
        isGameActive = false;
    }
}

function startStudentTimer() {
    if (studentTimerInterval) clearInterval(studentTimerInterval);
    checkGameStatusAndUpdateTimer();
    studentTimerInterval = setInterval(async () => {
        await checkGameStatusAndUpdateTimer();
        if (!isGameActive) {
            clearInterval(studentTimerInterval);
            showGameOver();
        }
    }, 1000);
}

// =============================================================================
// 3. QR SCANNER & MANUAL ENTRY
// =============================================================================
async function startScanner() {
    if (html5QrcodeScanner) return;
    try {
        html5QrcodeScanner = new Html5Qrcode("reader");
        const config = { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 };
        try {
            await html5QrcodeScanner.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure);
        } catch (err) {
            try {
                await html5QrcodeScanner.start({ facingMode: "user" }, config, onScanSuccess, onScanFailure);
            } catch (err2) {
                const readerEl = document.getElementById('reader');
                if (readerEl) {
                    readerEl.innerHTML = "<p style='padding:20px; color:#fcd053; font-size:12px;'>Kamera tidak diizinkan. Gunakan tombol 'KODE SAKTI'.</p>";
                }
            }
        }
    } catch (e) {
        console.warn("Scanner initialization skipped", e);
    }
}

function onScanSuccess(decodedText) {
    let questionId = decodedText;
    if (decodedText.includes('?q=')) questionId = decodedText.split('?q=')[1].split('&')[0];
    else if (decodedText.includes('&q=')) questionId = decodedText.split('&q=')[1].split('&')[0];
    loadQuestion(questionId);
}

function onScanFailure() {
    // Silent ignore during normal frame searching
}

if (manualSubmitBtn && manualInput) {
    manualSubmitBtn.addEventListener('click', () => {
        const qId = manualInput.value.trim();
        if (qId) {
            loadQuestion(qId);
            manualInput.value = '';
        }
    });
}

// =============================================================================
// 4. QUESTION LOADING (ALL GO THROUGH RETRO CHEST FLOW)
// =============================================================================
async function loadQuestion(questionId) {
    if (!isGameActive) {
        showGameOver();
        return;
    }

    // Prevent duplicate answers
    if (currentUser && currentUser.answeredQuestions.has(questionId)) {
        if (html5QrcodeScanner) html5QrcodeScanner.pause(true);
        scannerArea.classList.add('hidden');
        if (feedbackArea) feedbackArea.classList.add('hidden');
        questionModal.classList.remove('hidden');
        qText.textContent = `⚠️ Kamu sudah pernah membuka peti "${questionId}"!`;
        qText.style.color = "var(--red-crimson)";
        qOptions.innerHTML = `<button class="option-btn" style="background-color:var(--gold-mid); color:#000;" onclick="resetToScanner()">KEMBALI KE SCANNER</button>`;
        return;
    }

    currentQuestionId = questionId;
    if (html5QrcodeScanner) html5QrcodeScanner.pause(true);
    scannerArea.classList.add('hidden');
    if (feedbackArea) feedbackArea.classList.add('hidden');

    try {
        const response = await fetch(`${FIREBASE_URL}/questions/${questionId}.json?auth=${FIREBASE_SECRET}`);
        const qData = await response.json();
        if (!qData || !qData.text) throw new Error("Peti tidak ditemukan!");

        const rarity = qData.rarity ? qData.rarity.toLowerCase().trim() : 'common';
        const maxUses = qData.max_uses || 99;
        const currentUses = (currentUser.globalQuestionUses && currentUser.globalQuestionUses[questionId]) || 0;

        if (currentUses >= maxUses) {
            const lockedOverlay = document.getElementById('locked-overlay');
            if (lockedOverlay) lockedOverlay.classList.remove('hidden');
            return;
        }

        startChestSequence(qData, rarity);
    } catch (error) {
        console.error("Error loading question:", error);
        questionModal.classList.remove('hidden');
        qText.innerHTML = `❌ Error: Peti "${questionId}" tidak ditemukan di peta harta!`;
        qText.style.color = "var(--red-crimson)";
        qOptions.innerHTML = `<button class="option-btn" style="background-color:var(--red-crimson); color:#fff;" onclick="resetToScanner()">KEMBALI</button>`;
    }
}

// =============================================================================
// 5. CHEST -> FLASH -> PARCHMENT SEQUENCE & RARITY FLASH
// =============================================================================
async function playRarityFlash(rarity) {
    const flashEl = document.getElementById('screen-rarity-flash');
    if (!flashEl) return;
    const rarityFlashColors = {
        common: '#ffffff',
        uncommon: '#ffffff',
        rare: '#2ecc71',
        epic: '#a855f7',
        legendary: '#f1c40f',
        legend: '#f1c40f',
        mythic: '#ef4444'
    };
    const key = (rarity || 'common').toLowerCase().trim();
    const color = rarityFlashColors[key] || '#ffffff';
    flashEl.style.backgroundColor = color;
    flashEl.classList.remove('hidden');
    flashEl.classList.add('flash-active');
    await sleep(350);
    flashEl.classList.remove('flash-active');
    flashEl.classList.add('hidden');
}

async function startChestSequence(qData, rarity) {
    rarity = (rarity || (qData && qData.rarity) || 'common').toLowerCase().trim();
    const isBomb = (qData && qData.chest_type === 'bomb');

    chestOverlay.classList.remove('hidden');
    scrollOverlay.classList.add('hidden');
    parchmentOverlay.classList.add('hidden');

    chestSprite.className = 'chest-sprite';
    chestInstruction.classList.add('hidden');

    let glowLoopHandle = null;

    if (isBomb) {
        // Bomb trap: NO GLOW on idle chest
        if (window.bindPixelImage) {
            window.bindPixelImage(chestSprite, 'chest_closed');
        }
    } else {
        // Normal treasure chest: seamless 6-frame looping glow chest animation
        const glowFrames = (window.ASSET_CONFIG && window.ASSET_CONFIG.chest_glow_frames) || [
            'assets/chest_glow_1.png', 'assets/chest_glow_2.png', 'assets/chest_glow_3.png',
            'assets/chest_glow_4.png', 'assets/chest_glow_5.png', 'assets/chest_glow_6.png'
        ];
        const glowFrameMs = (window.ASSET_CONFIG && window.ASSET_CONFIG.chest_glow_frame_ms) || 150;
        
        if (window.startLoopAnimation) {
            glowLoopHandle = window.startLoopAnimation(chestSprite, glowFrames, glowFrameMs);
        } else if (window.bindPixelImage) {
            window.bindPixelImage(chestSprite, 'chest_locked_glow');
        }
    }

    await sleep(200);

    chestInstruction.textContent = "TAP UNTUK MEMBUKA!";
    chestInstruction.classList.remove('hidden');

    if (window.RetroAudio) window.RetroAudio.playSuspense();

    const chestBackBtn = document.getElementById('chest-back-btn');
    if (chestBackBtn) chestBackBtn.classList.remove('hidden');

    const suspenseTextEl = document.getElementById('chest-suspense-text');
    if (suspenseTextEl) {
        const randomPhrase = CHEST_SUSPENSE_PHRASES[Math.floor(Math.random() * CHEST_SUSPENSE_PHRASES.length)];
        suspenseTextEl.textContent = randomPhrase;
        suspenseTextEl.classList.add('visible');
    }

    const tappedEl = await waitForAny([chestSprite, chestBackBtn]);

    // Clean up loop and suspense indicators
    if (glowLoopHandle && typeof glowLoopHandle.stop === 'function') {
        glowLoopHandle.stop();
    }
    if (suspenseTextEl) suspenseTextEl.classList.remove('visible');
    if (chestBackBtn) chestBackBtn.classList.add('hidden');

    if (tappedEl === chestBackBtn) {
        chestOverlay.classList.add('hidden');
        resetToScanner();
        return;
    }

    // Shake violently for tactile suspense
    chestInstruction.classList.add('hidden');
    chestSprite.classList.add('chest-shake-css');
    await sleep(400);
    chestSprite.classList.remove('chest-shake-css');

    // Trigger announcements for rare events
    if (isBomb) {
        await triggerAnnouncement(`☠ ${currentUser ? currentUser.name : 'Pemburu'} Membuka kotak BOMB!`);
    } else if (rarity === 'mythic') {
        await triggerAnnouncement(`★ ${currentUser ? currentUser.name : 'Pemburu'} Menemukan harta Mythic!`);
    }

    // Check for Bomb Trap: NO GLOW, chest opens, then bomb drops in from the top
    if (isBomb) {
        chestOverlay.classList.add('hidden');
        await playBombSequence();
        return;
    }

    // Play the 6-frame chest opening animation sequence
    const openFrames = (window.ASSET_CONFIG && window.ASSET_CONFIG.chest_open_frames) || [
        'assets/chest_open_1.png', 'assets/chest_open_2.png', 'assets/chest_open_3.png',
        'assets/chest_open_4.png', 'assets/chest_open_5.png', 'assets/chest_open_6.png'
    ];
    const openFrameMs = (window.ASSET_CONFIG && window.ASSET_CONFIG.chest_open_frame_ms) || 110;

    if (window.RetroAudio) window.RetroAudio.playChestOpen();
    if (window.playFrameAnimation) {
        await window.playFrameAnimation(chestSprite, openFrames, openFrameMs);
    } else if (window.bindPixelImage) {
        window.bindPixelImage(chestSprite, 'chest_open');
    }
    await sleep(250);

    // Check for Hint
    if (qData.chest_type === 'hint') {
        chestOverlay.classList.add('hidden');
        await playHintSequence(qData.text);
        return;
    }

    // Flash on screen based on rarity: uncommon/common white, rare green, epic purple, legend gold, mythic red
    await playRarityFlash(rarity);

    // Immediately show the parchment with question (no closed scroll delay)
    chestOverlay.classList.add('hidden');
    scrollOverlay.classList.add('hidden');
    parchmentOverlay.classList.remove('hidden');

    const instructionEl = document.getElementById('parchment-instruction');
    if (instructionEl) instructionEl.classList.add('hidden');

    const parchmentContentEl = document.getElementById('parchment-content');
    if (parchmentContentEl) parchmentContentEl.classList.add('hidden');

    // Setup Parchment Content
    const rpgRarityBadge = document.getElementById('parchment-rarity-badge');
    if (rpgRarityBadge) {
        rpgRarityBadge.textContent = rarity.toUpperCase();
        const rarityBadgeColors = {
            common: '#8b8070',
            uncommon: '#8b8070',
            rare: 'var(--green-emerald)',
            epic: 'var(--purple-relic)',
            legendary: 'var(--gold-mid)',
            legend: 'var(--gold-mid)',
            mythic: 'var(--red-crimson)'
        };
        rpgRarityBadge.style.backgroundColor = rarityBadgeColors[rarity] || '#8b8070';
    }

    const rpgQText = document.getElementById('parchment-q-text');
    if (rpgQText) {
        rpgQText.textContent = qData.text;
        rpgQText.classList.remove('time-up-text');
        rpgQText.style.color = "var(--ink-dark)";
    }

    renderParchmentOptions(qData);
    startParchmentTimer(rarity);

    await sleep(60);
    if (parchmentContentEl) {
        parchmentContentEl.classList.remove('hidden');
        parchmentContentEl.style.pointerEvents = 'none';
        setTimeout(() => { parchmentContentEl.style.pointerEvents = 'auto'; }, 200);
    }
}

function renderParchmentOptions(qData) {
    const rpgQOptions = document.getElementById('parchment-q-options');
    if (!rpgQOptions) return;
    rpgQOptions.innerHTML = '';
    const labels = ['A', 'B', 'C', 'D'];
    (qData.options || []).forEach((opt, index) => {
        if (opt !== undefined && opt !== null) {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = `${labels[index]}. ${opt}`;
            btn.onclick = () => submitAnswer(labels[index]);
            rpgQOptions.appendChild(btn);
        }
    });
}

function startParchmentTimer(rarity) {
    const timeLimit = GAME_CONFIG.timeLimits[rarity] || 30000;
    runTimer(timeLimit, '.parchment-timer-bar', '.parchment-timer-text', () => handleTimeUp('parchment'));
}

function runTimer(timeLimit, barSelector, textSelector, onTimeUpCallback) {
    clearInterval(questionTimerInterval);
    const startTime = Date.now();
    const timerBar = document.querySelector(barSelector);
    const timerText = document.querySelector(textSelector);

    let lastTickSecond = -1;

    questionTimerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = timeLimit - elapsed;
        if (remaining <= 0) {
            clearInterval(questionTimerInterval);
            onTimeUpCallback();
        } else {
            const percent = (remaining / timeLimit) * 100;
            const currentSecond = Math.ceil(remaining / 1000);

            if (timerBar) timerBar.style.width = percent + '%';
            if (timerText) timerText.textContent = currentSecond + 's';

            if (currentSecond <= 5 && currentSecond !== lastTickSecond) {
                lastTickSecond = currentSecond;
                if (window.RetroAudio) window.RetroAudio.playTick();
            }

            if (percent < 30) {
                if (timerBar) timerBar.style.backgroundColor = 'var(--red-crimson)';
            } else if (percent < 60) {
                if (timerBar) timerBar.style.backgroundColor = 'var(--gold-mid)';
            }
        }
    }, 100);
}

function handleTimeUp(source) {
    clearInterval(questionTimerInterval);
    if (currentQuestionId) {
        if (!currentUser.questionTimeouts[currentQuestionId]) {
            currentUser.questionTimeouts[currentQuestionId] = 0;
        }
        currentUser.questionTimeouts[currentQuestionId]++;
    }

    if (source === 'parchment') {
        const rpgQText = document.getElementById('parchment-q-text');
        const rpgQOptions = document.getElementById('parchment-q-options');

        if (rpgQText) {
            rpgQText.textContent = "WAKTU HABIS!";
            rpgQText.classList.add('time-up-text');
        }
        if (rpgQOptions) rpgQOptions.innerHTML = '';
        if (window.RetroAudio) window.RetroAudio.playWrong();

        setTimeout(() => {
            resetToScanner();
            if (rpgQText) rpgQText.classList.remove('time-up-text');
        }, 1800);
    }
}

async function submitAnswer(selectedOption) {
    clearInterval(questionTimerInterval);
    if (!currentUser || !currentQuestionId) return;
    if (!isGameActive) {
        showGameOver();
        return;
    }

    const rpgQText = document.getElementById('parchment-q-text');
    const rpgQOptions = document.getElementById('parchment-q-options');
    if (rpgQText) rpgQText.textContent = "Memeriksa jawaban...";
    if (rpgQOptions) rpgQOptions.innerHTML = '';

    let qData = null;
    try {
        const qRes = await fetch(`${FIREBASE_URL}/questions/${currentQuestionId}.json?auth=${FIREBASE_SECRET}`);
        qData = await qRes.json();
    } catch (e) {
        console.warn("Failed to fetch question details", e);
    }

    const isCorrect = qData && (selectedOption === qData.correct_answer);
    const rarity = qData && qData.rarity ? qData.rarity.toLowerCase().trim() : 'common';
    const basePoints = GAME_CONFIG.rarityPoints[rarity] || 10;

    const timerTextEl = document.querySelector('.parchment-timer-text');
    let timeRemaining = 0;
    if (timerTextEl) {
        const secsLeft = parseInt(timerTextEl.textContent.replace('s', ''));
        timeRemaining = (secsLeft || 0) * 1000;
    }
    const timeLimit = GAME_CONFIG.timeLimits[rarity] || 30000;
    const timeouts = currentUser.questionTimeouts[currentQuestionId] || 0;
    const speedMultiplier = getSpeedMultiplier(timeRemaining, timeLimit);
    const timeoutMultiplier = getTimeoutMultiplier(timeouts);
    const pointsEarned = isCorrect ? Math.round(basePoints * speedMultiplier * timeoutMultiplier) : 0;

    const submissionData = {
        student_password: currentUser.password,
        student_name: currentUser.name,
        student_class: currentUser.class,
        question_id: currentQuestionId,
        selected_answer: selectedOption,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        timestamp: Date.now()
    };

    try {
        await fetch(`${FIREBASE_URL}/submissions.json?auth=${FIREBASE_SECRET}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData)
        });

        // 🔁 REDEMPTION — with redemptionEnabled on (GAME_CONFIG.redemptionEnabled
        // in core.js), a wrong answer no longer locks the chest by itself. The
        // permanent lock (answeredQuestions.add) only happens here for a CORRECT
        // answer, or immediately if redemption is off. When it's on and the
        // answer is wrong, the lock is decided further down instead, once we
        // know whether this was the 1st/2nd/3rd attempt.
        const redemptionEnabled = GAME_CONFIG.redemptionEnabled !== false;
        if (isCorrect || !redemptionEnabled) {
            currentUser.answeredQuestions.add(currentQuestionId);
        }
        currentUser.globalQuestionUses[currentQuestionId] = (currentUser.globalQuestionUses[currentQuestionId] || 0) + 1;

        if (isCorrect) {
            currentUser.correctCount++;
            currentUser.rawScore += pointsEarned;
            if (currentUser.answeredRarities[rarity] !== undefined) {
                currentUser.answeredRarities[rarity]++;
            }
        }

        updateProgressTracker();

        if (checkPersonalFinishCondition()) return;

        if (isCorrect) {
            if (rpgQText) {
                rpgQText.textContent = "BENAR! 🏆";
                rpgQText.style.color = "var(--green-emerald)";
            }
            if (window.RetroAudio) window.RetroAudio.playCorrect();

            await sleep(700);
            await processLootDrop(timeRemaining, timeLimit, rarity, pointsEarned);
        } else {
            // 🔁 REDEMPTION — wrong answer. Reuses the SAME counter (and by
            // extension the SAME GAME_CONFIG.timeoutMultipliers tiers, via
            // getTimeoutMultiplier) that a timeout uses, so a wrong answer and
            // a timeout on the same chest count toward the same 3-strike cap:
            // 1st miss = 0.7x reward next time, 2nd = 0.5x, 3rd = locked for
            // good (answeredQuestions.add below) with 0 reward from then on.
            if (redemptionEnabled) {
                if (!currentUser.questionTimeouts[currentQuestionId]) {
                    currentUser.questionTimeouts[currentQuestionId] = 0;
                }
                currentUser.questionTimeouts[currentQuestionId]++;
                if (currentUser.questionTimeouts[currentQuestionId] >= 3) {
                    currentUser.answeredQuestions.add(currentQuestionId); // attempts exhausted — lock for good
                }
            }

            if (rpgQText) {
                rpgQText.textContent = "SALAH! ❌";
                rpgQText.style.color = "var(--red-crimson)";
            }
            if (window.RetroAudio) window.RetroAudio.playWrong();

            document.body.classList.add('screen-shake');
            setTimeout(() => document.body.classList.remove('screen-shake'), 450);

            setTimeout(() => {
                resetToScanner();
                if (rpgQText) rpgQText.style.color = "var(--ink-dark)";
            }, 1400);
        }
    } catch (error) {
        console.error("Submission error:", error);
        if (rpgQText) rpgQText.textContent = "Gagal menyimpan. Tap untuk mencoba lagi.";
        if (rpgQOptions) {
            rpgQOptions.innerHTML = `<button class="option-btn" onclick="loadQuestion('${currentQuestionId}')">COBA LAGI</button>`;
        }
    }
}

function resetToScanner() {
    if (feedbackArea) feedbackArea.classList.add('hidden');
    if (questionModal) questionModal.classList.add('hidden');
    parchmentOverlay.classList.add('hidden');
    chestOverlay.classList.add('hidden');
    scrollOverlay.classList.add('hidden');
    scannerArea.classList.remove('hidden');
    currentQuestionId = null;
    if (qText) qText.style.color = "var(--text-light)";
    clearInterval(questionTimerInterval);
    if (html5QrcodeScanner) html5QrcodeScanner.resume();
}

// =============================================================================
// 6. PROGRESS TRACKER & FINISH CHECK
// =============================================================================
function updateProgressTracker() {
    if (!currentUser || !progressTracker || !currentUser.questionMaxUses) return;

    // Counts ONLY chests THIS student personally opened. A chest someone else
    // used up doesn't count as "found" here — see checkPersonalFinishCondition
    // below for why.
    let resolvedChests = 0;
    for (const qId of Object.keys(currentUser.questionMaxUses)) {
        if (currentUser.answeredQuestions.has(qId)) resolvedChests++;
    }

    const total = currentUser.totalQuestions;
    const percent = total > 0 ? (resolvedChests / total) * 100 : 0;
    const isComplete = resolvedChests >= total && total > 0;

    progressTracker.innerHTML = `
        <div class="progress-header">
            <span>HARTA DITEMUKAN</span>
            <span>${resolvedChests} / ${total} PETI</span>
        </div>
        <div class="progress-bar-container ${isComplete ? 'progress-complete' : ''}">
            <div class="progress-bar-fill" style="width: ${percent}%"></div>
        </div>
    `;
}

function checkPersonalFinishCondition() {
    if (!currentUser || !currentUser.questionMaxUses) return false;

    // 🐛 FIX: this used to also count a chest as "resolved" the moment its
    // max_uses cap was hit by ANY student (claimedGlobally), not just this one.
    // That meant the instant one student found every chest, every OTHER
    // student's count also jumped to total on their next check — silently
    // finishing the game for them even though they'd personally opened
    // nothing. A chest someone else claimed is still handled — the student
    // just sees the "locked" overlay if they scan that specific one — but it
    // no longer counts toward THIS student finishing the whole game. They now
    // keep playing normally until they've personally opened every chest they
    // still can, or the game timer runs out.
    let resolvedChests = 0;
    for (const qId of Object.keys(currentUser.questionMaxUses)) {
        if (currentUser.answeredQuestions.has(qId)) resolvedChests++;
    }

    if (resolvedChests >= currentUser.totalQuestions && currentUser.totalQuestions > 0) {
        showFinishScreen();
        return true;
    }
    return false;
}

// =============================================================================
// 7. BOMB SEQUENCE & HINT
// =============================================================================
async function playBombSequence() {
    const bombOverlay = document.getElementById('bomb-overlay');
    const bombSprite = document.getElementById('bomb-sprite');
    const bombFlash = document.getElementById('bomb-flash');
    const bombMessage = document.getElementById('bomb-message');
    const bombPenaltyText = document.getElementById('bomb-penalty-text');
if (bombPenaltyText) {
    bombPenaltyText.textContent = `-${GAME_CONFIG.bombPenalty} POIN DIPOTONG`;
}

    bombOverlay.classList.remove('hidden');
    bombSprite.classList.remove('hidden', 'bomb-sprite-fullscreen');
    if (bombMessage) bombMessage.classList.add('hidden');

    // 1. Initial frame: Bomb drops in dynamically from top of screen
    if (window.bindPixelImage) {
        window.bindPixelImage(bombSprite, 'bomb_1');
    }
    bombSprite.classList.add('bomb-drop-in');
    await sleep(450);
    bombSprite.classList.remove('bomb-drop-in');

    // Impact rumble when landing
    document.body.classList.add('screen-shake');
    setTimeout(() => document.body.classList.remove('screen-shake'), 300);

    // Grab the frame list first — we need frame 0 for the drop-in sprite,
// since hardcoding the key 'bomb_1' makes resolveAssetUrl() guess the
// path as 'assets/bomb_1.png', which breaks whenever the frames live
// in a subfolder like assets/bomb/.
const bombFrames = (window.ASSET_CONFIG && window.ASSET_CONFIG.bomb_frames) || [
    'assets/bomb_1.png', 'assets/bomb_2.png', 'assets/bomb_3.png', 'assets/bomb_4.png',
    'assets/bomb_5.png', 'assets/bomb_6.png', 'assets/bomb_7.png', 'assets/bomb_8.png',
    'assets/bomb_9.png', 'assets/bomb_10.png', 'assets/bomb_11.png', 'assets/bomb_12.png'
];

// 1. Initial frame: Bomb drops in dynamically from top of screen
if (bombFrames.length > 0 && window.bindPixelImage) {
    window.bindPixelImage(bombSprite, bombFrames[0]);
}
bombSprite.classList.add('bomb-drop-in');
await sleep(450);
bombSprite.classList.remove('bomb-drop-in');

// Impact rumble when landing
document.body.classList.add('screen-shake');
setTimeout(() => document.body.classList.remove('screen-shake'), 300);
    const bombFrameMs = (window.ASSET_CONFIG && window.ASSET_CONFIG.bomb_frame_ms) || 80; // 👈 CHANGE ANIMATION SPEED here (or in assets-config.js) — lower ms = faster
    const fullscreenLastFrame = (window.ASSET_CONFIG && window.ASSET_CONFIG.bomb_fullscreen_last_frame === true); // default OFF now — set bomb_fullscreen_last_frame: true in assets-config.js to bring it back
    const lastFrameLingerMs = (window.ASSET_CONFIG && window.ASSET_CONFIG.bomb_last_frame_ms) || 700;

    // 👇 CHANGE WHICH FRAME THE SHAKE STARTS ON — edit bomb_shake_start_frame
    // in assets-config.js (recommended, keeps all bomb tuning in one place),
    // or hardcode a number here instead. 0-indexed: frame 7 = the 8th frame.
    const shakeStartFrame = (window.ASSET_CONFIG && typeof window.ASSET_CONFIG.bomb_shake_start_frame === 'number')
        ? window.ASSET_CONFIG.bomb_shake_start_frame
        : Math.max(0, bombFrames.length - 4);

    // 🔊 SOUND TIMING/FILES — edit bomb_fuse_sound / bomb_explosion_sound
    // (your own audio file paths) and bomb_fuse_sound_frame /
    // bomb_explosion_sound_frame (which 0-indexed frame triggers each) in
    // assets-config.js. Leave a _sound path as null to keep the built-in
    // lightweight synthesized sound for that one.
    const fuseSoundFrame = (window.ASSET_CONFIG && typeof window.ASSET_CONFIG.bomb_fuse_sound_frame === 'number')
        ? window.ASSET_CONFIG.bomb_fuse_sound_frame
        : 0;
    const explosionSoundFrame = (window.ASSET_CONFIG && typeof window.ASSET_CONFIG.bomb_explosion_sound_frame === 'number')
        ? window.ASSET_CONFIG.bomb_explosion_sound_frame
        : (Math.floor(bombFrames.length * 0.45) || 5);
    const fuseSoundFile = window.ASSET_CONFIG && window.ASSET_CONFIG.bomb_fuse_sound;
    const explosionSoundFile = window.ASSET_CONFIG && window.ASSET_CONFIG.bomb_explosion_sound;

    // 2. Play through explosion animation frames
    if (window.playFrameAnimation) {
        await window.playFrameAnimation(bombSprite, bombFrames, bombFrameMs, (frameIdx, total, isLast) => {
            // 🔥 FUSE SOUND — plays once, on fuseSoundFrame (default: frame 0,
            // right as the bomb lands and the frame sequence starts).
            if (window.RetroAudio && frameIdx === fuseSoundFrame) {
                if (!window.RetroAudio.playFile(fuseSoundFile)) window.RetroAudio.playFuse();
            }

            // 💥 EXPLOSION SOUND — plays once, on explosionSoundFrame (default:
            // frame 5 of 12). Flash itself moved below — see "🚩 RED FLASH".
            if (window.RetroAudio && frameIdx === explosionSoundFrame) {
                if (!window.RetroAudio.playFile(explosionSoundFile)) window.RetroAudio.playBomb();
            }

            // 🟢 SHAKE START — fires once, the moment frameIdx reaches shakeStartFrame.
            // Swaps the light landing "screen-shake" for the violent "screen-shake-heavy".
            // It keeps running until the "🔴 SHAKE STOP" block further down (after the
            // linger delay), independent of whether the fullscreen cover is on.
            if (frameIdx === shakeStartFrame) {
                document.body.classList.remove('screen-shake');
                document.body.classList.add('screen-shake-heavy');
            }

            // FINAL FRAME CLIMAX: optionally cover the entire viewport (off by default —
            // see bomb_fullscreen_last_frame in assets-config.js)
            if (isLast && fullscreenLastFrame) {
                bombSprite.classList.add('bomb-sprite-fullscreen');
            }
        });
    } else if (window.bindPixelImage) {
        window.bindPixelImage(bombSprite, 'bomb_1');
        await sleep(400);
        window.bindPixelImage(bombSprite, 'bomb_4');
    }

    // 🚩 RED FLASH — now fires once, right after the explosion frames finish playing
    // (moved out of the mid-animation frameIdx check above). To disable it entirely,
    // set bomb_flash_enabled: false in assets-config.js — nothing else to touch.
    // To go back to firing it DURING the animation instead of after, move this whole
    // block up into the playFrameAnimation callback where the sound trigger is.
    const flashEnabled = !(window.ASSET_CONFIG && window.ASSET_CONFIG.bomb_flash_enabled === false);
    if (flashEnabled && bombFlash) {
        bombFlash.classList.remove('hidden');
        bombFlash.classList.add('flash-active');
    }

    // Linger on the blast before showing the penalty message
    await sleep(lastFrameLingerMs);

    // 🔴 SHAKE STOP — heavy rumble (and the fullscreen cover, if it was on) ends here.
    // Move this block earlier (e.g. right after the playFrameAnimation call, before the
    // sleep above) if you want the shake to cut off as soon as the animation finishes,
    // instead of continuing through the linger.
    document.body.classList.remove('screen-shake', 'screen-shake-heavy');
    bombSprite.classList.remove('bomb-sprite-fullscreen');
    bombSprite.classList.add('hidden');

    // 3. At the end show the message!
    if (bombMessage) bombMessage.classList.remove('hidden');

    if (currentUser) {
        await submitBombPenalty();
        currentUser.answeredQuestions.add(currentQuestionId);
        currentUser.globalQuestionUses[currentQuestionId] = (currentUser.globalQuestionUses[currentQuestionId] || 0) + 1;
        updateProgressTracker();
        checkPersonalFinishCondition();
    }

    await sleep(2400);

    bombOverlay.classList.add('hidden');
    bombSprite.classList.remove('hidden', 'bomb-sprite-fullscreen');
    if (bombMessage) bombMessage.classList.add('hidden');
    if (bombFlash) bombFlash.classList.remove('flash-active');
    resetToScanner();
}
window.playBombSequence = playBombSequence;
window.startChestSequence = startChestSequence;

async function submitBombPenalty() {
    const submissionData = {
        student_password: currentUser.password,
        student_name: currentUser.name,
        student_class: currentUser.class,
        question_id: currentQuestionId,
        selected_answer: 'BOMB',
        is_bomb: true,
        points_earned: -GAME_CONFIG.bombPenalty,
        timestamp: Date.now()
    };

    try {
        await fetch(`${FIREBASE_URL}/submissions.json?auth=${FIREBASE_SECRET}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData)
        });
    } catch (error) {
        console.warn("Bomb penalty sync error:", error);
    }
}

async function playHintSequence(hintText) {
    const hintOverlay = document.getElementById('hint-overlay');
    const hintTextEl = document.getElementById('hint-text');
    const hintBackBtn = document.getElementById('hint-back-btn');
    const hintLogoutBtn = document.getElementById('hint-logout-btn');

    hintOverlay.classList.remove('hidden');
    if (hintTextEl) hintTextEl.textContent = hintText;

    const tappedEl = await waitForAny([hintBackBtn, hintLogoutBtn]);
    hintOverlay.classList.add('hidden');

    if (tappedEl === hintLogoutBtn) {
        handleLogout();
    } else {
        resetToScanner();
    }
}

function waitForTap(element) {
    return new Promise((resolve) => {
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            element.removeEventListener('click', handler);
            element.removeEventListener('touchstart', handler);
            resolve();
        };
        element.addEventListener('click', handler);
        element.addEventListener('touchstart', handler, { passive: false });
    });
}

function waitForAny(elements) {
    return new Promise((resolve) => {
        const entries = elements.filter(Boolean).map((el) => ({ el, handler: null }));
        const cleanup = () => {
            entries.forEach(({ el, handler }) => {
                el.removeEventListener('click', handler);
                el.removeEventListener('touchstart', handler);
            });
        };
        entries.forEach((entry) => {
            entry.handler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                cleanup();
                resolve(entry.el);
            };
            entry.el.addEventListener('click', entry.handler);
            entry.el.addEventListener('touchstart', entry.handler, { passive: false });
        });
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const lockedBackBtn = document.getElementById('locked-back-btn');
if (lockedBackBtn) {
    lockedBackBtn.addEventListener('click', () => {
        document.getElementById('locked-overlay').classList.add('hidden');
        resetToScanner();
    });
}

// =============================================================================
// 8. FINISH SCREEN & ANNOUNCEMENTS
// =============================================================================
function showFinishScreen() {
    const finishOverlay = document.getElementById('finish-overlay');
    const finishScore = document.getElementById('finish-score');
    const finishAccuracy = document.getElementById('finish-accuracy');
    const finishQuestions = document.getElementById('finish-questions');
    const finishRank = document.getElementById('finish-rank');
    const finishLogoutBtn = document.getElementById('finish-logout-btn');

    const accuracy = currentUser.totalQuestions > 0
        ? Math.round((currentUser.correctCount / currentUser.totalQuestions) * 100)
        : 0;

    const maxScore = currentUser.maxPossibleScore || 1;
    const percentage = (currentUser.rawScore / maxScore) * 100;

    let rankText = "Parah";
    let rankColor = "var(--red-crimson)";

    if (percentage >= 90) {
        rankText = "🏆 S-Rank";
        rankColor = "var(--gold-bright)";
    } else if (percentage >= 80) {
        rankText = "A-Rank";
        rankColor = "var(--green-emerald)";
    } else if (percentage >= 70) {
        rankText = "B-Rank";
        rankColor = "var(--cyan-mana)";
    } else if (percentage >= 60) {
        rankText = "C-Rank";
        rankColor = "var(--gold-mid)";
    }

    if (finishScore) finishScore.textContent = currentUser.rawScore;
    if (finishAccuracy) finishAccuracy.textContent = accuracy + '%';
    if (finishQuestions) finishQuestions.textContent = `${currentUser.answeredQuestions.size} / ${currentUser.totalQuestions}`;

    if (finishRank) {
        finishRank.textContent = rankText;
        finishRank.style.color = rankColor;
    }

    if (finishOverlay) finishOverlay.classList.remove('hidden');
    if (finishLogoutBtn) finishLogoutBtn.onclick = handleLogout;
}

async function triggerAnnouncement(message) {
    try {
        await fetch(`${FIREBASE_URL}/announcements.json?auth=${FIREBASE_SECRET}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: message, timestamp: Date.now() })
        });
    } catch (error) {
        console.warn("Announcement push error:", error);
    }
}

let announcementInterval = null;
function startAnnouncementPolling() {
    if (announcementInterval) clearInterval(announcementInterval);
    fetchLatestAnnouncement();
    announcementInterval = setInterval(fetchLatestAnnouncement, 10000);
}

async function fetchLatestAnnouncement() {
    try {
        const res = await fetch(`${FIREBASE_URL}/announcements.json?auth=${FIREBASE_SECRET}`);
        const data = await res.json();
        const ticker = document.getElementById('announcement-ticker');
        const tickerText = document.getElementById('announcement-text');

        if (!data) {
            if (ticker) ticker.classList.add('hidden');
            return;
        }

        const entries = (data.text !== undefined) ? [data] : Object.values(data);
        if (entries.length === 0) {
            if (ticker) ticker.classList.add('hidden');
            return;
        }

        entries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        if (tickerText) tickerText.textContent = entries[0].text;
        if (ticker) ticker.classList.remove('hidden');

        if (announcementHistoryDropdown) {
            announcementHistoryDropdown.innerHTML = entries.slice(0, 20).map(e => {
                const time = e.timestamp
                    ? new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';
                return `<div class="announcement-history-item"><span class="announcement-history-time">${time}</span><span>${e.text}</span></div>`;
            }).join('');
        }
    } catch (error) {}
}

// // =============================================================================
// 9. SECRET CODE MODAL — ANCIENT STONE TABLET
// =============================================================================
const TABLET_CODE_LENGTH = 4;   // change if question IDs need a different length

const secretCodeBtn    = document.getElementById('secret-code-btn');
const secretCodeModal  = document.getElementById('secret-code-modal');
const secretCodeCancel = document.getElementById('secret-code-cancel');
const stoneTablet      = document.getElementById('stone-tablet');
const tabletMessage    = document.getElementById('tablet-message');
const glyphButtons     = document.querySelectorAll('.glyph-btn');
const codeSlots        = document.querySelectorAll('.code-slot');

let tabletCode = [];   // digits pressed so far
let tabletLocked = false;   // true while submitting/error-shaking

function resetTablet() {
    tabletCode = [];
    tabletLocked = false;
    if (stoneTablet) stoneTablet.classList.remove('error', 'shake','success');
    if (tabletMessage) tabletMessage.textContent = '';
    glyphButtons.forEach(b => b.classList.remove('pressed'));
    codeSlots.forEach(s => { s.classList.remove('filled'); s.innerHTML = ''; });
}

function openTablet() {
    resetTablet();
    if (secretCodeModal) secretCodeModal.classList.remove('hidden');
}

function closeTablet() {
    if (secretCodeModal) secretCodeModal.classList.add('hidden');
    resetTablet();
}

function pressGlyph(btn) {
    if (tabletLocked) return;
    if (tabletCode.length >= TABLET_CODE_LENGTH) return;

    const digit = btn.getAttribute('data-digit');
        // Play that digit's choir note (polyphonic — won't stop previous notes)
    const choirPath = window.ASSET_CONFIG && window.ASSET_CONFIG.choir_sounds
        && window.ASSET_CONFIG.choir_sounds[digit];
    if (choirPath && window.RetroAudio && window.RetroAudio.playChoirNote) {
        const vol = window.ASSET_CONFIG.choir_volume || 0.5;
        window.RetroAudio.playChoirNote(choirPath, vol);
    }
    tabletCode.push(digit);
    btn.classList.add('pressed');

    // Fill next slot with a clone of the button's icon
    const slotIndex = tabletCode.length - 1;
    const slot = codeSlots[slotIndex];
    if (slot) {
        slot.innerHTML = '';
        const icon = btn.querySelector('svg');
        if (icon) slot.appendChild(icon.cloneNode(true));
        slot.classList.add('filled');
    }

    if (tabletCode.length === TABLET_CODE_LENGTH) {
        tabletLocked = true;
        // Small delay so the last button's glow is visible before submitting
        setTimeout(() => submitTabletCode(tabletCode.join('')), 350);
    }
}

async function submitTabletCode(code) {
    try {
        const res = await fetch(`${FIREBASE_URL}/questions/${code}.json?auth=${FIREBASE_SECRET}`);
        const qData = await res.json();

        if (!qData || !qData.text) {
            showTabletError();
            return;
        }

        // ---- Correct! Play the success sequence ----
        if (window.RetroAudio && window.ASSET_CONFIG) {
            const path = window.ASSET_CONFIG.tablet_success_sound;
            const vol = window.ASSET_CONFIG.tablet_success_volume || 0.7;
            if (path && window.RetroAudio.playChoirNote) {
                // Reuse the polyphonic player so it can overlap with any
                // lingering choir notes from the last press
                window.RetroAudio.playChoirNote(path, vol);
            }
        }

        // Shine every button + slots gold
        if (stoneTablet) stoneTablet.classList.add('success');
        if (tabletMessage) tabletMessage.textContent = 'KODE BENAR!';

        // Hold the glow for a beat, then hand off to the chest
        setTimeout(() => {
            closeTablet();
            loadQuestion(code);
        }, 900);

    } catch (e) {
        showTabletError();
    }
}

function showTabletError() {
    if (!stoneTablet) return;
    stoneTablet.classList.add('error', 'shake');
    if (tabletMessage) tabletMessage.textContent = 'KODE SALAH!';
    if (window.RetroAudio) window.RetroAudio.playWrong();

    setTimeout(() => {
        stoneTablet.classList.remove('shake');
        // After the shake, keep the red glow briefly, then reset
        setTimeout(() => resetTablet(), 500);
    }, 500);
}

// Wire up buttons
if (secretCodeBtn)    secretCodeBtn.addEventListener('click', openTablet);
if (secretCodeCancel) secretCodeCancel.addEventListener('click', closeTablet);
glyphButtons.forEach(btn => {
    btn.addEventListener('click', () => pressGlyph(btn));
});

// =============================================================================
// 10. LOOT DROP & INVENTORY SYSTEM
// =============================================================================
async function processLootDrop(timeRemaining, timeLimit, questionRarity, pointsEarned) {
    if (!pointsEarned || pointsEarned <= 0) {
        resetToScanner();
        return null;
    }

    const timeouts = currentUser.questionTimeouts[currentQuestionId] || 0;
    if (timeouts >= 3) {
        resetToScanner();
        return null;
    }

    let speedPercent = timeLimit > 0 ? (timeRemaining / timeLimit) : 0;
    speedPercent = Math.max(0, Math.min(1, speedPercent));

    const rarityDrops = (window.lootTable || {})[questionRarity];
    if (!rarityDrops || rarityDrops.length === 0) {
        resetToScanner();
        return null;
    }

    const sortedDrops = [...rarityDrops].sort((a, b) => b.minPercent - a.minPercent);

    if (timeouts === 2) speedPercent = 0;
    else if (timeouts === 1 && sortedDrops.length > 1) {
        speedPercent = Math.min(speedPercent, sortedDrops[1].minPercent);
    }

    const drop = sortedDrops.find(d => speedPercent >= d.minPercent) || sortedDrops[sortedDrops.length - 1];
    const itemId = drop.item_id;
    const itemData = drop;

    const lootIcon = document.getElementById('loot-icon');
    if (window.bindPixelImage) {
        window.bindPixelImage(lootIcon, itemId);
    }

    // Glow aura behind treasure matching rarity color
    const auraEl = document.getElementById('loot-glow-aura');
    const rarityKey = (questionRarity || 'common').toLowerCase();
    const rarityGlows = {
        common: { color: '#ffffff', rgba: 'rgba(255, 255, 255, 0.75)' },
        uncommon: { color: '#ffffff', rgba: 'rgba(255, 255, 255, 0.75)' },
        rare: { color: '#2ecc71', rgba: 'rgba(46, 204, 113, 0.85)' },
        epic: { color: '#a855f7', rgba: 'rgba(168, 85, 247, 0.85)' },
        legendary: { color: '#f1c40f', rgba: 'rgba(241, 196, 15, 0.9)' },
        legend: { color: '#f1c40f', rgba: 'rgba(241, 196, 15, 0.9)' },
        mythic: { color: '#ef4444', rgba: 'rgba(239, 68, 68, 0.95)' }
    };
    const glowInfo = rarityGlows[rarityKey] || rarityGlows.common;

    if (auraEl) {
        auraEl.style.backgroundColor = glowInfo.rgba;
        auraEl.style.boxShadow = `0 0 45px ${glowInfo.color}, inset 0 0 20px ${glowInfo.color}`;
    }
    if (lootIcon) {
        lootIcon.style.filter = `drop-shadow(0 6px 0 rgba(0,0,0,0.7)) drop-shadow(0 0 18px ${glowInfo.rgba})`;
    }

    document.getElementById('loot-title').textContent = itemData.name;
    document.getElementById('loot-desc').textContent = itemData.description;
    document.getElementById('loot-tier').textContent = `${questionRarity.toUpperCase()} DROP`;
    document.getElementById('loot-points').textContent = `+${pointsEarned} PTS`;

    const lootModal = document.getElementById('loot-reveal-modal');
    lootModal.classList.remove('hidden');

    if (window.RetroAudio) window.RetroAudio.playLoot();

    const keepBtn = document.getElementById('loot-keep-btn');
    keepBtn.onclick = async () => {
        const entry = { item_id: itemId, points: pointsEarned };
        currentUser.collectedItems.push(entry);
        lootModal.classList.add('hidden');

        try {
            await fetch(`${FIREBASE_URL}/inventory/${currentUser.password}.json?auth=${FIREBASE_SECRET}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            });
        } catch (e) {
            console.warn("Failed to persist loot item", e);
        }

        resetToScanner();
    };

    return itemId;
}

function renderInventoryGrid() {
    const grid = document.getElementById('inventory-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const items = currentUser.collectedItems || [];

    const totalValue = items.reduce((sum, entry) => sum + (entry.points || 0), 0);
    if (inventoryTotalValueEl) inventoryTotalValueEl.textContent = totalValue;

    if (items.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; color: var(--gold-mid); font-family: var(--font-pixel); font-size: 10px; text-align: center; padding: 20px;">BELUM ADA HARTA KARUN!</p>';
        return;
    }

    const itemCounts = {};
    const itemValues = {};
    items.forEach(entry => {
        itemCounts[entry.item_id] = (itemCounts[entry.item_id] || 0) + 1;
        itemValues[entry.item_id] = (itemValues[entry.item_id] || 0) + (entry.points || 0);
    });

    for (const [itemId, count] of Object.entries(itemCounts)) {
        const item = (window.lootItemsById || {})[itemId];
        if (!item) continue;

        const slot = document.createElement('div');
        slot.className = 'loot-slot';
        
        const img = document.createElement('img');
        img.alt = item.name;
        if (window.bindPixelImage) {
            window.bindPixelImage(img, itemId);
        }

        const countSpan = document.createElement('span');
        countSpan.className = 'loot-count';
        countSpan.textContent = `x${count}`;

        slot.appendChild(img);
        slot.appendChild(countSpan);

        slot.addEventListener('click', () => {
            const detailIcon = document.getElementById('detail-icon');
            if (window.bindPixelImage) {
                window.bindPixelImage(detailIcon, itemId);
            }
            document.getElementById('detail-title').textContent = item.name;
            document.getElementById('detail-desc').textContent = item.description;
            document.getElementById('detail-tier').textContent = `${(item.rarity || 'common').toUpperCase()} DROP`;
            document.getElementById('detail-points').textContent = `Total Nilai: ${itemValues[itemId]} Pts`;
            if (itemDetailModal) itemDetailModal.classList.remove('hidden');
        });
        grid.appendChild(slot);
    }
}

if (openInventoryBtn) {
    openInventoryBtn.addEventListener('click', () => {
        if (!currentUser) return;
        renderInventoryGrid();
        if (inventoryModal) inventoryModal.classList.remove('hidden');
    });
}
if (closeInventoryBtn) {
    closeInventoryBtn.addEventListener('click', () => {
        if (inventoryModal) inventoryModal.classList.add('hidden');
    });
}
if (inventoryBackScannerBtn) {
    inventoryBackScannerBtn.addEventListener('click', () => {
        if (inventoryModal) inventoryModal.classList.add('hidden');
    });
}
if (closeDetailBtn) {
    closeDetailBtn.addEventListener('click', () => {
        if (itemDetailModal) itemDetailModal.classList.add('hidden');
    });
}

window.checkGameStatusAndUpdateTimer = checkGameStatusAndUpdateTimer;
window.startStudentTimer = startStudentTimer;
window.startScanner = startScanner;
window.startAnnouncementPolling = startAnnouncementPolling;
window.showFinishScreen = showFinishScreen;
window.updateProgressTracker = updateProgressTracker;
window.loadQuestion = loadQuestion;
window.resetToScanner = resetToScanner;