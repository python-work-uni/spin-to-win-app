document.addEventListener('DOMContentLoaded', () => {

    // --- DOM ELEMENT REFERENCES ---
    const navSpinnerBtn = document.getElementById('nav-spinner-btn');
    const navStatsBtn = document.getElementById('nav-stats-btn');
    const navAthleteBtn = document.getElementById('nav-athlete-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const spinnerView = document.getElementById('spinner-view');
    const statsView = document.getElementById('stats-view');
    const athleteView = document.getElementById('athlete-view');
    const totalHoursInput = document.getElementById('total-hours');
    const gameHoursInput = document.getElementById('game-hours');
    const startBtn = document.getElementById('start-btn');
    const setupSection = document.getElementById('setup-section');
    const spinnerSection = document.getElementById('spinner-section');
    const sessionProgressText = document.getElementById('session-progress');
    const spinBtn = document.getElementById('spin-btn');
    const spinnerWheel = document.getElementById('spinner-wheel');
    const spinResultText = document.getElementById('spin-result');
    const sessionStudyHoursText = document.getElementById('session-study-hours');
    const sessionGameHoursText = document.getElementById('session-game-hours');
    const endEarlyBtn = document.getElementById('end-early-btn');
    const statsStudyHoursText = document.getElementById('stats-study-hours');
    const statsGameHoursText = document.getElementById('stats-game-hours');
    const statsTotalSessionsText = document.getElementById('stats-total-sessions');
    const statsGamePercentageText = document.getElementById('stats-game-percentage');
    const resetStatsBtn = document.getElementById('reset-stats-btn');
    const timerContainer = document.getElementById('timer-container');
    const timerDisplay = document.getElementById('timer-display');
    const timerStartBtn = document.getElementById('timer-start-btn');
    const timerPauseBtn = document.getElementById('timer-pause-btn');
    const timerResetBtn = document.getElementById('timer-reset-btn');
    const statsHistoryList = document.getElementById('stats-history-list');

    // --- APPLICATION STATE ---
    let sessionState = {};
    let stats = { totalStudyHours: 0, totalGameHours: 0, totalSessionsCompleted: 0, sessionHistory: [], level: 1,
    currentExp: 0,
    longestSession: 0,
    achievements: {} };
    let currentRotation = 0;
    const STATS_KEY = 'probabilisticSpinnerStats';
    const THEME_KEY = 'probabilisticSpinnerTheme';
    let timerInterval = null;
    let timeRemaining = 3600; // 1 hour in seconds
    let isTimerRunning = false;

    // --- UI UPDATE FUNCTION ---
    function updateUI() {
        if (sessionState.totalHours) {
            sessionProgressText.textContent = `Hour ${sessionState.currentHour} of ${sessionState.totalHours}`;
            spinResultText.textContent = sessionState.lastSpinResult || '-';
            sessionStudyHoursText.textContent = sessionState.sessionStudyHours;
            sessionGameHoursText.textContent = sessionState.sessionGameHours;
        } else {
            sessionProgressText.textContent = '';
            spinResultText.textContent = '-';
            sessionStudyHoursText.textContent = '0';
            sessionGameHoursText.textContent = '0';
        }
        const totalSpins = stats.totalStudyHours + stats.totalGameHours;
        let gamePercentage = 0;
        if (totalSpins > 0) {
            gamePercentage = ((stats.totalGameHours / totalSpins) * 100).toFixed(1);
        }
        statsStudyHoursText.textContent = stats.totalStudyHours;
        statsGameHoursText.textContent = stats.totalGameHours;
        statsTotalSessionsText.textContent = stats.totalSessionsCompleted;
        statsGamePercentageText.textContent = `${gamePercentage}%`;
        updateAthleteView();
    }

    function updateAthleteView() {
        // Calculate Rank
        let rank = "Novice Scholar";
        if (stats.level >= 20) rank = "Master Mind";
        else if (stats.level >= 15) rank = "Elite Thinker";
        else if (stats.level >= 10) rank = "Disciplined Mind";
        else if (stats.level >= 5) rank = "Adept Learner";
        document.getElementById('athlete-rank').textContent = rank;

        // Update Level and EXP
        document.getElementById('athlete-level').textContent = stats.level;
        const expNeeded = calculateExpForLevel(stats.level);
        document.getElementById('athlete-current-exp').textContent = stats.currentExp;
        document.getElementById('athlete-exp-needed').textContent = expNeeded;

        // Update Progress Bar
        const expPercentage = (stats.currentExp / expNeeded) * 100;
        document.getElementById('exp-progress-bar').style.width = `${expPercentage}%`;
        
        // Update Career Stats (you will need to add more logic for streaks)
        document.getElementById('athlete-longest-session').textContent = `${stats.longestSession}`;

        // Update Achievements
        const centurionAchievement = document.getElementById('ach-centurion');
        if (stats.achievements.centurion) {
            centurionAchievement.classList.add('unlocked');
        } else {
            centurionAchievement.classList.remove('unlocked');
        }
    }

    // --- LOGIC FUNCTIONS ---
    function startSession() {
        const totalHours = parseInt(totalHoursInput.value, 10);
        const gameHours = parseInt(gameHoursInput.value, 10);

        if (isNaN(totalHours) || totalHours <= 0 || totalHours > 24) {
            alert('Please enter a valid number of total hours (1-24).');
            return;
        }
        if (isNaN(gameHours) || gameHours < 0) {
            alert('Please enter a valid number of game hours.');
            return;
        }
        if (gameHours > totalHours) {
            alert('Desired game hours cannot exceed total session hours.');
            return;
        }

        const probabilityGame = gameHours / totalHours;

        sessionState = {
            totalHours: totalHours,
            desiredGameHours: gameHours,
            probabilityGame: probabilityGame,
            currentHour: 1,
            sessionStudyHours: 0,
            sessionGameHours: 0,
            lastSpinResult: null
        };
        
        const gamePercent = probabilityGame * 100;
        spinnerWheel.style.backgroundImage = `conic-gradient(var(--secondary-color) 0% ${gamePercent}%, var(--primary-color) ${gamePercent}% 100%)`;
        
        setupSection.style.display = 'none';
        spinnerSection.style.display = 'block';
        updateUI();
    }

    function displayHistory() {
        statsHistoryList.innerHTML = ''; // Clear previous entries

        if (!stats.sessionHistory || stats.sessionHistory.length === 0) {
            const emptyMsg = document.createElement('li');
            emptyMsg.textContent = 'No completed sessions yet.';
            emptyMsg.style.fontStyle = 'italic';
            emptyMsg.style.textAlign = 'center';
            statsHistoryList.appendChild(emptyMsg);
            return;
        }

        // Show most recent sessions first by reversing a copy of the array
        [...stats.sessionHistory].reverse().forEach(session => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<strong>${session.date}:</strong> Studied ${session.study}h, Gamed ${session.game}h`;
            statsHistoryList.appendChild(listItem);
        });
    }

    function spinWheel() {
        if (!sessionState.totalHours || sessionState.currentHour > sessionState.totalHours) return;
        
        timerContainer.style.display = 'none';
        spinBtn.disabled = true;

        const landingAngle = Math.random() * 360;
        const gameAngleThreshold = sessionState.probabilityGame * 360;
        const outcome = (landingAngle < gameAngleThreshold) ? 'Game' : 'Study';
        sessionState.lastSpinResult = outcome;

        const extraRotations = 5 * 360; 
        const finalRotation = extraRotations + (360 - landingAngle);

        spinnerWheel.style.transform = `rotate(${finalRotation}deg)`;

        setTimeout(() => {
            if (outcome === 'Game') {
                sessionState.sessionGameHours++;
            } else {
                sessionState.sessionStudyHours++;
            }
            
            timerContainer.style.display = 'block'; 
            resetTimer();
            spinBtn.disabled = false;

            if (sessionState.currentHour >= sessionState.totalHours) {
                updateUI();
                endSession(true);
            } else {
                sessionState.currentHour++;
                updateUI();
            }

            const newBaseRotation = finalRotation % 360;
            spinnerWheel.style.transition = 'none';
            spinnerWheel.style.transform = `rotate(${newBaseRotation}deg)`;
            
            setTimeout(() => {
                spinnerWheel.style.transition = 'transform 1s ease-out';
            }, 50);

        }, 1000);
    }

    const EXP_PER_HOUR = 100;

    function calculateExpForLevel(level) {
        // Exponential curve for leveling
        return Math.floor(1000 * Math.pow(level, 1.5));
    }

    function addExp(studyHours) {
        const expGained = studyHours * EXP_PER_HOUR;
        stats.currentExp += expGained;
        console.log(`Gained ${expGained} EXP!`);
        checkLevelUp();
    }

    function checkLevelUp() {
        let expNeeded = calculateExpForLevel(stats.level);
        while (stats.currentExp >= expNeeded) {
            stats.level++;
            stats.currentExp -= expNeeded;
            alert(`Congratulations! You've reached Level ${stats.level}!`);
            expNeeded = calculateExpForLevel(stats.level);
        }
    }

    function checkPerformanceMetrics(session) {
        // 1. Check for the longest single session
        // It calculates the total hours from the completed session...
        const totalSessionHours = session.sessionStudyHours + session.sessionGameHours;
        
        // ...and if it's a new record, updates the stats.
        if (totalSessionHours > stats.longestSession) {
            stats.longestSession = totalSessionHours;
        }

        // 2. Check for the 'Centurion' achievement
        // This checks if the lifetime study hours have reached 100 AND
        // if the achievement hasn't already been unlocked.
        if (stats.totalStudyHours >= 100 && !stats.achievements.centurion) {
            stats.achievements.centurion = true; // Mark as unlocked
            alert('🏆 Achievement Unlocked: Centurion!\n(Logged 100 total study hours.)');
        }
        
        // 3. (Future achievement checks would go here)
        // For example:
        // if (session.sessionStudyHours >= 8 && !stats.achievements.marathoner) { ... }
    }

    // --- TIMER LOGIC FUNCTIONS ---
    function updateTimerDisplay() {
        const hours = Math.floor(timeRemaining / 3600);
        const minutes = Math.floor((timeRemaining % 3600) / 60);
        const seconds = timeRemaining % 60;

        timerDisplay.textContent = 
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function startTimer() {
        if (isTimerRunning) return;
        isTimerRunning = true;
        timerStartBtn.style.display = 'none';
        timerPauseBtn.style.display = 'inline-block';

        timerInterval = setInterval(() => {
            timeRemaining--;
            updateTimerDisplay();

            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                isTimerRunning = false;
                alert("Time's up!");
                timerStartBtn.style.display = 'inline-block';
                timerPauseBtn.style.display = 'none';
            }
        }, 1000);
    }

    function pauseTimer() {
        isTimerRunning = false;
        clearInterval(timerInterval);
        timerStartBtn.style.display = 'inline-block';
        timerPauseBtn.style.display = 'none';
    }

    function resetTimer() {
        pauseTimer();
        timeRemaining = 3600;
        updateTimerDisplay();
    }

    function endSession(isFullSession = false) {
        // 1. Create a record of the session's results
        const sessionRecord = {
            date: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
            study: sessionState.sessionStudyHours,
            game: sessionState.sessionGameHours
        };

        // 2. Add the record to history only if at least one hour was logged
        if (sessionRecord.study > 0 || sessionRecord.game > 0) {
            stats.sessionHistory.push(sessionRecord);
        }

        // 3. Notify the user of the session outcome
        alert(`Session Finished!\nStudy: ${sessionState.sessionStudyHours} hours\nGame: ${sessionState.sessionGameHours} hours`);

        // 4. Update lifetime statistics
        stats.totalStudyHours += sessionState.sessionStudyHours;
        stats.totalGameHours += sessionState.sessionGameHours;
        
        if (isFullSession) {
            stats.totalSessionsCompleted++;
        }

        // 5. --- NEW ATHLETE LOGIC ---
        //    Award EXP for study hours and check for level-ups
        if (sessionState.sessionStudyHours > 0) {
            addExp(sessionState.sessionStudyHours); 
        }
        //    Check for new records (like longest session) and unlock achievements
        checkPerformanceMetrics(sessionState);

        // 6. Save all updated stats to local storage
        saveStats();

        // 7. Reset the application state and UI for the next session
        sessionState = {};
        timerContainer.style.display = 'none';
        setupSection.style.display = 'block';
        spinnerSection.style.display = 'none';
        
        // 8. Refresh the UI to show the latest stats everywhere
        updateUI();
    }
    
    function viewSpinner() {
        spinnerView.style.display = 'block';
        statsView.style.display = 'none';
        athleteView.style.display = 'none';
    }

    function viewStats() {
        spinnerView.style.display = 'none';
        statsView.style.display = 'block';
        athleteView.style.display = 'none';
        updateUI();
        // START: New Code
        displayHistory();
        // END: New Code
    }

    function viewAthlete() {
        spinnerView.style.display = 'none';
        statsView.style.display = 'none';
        athleteView.style.display = 'block';
        updateUI(); 
    }
    
    function loadStats() {
        const savedStats = localStorage.getItem(STATS_KEY);
        if (savedStats) {
            const loadedStats = JSON.parse(savedStats);
            stats.totalStudyHours = loadedStats.totalStudyHours || 0;
            stats.totalGameHours = loadedStats.totalGameHours || 0;
            stats.totalSessionsCompleted = loadedStats.totalSessionsCompleted || 0;
            stats.sessionHistory = loadedStats.sessionHistory || [];
            stats.level = loadedStats.level || 1;
            stats.currentExp = loadedStats.currentExp || 0;
            stats.longestSession = loadedStats.longestSession || 0;
            stats.achievements = loadedStats.achievements || {};
        }
    }

    function saveStats() {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    }

    function resetStats() {
        const isConfirmed = confirm('Are you sure you want to reset all your lifetime statistics? This action cannot be undone.');
        
        if (isConfirmed) {
            // Update this object to include the new athlete stats
            stats = { 
                totalStudyHours: 0, 
                totalGameHours: 0, 
                totalSessionsCompleted: 0, 
                sessionHistory: [],
                level: 1,
                currentExp: 0,
                longestSession: 0,
                achievements: {} 
            };
            localStorage.removeItem(STATS_KEY);
            updateUI();
            displayHistory();
        }
    }

    // --- THEME TOGGLE FUNCTIONS ---
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggleBtn.textContent = '☀️'; // Set icon to sun in dark mode
        } else {
            document.body.classList.remove('dark-mode');
            themeToggleBtn.textContent = '🌙'; // Set icon to moon in light mode
        }
    }

    function toggleTheme() {
        const currentTheme = localStorage.getItem(THEME_KEY);
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_KEY, newTheme);
        applyTheme(newTheme);
    }

    function loadTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
        applyTheme(savedTheme);
    }

    // --- EVENT LISTENERS ---
    startBtn.addEventListener('click', startSession);
    spinBtn.addEventListener('click', spinWheel);
    navSpinnerBtn.addEventListener('click', viewSpinner);
    navStatsBtn.addEventListener('click', viewStats);
    navAthleteBtn.addEventListener('click', viewAthlete);
    resetStatsBtn.addEventListener('click', resetStats);
    themeToggleBtn.addEventListener('click', toggleTheme);
    endEarlyBtn.addEventListener('click', () => {
        if (sessionState.totalHours) {
            endSession(false);
        }
    });
    timerStartBtn.addEventListener('click', startTimer);
    timerPauseBtn.addEventListener('click', pauseTimer);
    timerResetBtn.addEventListener('click', resetTimer);

    // --- INITIALIZATION ---
    loadStats();
    loadTheme();
    updateUI();
    viewSpinner();
});