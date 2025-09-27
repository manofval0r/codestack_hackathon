export const UI = {
    loadingScreen: document.getElementById('loading-screen'),
    gameContainer: document.getElementById('game-container'),
    initialProfileModal: document.getElementById('initial-profile-modal'),
    systemMenuModal: document.getElementById('system-menu-modal'),
    feedbackBar: document.getElementById('feedback-bar'),
    xpValue: document.getElementById('xp-value'),
    xpBarFill: document.getElementById('xp-bar-fill'),
    integrityValue: document.getElementById('integrity-value'),
    integrityBarFill: document.getElementById('integrity-bar-fill'),
    levelText: document.getElementById('player-level'),
    headerTypingEffect: document.getElementById('header-typing-effect'),
    challengeTitle: document.getElementById('challenge-title'),
    learningConcept: document.getElementById('learning-concept'),
    challengeText: document.getElementById('challenge-text'),
    codeBlock: document.getElementById('code-block'),
    chatBox: document.getElementById('ai-chat-box'),
    promptInput: document.getElementById('prompt-input'),
    solutionInput: document.getElementById('solution-input'),
    askAIButton: document.getElementById('ask-ai-button'),
    submitSolutionButton: document.getElementById('submit-solution-button'),
    achievementToast: document.getElementById('achievement-toast'),
    achievementName: document.getElementById('achievement-name'),
    achievementDesc: document.getElementById('achievement-desc'),
    pillsContainer: document.getElementById('pills-container'),
    progressPlayerIcon: document.getElementById('progress-player-icon'),
    progressSignifiers: document.getElementById('progress-signifiers'),
    roadmapList: document.getElementById('roadmap-list'),
    upgradesList: document.getElementById('upgrades-list'),
    rosterList: document.getElementById('roster-list'),
    usernameInput: document.getElementById('username-input'),
    languageSelect: document.getElementById('language-select'),
    typingInterval: null,

    showGame() {
        this.loadingScreen.style.opacity = '0';
        setTimeout(() => {
            this.loadingScreen.classList.add('hidden');
            this.gameContainer.classList.remove('hidden');
        }, 500);
    },

    showInitialProfileModal() { this.initialProfileModal.classList.remove('hidden'); },
    hideInitialProfileModal() { this.initialProfileModal.classList.add('hidden'); },
    showSystemMenu() { this.systemMenuModal.classList.remove('hidden'); },
    hideSystemMenu() { this.systemMenuModal.classList.add('hidden'); },

    updatePlayerStats(state) {
        // XP bar and value have been removed from the UI, so don't update them.
        // Only update stats that still exist in your header.
        if (this.levelText) this.levelText.textContent = state.level;
        // Add other stat updates here if needed (e.g., health, integrity)
    },

    updateSystemIntegrity(integrity) {
        this.integrityValue.textContent = `${integrity}%`;
        this.integrityBarFill.style.width = `${integrity}%`;
    },

    renderChallenge(challenge) {
        this.challengeTitle.textContent = `[${challenge.moduleKey}] ` + challenge.title;
        this.learningConcept.textContent = challenge.learningConcept;
        this.challengeText.textContent = challenge.description;
        this.codeBlock.textContent = challenge.brokenCode;
        this.pillsContainer.innerHTML = '';
        this.pillsContainer.style.display = 'none';
        this.solutionInput.parentElement.style.display = 'flex';

        if (challenge.type === 'multiple-choice') {
            this.solutionInput.parentElement.style.display = 'none';
            this.pillsContainer.style.display = 'flex';
            challenge.options.forEach(optionText => {
                const pill = document.createElement('button');
                pill.className = 'pill-button';
                pill.textContent = optionText;
                pill.dataset.value = optionText;
                this.pillsContainer.appendChild(pill);
            });
        }
    },

    addMessage(sender, text, isLoading = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        messageDiv.textContent = text;
        if (isLoading) messageDiv.classList.add('loading');
        this.chatBox.appendChild(messageDiv);
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
        return messageDiv;
    },

    setLoading(messageElement, isLoading) {
        if (isLoading) messageElement.classList.add('loading');
        else messageElement.classList.remove('loading');
    },

    showFeedback(message, isSuccess = true) {
        this.feedbackBar.textContent = message;
        this.feedbackBar.className = 'feedback-bar';
        this.feedbackBar.classList.add('show');
        this.feedbackBar.classList.add(isSuccess ? 'success' : 'fail');
        setTimeout(() => { this.feedbackBar.classList.remove('show'); }, 3000);
    },

    showAchievement(achievement) {
        this.achievementName.textContent = achievement.name;
        this.achievementDesc.textContent = achievement.description;
        this.achievementToast.classList.remove('hidden');
        this.achievementToast.classList.add('show');
        setTimeout(() => {
            this.achievementToast.classList.remove('show');
            this.achievementToast.classList.add('hidden');
        }, 5000);
    },
    
    updateProgressTracker(completedCount, totalCount, allModules) {
        const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
        this.progressPlayerIcon.style.left = `${percentage}%`;

        this.progressSignifiers.innerHTML = '';
        let challengesSoFar = 0;
        allModules.forEach(module => {
            challengesSoFar += module.challenges.length;
            const signifierPercentage = (challengesSoFar / totalCount) * 100;
            if (signifierPercentage < 100) {
                const signifier = document.createElement('div');
                signifier.className = 'signifier';
                signifier.style.left = `${signifierPercentage}%`;
                this.progressSignifiers.appendChild(signifier);
            }
        });
    },
    
    startTypingAnimation(rank, username) {
        if (this.typingInterval) clearInterval(this.typingInterval);
        const texts = [username, rank];
        let i = 0;
        let j = 0;
        let currentText = '';
        let isDeleting = false;

        this.typingInterval = setInterval(() => {
            let fullText = texts[i];
            if (isDeleting) {
                currentText = fullText.substring(0, currentText.length - 1);
            } else {
                currentText = fullText.substring(0, currentText.length + 1);
            }

            this.headerTypingEffect.innerHTML = currentText;

            if (!isDeleting && currentText === fullText) {
                isDeleting = true;
                j = 20;
            } else if (isDeleting && currentText === '') {
                isDeleting = false;
                i = (i + 1) % texts.length;
            }
            if (j > 0) j--;
        }, isDeleting ? 150 : 220);
    },

    renderRoadmap(allModules, completedChallenges) {
        this.roadmapList.innerHTML = '';
        allModules.forEach(module => {
            const moduleDiv = document.createElement('div');
            moduleDiv.className = 'roadmap-module';
            const completedInModule = completedChallenges[module.key]?.length || 0;
            moduleDiv.innerHTML = `<h3>${module.displayName} (${completedInModule}/${module.challenges.length})</h3>`;
            
            const challengeList = document.createElement('div');
            module.challenges.forEach(challenge => {
                const challengeDiv = document.createElement('div');
                challengeDiv.className = 'roadmap-challenge';
                const isCompleted = completedChallenges[module.key]?.includes(challenge.id);
                if (isCompleted) {
                    challengeDiv.classList.add('completed');
                }
                challengeDiv.textContent = challenge.title;
                challengeList.appendChild(challengeDiv);
            });
            moduleDiv.appendChild(challengeList);
            this.roadmapList.appendChild(moduleDiv);
        });
    },

    renderUpgrades(state, upgradeDefs) {
        this.upgradesList.innerHTML = '';
        upgradeDefs.forEach(upgrade => {
            const item = document.createElement('div');
            item.className = 'upgrade-item';
            const text = document.createElement('div');
            text.innerHTML = `<h4>${upgrade.name}</h4><p>${upgrade.description}</p>`;
            const btn = document.createElement('button');
            btn.dataset.id = upgrade.id;
            const isOwned = state.upgrades[upgrade.id];
            const canAfford = state.xp >= upgrade.cost;
            
            if (isOwned) {
                btn.textContent = 'ACQUIRED';
                btn.disabled = true;
            } else {
                btn.textContent = `COST: ${upgrade.cost} XP`;
                btn.disabled = !canAfford;
            }
            item.appendChild(text);
            item.appendChild(btn);
            this.upgradesList.appendChild(item);
        });
    },

    renderProfile(state) {
        this.rosterList.innerHTML = '';
        const fakeOperatives = [
            { username: 'root', rank: 'masterOfTheStack', favoriteLanguage: 'Python'},
            { username: 'N0mad', rank: 'architectArcanist', favoriteLanguage: 'JavaScript'},
            { username: 'Firewall', rank: 'logicWeaver', favoriteLanguage: 'CSS'}
        ];
        const playerRosterItem = document.createElement('div');
        playerRosterItem.className = 'roster-item player';
        playerRosterItem.innerHTML = `> ${state.username} [${state.rank}] - Prefers: ${state.favoriteLanguage}`;
        this.rosterList.appendChild(playerRosterItem);

        fakeOperatives.forEach(op => {
            if (op.username !== state.username) {
                const opItem = document.createElement('div');
                opItem.className = 'roster-item';
                opItem.innerHTML = `> ${op.username} [${op.rank}] - Prefers: ${op.favoriteLanguage}`;
                this.rosterList.appendChild(opItem);
            }
        });
    }
};