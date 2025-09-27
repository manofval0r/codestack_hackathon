import { GameState } from './gameState.js';
import { UI } from './uiController.js';
import { ChallengeManager } from './challengeManager.js';
import { AIManager } from './aiIntegration.js';
import { AchievementManager } from './achievements.js';
import { LiveAI } from './liveAI.js';

const USE_LIVE_AI = true;

document.addEventListener('DOMContentLoaded', () => {

    const UPGRADE_DEFINITIONS = [
        { id: 'cheaperHints', name: 'AI Co-Processor', description: 'AI hints cost 5 XP instead of 10.', cost: 200 },
        { id: 'strongerFirewall', name: 'Firewall Reinforcement', description: 'Lose 10 System Integrity on failure instead of 15.', cost: 300 },
        { id: 'streakStabilizer', name: 'Streak Stabilizer', description: "Your streak won't reset on your first failure (resets after use).", cost: 400 }
    ];

    class Game {
        constructor() {
            this.gameState = new GameState();
            this.challengeManager = new ChallengeManager();
            this.aiManager = new AIManager();
            this.liveAI = new LiveAI();
            this.achievementManager = new AchievementManager();
            this.currentChallenge = null;
            this.isBossActive = false;
            this.currentBossStage = 0;
            this.hintsUsedThisChallenge = false;
            this.dailyChallengeStartTime = 0;
            this.currentDailyChallenge = null;
            this.playerXP = 0;
            this.streak = 0;
            this.initialize();
        }

        async initialize() {
            this.setupFirstInteractionListener();
            await Promise.all([this.challengeManager.load(), this.aiManager.load()]);
            this.setupEventListeners();
            
            if (!this.gameState.state.isProfileSetup) {
                UI.showInitialProfileModal();
                UI.showGame();
            } else {
                this.startGame();
            }
        }

        startGame() {
            UI.hideInitialProfileModal();
            UI.showGame();
            UI.updatePlayerStats(this.gameState.state);
            UI.updateSystemIntegrity(this.gameState.state.systemIntegrity);
            this.updateProgress();
            UI.startTypingAnimation(this.gameState.state.rank, this.gameState.state.username);
            this.loadNextChallenge();
        }

        handleFirstInteraction() {
            document.removeEventListener('click', this.boundHandleFirstInteraction);
            document.removeEventListener('keydown', this.boundHandleFirstInteraction);
        }

        setupFirstInteractionListener() {
            this.boundHandleFirstInteraction = this.handleFirstInteraction.bind(this);
            document.addEventListener('click', this.boundHandleFirstInteraction);
            document.addEventListener('keydown', this.boundHandleFirstInteraction);
        }

        setupEventListeners() {
            document.getElementById('save-profile-button').addEventListener('click', () => this.handleSaveProfile());
            document.getElementById('open-menu-button').addEventListener('click', () => this.handleOpenMenu());
            document.getElementById('close-menu-button').addEventListener('click', () => UI.hideSystemMenu());
            document.getElementById('daily-challenge-button').addEventListener('click', () => this.startDailyChallenge());
            document.getElementById('submit-daily-solution-button').addEventListener('click', () => this.handleDailyChallengeSubmit());
            document.getElementById('close-daily-results-button').addEventListener('click', () => UI.hideDailyResultsModal());

            UI.askAIButton.addEventListener('click', () => { this.handleAIPrompt(); });
            UI.submitSolutionButton.addEventListener('click', () => { this.handleSubmitSolution(); });
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'l') { e.preventDefault(); this.handleSubmitSolution(); }
            });

            document.querySelector('.menu-tabs').addEventListener('click', e => {
                if (e.target.classList.contains('menu-tab-button')) {
                    const tab = e.target.dataset.tab;
                    document.querySelectorAll('.menu-tab-button').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    document.querySelectorAll('.menu-tab-content').forEach(c => c.classList.remove('active'));
                    document.getElementById(`${tab}-content`).classList.add('active');
                    this.refreshMenuTab(tab);
                }
            });

            document.getElementById('pills-container').addEventListener('click', e => {
                if (e.target.classList.contains('pill-button')) {
                    this.handleSubmitSolution(e.target.dataset.value);
                }
            });
            
            document.getElementById('upgrades-list').addEventListener('click', e => {
                if (e.target.tagName === 'BUTTON' && e.target.dataset.id) {
                    this.handleBuyUpgrade(e.target.dataset.id);
                }
            });

            document.getElementById('progress-path').addEventListener('mouseover', e => {
                if (e.target.classList.contains('signifier')) {
                    const rect = e.target.getBoundingClientRect();
                    const moduleName = e.target.dataset.moduleName;
                    const progress = e.target.dataset.progress;
                    UI.showProgressTooltip(rect.left + (rect.width / 2), rect.top, moduleName, progress);
                }
            });
            document.getElementById('progress-path').addEventListener('mouseout', e => {
                if (e.target.classList.contains('signifier')) {
                    UI.hideProgressTooltip();
                }
            });

            // Tab switching for Solution/AI Assistant
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Remove 'active' from all tab buttons and tab contents
                    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

                    // Add 'active' to clicked button and corresponding content
                    btn.classList.add('active');
                    const tab = btn.dataset.tab;
                    document.getElementById(`${tab}-content`).classList.add('active');
                });
            });
        }
        
        handleSaveProfile() {
            const username = UI.usernameInput.value.trim();
            if (username) {
                this.gameState.state.username = username;
                this.gameState.state.favoriteLanguage = UI.languageSelect.value;
                this.gameState.state.isProfileSetup = true;
                this.gameState.save();
                this.startGame();
            } else {
                UI.showFeedback("Username cannot be empty.", false);
            }
        }
        
        handleOpenMenu() {
            this.refreshMenuTab('roadmap');
            document.querySelector('.menu-tab-button[data-tab="roadmap"]').click();
            UI.showSystemMenu();
        }

        refreshMenuTab(tabId) {
            if (tabId === 'roadmap') UI.renderRoadmap(this.challengeManager.getAllChallengesByModule(), this.gameState.state.completedChallenges);
            else if (tabId === 'upgrades') UI.renderUpgrades(this.gameState.state, UPGRADE_DEFINITIONS);
            else if (tabId === 'profile') UI.renderProfile(this.gameState.state);
        }
        
        handleBuyUpgrade(upgradeId) {
            const upgrade = UPGRADE_DEFINITIONS.find(u => u.id === upgradeId);
            if (upgrade && !this.gameState.state.upgrades[upgradeId] && this.gameState.state.xp >= upgrade.cost) {
                this.gameState.addXp(-upgrade.cost);
                this.gameState.state.upgrades[upgradeId] = true;
                this.gameState.save();
                UI.renderUpgrades(this.gameState.state, UPGRADE_DEFINITIONS);
                UI.updatePlayerStats(this.gameState.state);
            } else {
            }
        }

        loadNextChallenge() {
            this.isBossActive = false;
            this.currentBossStage = 0;
            this.currentChallenge = this.challengeManager.getCurrentChallenge(this.gameState.state.completedChallenges);
            this.hintsUsedThisChallenge = false;
            
            if (this.currentChallenge) {
                if (this.currentChallenge.isBoss) {
                    this.isBossActive = true;
                }
                UI.renderChallenge(this.currentChallenge, this.currentBossStage);
            } else {
                UI.showFeedback("MASTER OF THE STACK! You've completed all available challenges!", true);
                UI.askAIButton.disabled = true;
                UI.submitSolutionButton.disabled = true;
            }
        }

        async handleAIPrompt() {
            const promptText = UI.promptInput.value.trim();
            if (!promptText || !this.currentChallenge) return;

            UI.addMessage('player', promptText);
            UI.promptInput.value = '';

            this.hintsUsedThisChallenge = true;
            this.gameState.state.stats.hintsUsed++;
            const hintCost = this.gameState.state.upgrades.cheaperHints ? 5 : 10;
            this.gameState.addXp(-hintCost);
            this.gameState.save();
            this.checkForAchievements();
            
            UI.updatePlayerStats(this.gameState.state);
            UI.showFeedback(`Sacrificed ${hintCost} XP for a hint!`, false);

            const loadingMsg = UI.addMessage('ai', 'Accessing neural network...', true);
            let hint;

            if (USE_LIVE_AI) {
                const currentCode = this.isBossActive 
                    ? this.currentChallenge.stages[this.currentBossStage].brokenCode
                    : this.currentChallenge.brokenCode;
                hint = await this.liveAI.getHint(currentCode, promptText);
            } else {
                hint = await this.aiManager.getHint(this.currentChallenge.id);
            }
            
            loadingMsg.textContent = hint;
            UI.setLoading(loadingMsg, false);
        }

        handleSubmitSolution(answer = null) {
            const solutionText = answer || UI.solutionInput.value;
            if (!solutionText || !this.currentChallenge) return;

            const isCorrect = this.challengeManager.validateSolution(this.currentChallenge, solutionText, this.isBossActive ? this.currentBossStage : -1);

            if (isCorrect) {
                if (this.isBossActive) {
                    this.handleBossSuccess();
                } else {
                    this.handleRegularSuccess();
                }
            } else {
                this.handleFailure();
            }
            
            this.gameState.save();
            UI.updatePlayerStats(this.gameState.state);
            UI.updateSystemIntegrity(this.gameState.state.systemIntegrity);
            this.checkForAchievements();
        }

        handleBossSuccess() {
            this.currentBossStage++;
            if (this.currentBossStage >= this.currentChallenge.stages.length) {
                UI.showFeedback(`BOSS DEFEATED! ${this.currentChallenge.title}`, true);
                this.gameState.state.streak++;
                this.gameState.addXp(this.currentChallenge.xp);
                this.gameState.markChallengeCompleted(this.currentChallenge.moduleKey, this.currentChallenge.id);
                this.updateModuleRank();
                this.updateProgress();
                this.showXPNotification(this.gameState.state.xp); // <-- Add this line
                this.loadNextChallenge();
            } else {
                UI.showFeedback(`Stage ${this.currentBossStage + 1}/${this.currentChallenge.stages.length} Cleared... Anomaly persists.`, true);
                UI.renderChallenge(this.currentChallenge, this.currentBossStage);
            }
        }

        handleRegularSuccess() {
            this.gameState.state.streak++;
            UI.showFeedback(`Patch Successful! (Streak: ${this.gameState.state.streak})`, true);
            
            const integrityGained = 5 + this.gameState.state.streak;
            this.gameState.state.systemIntegrity = Math.min(100, this.gameState.state.systemIntegrity + integrityGained);

            this.gameState.addXp(this.currentChallenge.xp);
            this.gameState.markChallengeCompleted(this.currentChallenge.moduleKey, this.currentChallenge.id);

            if (!this.hintsUsedThisChallenge) this.gameState.state.stats.solvedWithoutHint++;

            this.updateModuleRank();
            this.updateProgress();
            this.showXPNotification(this.gameState.state.xp);
            this.loadNextChallenge();
        }

        updateModuleRank() {
            const moduleData = this.challengeManager.getModule(this.currentChallenge.moduleKey);
            const newRank = this.gameState.updateRank(this.currentChallenge.moduleKey, moduleData.challenges.length);
            if (newRank) {
                UI.showFeedback(`PROMOTION GRANTED: You are now a ${newRank}!`, true);
                UI.startTypingAnimation(newRank, this.gameState.state.username);
            }
        }

        handleFailure() {
            if (this.gameState.state.upgrades.streakStabilizer) {
                this.gameState.state.upgrades.streakStabilizer = false;
                UI.showFeedback("Streak Stabilizer consumed! Your streak is safe.", false);
            } else {
                this.gameState.state.streak = 0;
            }
            const integrityLoss = this.gameState.state.upgrades.strongerFirewall ? 10 : 15;
            this.gameState.state.systemIntegrity = Math.max(0, this.gameState.state.systemIntegrity - integrityLoss);
            
            UI.showFeedback("Compilation Error. Anomaly detected.", false);
            if (this.gameState.state.systemIntegrity <= 0) {
                UI.showFeedback("SYSTEM INTEGRITY CRITICAL. CONNECTION TERMINATED.", false);
                UI.askAIButton.disabled = true;
                UI.submitSolutionButton.disabled = true;
            }
        }

        startDailyChallenge() {
            this.currentDailyChallenge = this.challengeManager.getRandomChallenge();
            if (this.currentDailyChallenge) {
                this.dailyChallengeStartTime = Date.now();
                UI.showDailyChallengeModal(this.currentDailyChallenge);
            }
        }

        handleDailyChallengeSubmit() {
            const solutionText = UI.dailySolutionInput.value;
            if (!solutionText || !this.currentDailyChallenge) return;

            const isCorrect = this.challengeManager.validateSolution(this.currentDailyChallenge, solutionText);
            if (isCorrect) {
                const endTime = Date.now();
                const duration = ((endTime - this.dailyChallengeStartTime) / 1000).toFixed(2);

                UI.hideDailyChallengeModal();
                UI.showDailyResultsModal(duration);
            } else {
                UI.showFeedback("Incorrect patch. Try again.", false);
            }
        }
        
        updateProgress() {
            const completed = this.challengeManager.getCompletedChallengeCount(this.gameState.state.completedChallenges);
            const total = this.challengeManager.getTotalChallengeCount();
            const allModules = this.challengeManager.getAllChallengesByModule();
            UI.updateProgressTracker(completed, total, allModules, this.gameState.state.completedChallenges);
        }

        checkForAchievements() {
            const unlockedAchievement = this.achievementManager.checkAchievements(this.gameState.state);
            if (unlockedAchievement) {
                this.gameState.state.unlockedAchievements.push(unlockedAchievement.key);
                this.gameState.save();
                UI.showAchievement(unlockedAchievement);
            }
        }

        awardXP(madeError) {
            let baseXP = madeError ? 50 : 80;
            let streakBonus = this.streak > 0 ? 30 * this.streak : 0;
            let totalXP = baseXP + streakBonus;

            this.playerXP += totalXP;

            // Remove or comment out the line below, since #xp-value no longer exists
            // document.getElementById('xp-value').textContent = `${this.playerXP} XP`;

            // If no errors, increase streak
            if (!madeError) {
                this.streak++;
            } else {
                this.streak = 0;
            }
        }   

        showXPNotification(xp) {
            const notif = document.getElementById('xp-notification');
            notif.textContent = `You now have ${xp} XP!`;
            notif.classList.remove('hidden');
            notif.classList.add('show');
            setTimeout(() => {
                notif.classList.remove('show');
                notif.classList.add('hidden');
            }, 2500);
        }
    }
    
    new Game();
});