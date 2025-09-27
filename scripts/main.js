import { GameState } from './gameState.js';
import { UI } from './uiController.js';
import { ChallengeManager } from './challengeManager.js';
import { AIManager } from './aiIntegration.js';
import { AchievementManager } from './achievements.js';
import { AudioManager } from './audioManager.js';

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
            this.achievementManager = new AchievementManager();
            this.audioManager = new AudioManager();
            this.currentChallenge = null;
            this.hintsUsedThisChallenge = false;
            this.initialize();
        }

        async initialize() {
            this.audioManager.play('loading');
            await Promise.all([this.challengeManager.load(), this.aiManager.load()]);
            this.setupEventListeners();
            
            if (!this.gameState.state.isProfileSetup) {
                UI.showInitialProfileModal();
            } else {
                this.startGame();
            }
        }

        startGame() {
            UI.hideInitialProfileModal();
            this.audioManager.stop('loading');
            this.audioManager.play('success');
            UI.showGame();
            UI.updatePlayerStats(this.gameState.state);
            UI.updateSystemIntegrity(this.gameState.state.systemIntegrity);
            this.updateProgress();
            UI.startTypingAnimation(this.gameState.state.rank, this.gameState.state.username);
            this.loadNextChallenge();
        }

        setupEventListeners() {
            document.getElementById('save-profile-button').addEventListener('click', () => this.handleSaveProfile());
            document.getElementById('open-menu-button').addEventListener('click', () => this.handleOpenMenu());
            document.getElementById('close-menu-button').addEventListener('click', () => UI.hideSystemMenu());
            
            UI.askAIButton.addEventListener('click', () => { this.audioManager.play('click'); this.handleAIPrompt(); });
            UI.submitSolutionButton.addEventListener('click', () => { this.audioManager.play('click'); this.handleSubmitSolution(); });
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'l') { e.preventDefault(); this.audioManager.play('click'); this.handleSubmitSolution(); }
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
                    this.audioManager.play('click');
                    this.handleSubmitSolution(e.target.dataset.value);
                }
            });
            
            document.getElementById('upgrades-list').addEventListener('click', e => {
                if (e.target.tagName === 'BUTTON' && e.target.dataset.id) {
                    this.handleBuyUpgrade(e.target.dataset.id);
                }
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
                this.audioManager.play('success');
                UI.renderUpgrades(this.gameState.state, UPGRADE_DEFINITIONS);
                UI.updatePlayerStats(this.gameState.state);
            } else {
                this.audioManager.play('fail');
            }
        }

        loadNextChallenge() {
            this.currentChallenge = this.challengeManager.getCurrentChallenge(this.gameState.state.completedChallenges);
            this.hintsUsedThisChallenge = false;
            
            if (this.currentChallenge) UI.renderChallenge(this.currentChallenge);
            else {
                UI.showFeedback("MASTER OF THE STACK! You've completed all available challenges!", true);
                UI.askAIButton.disabled = true;
                UI.submitSolutionButton.disabled = true;
            }
        }

        async handleAIPrompt() {
            const promptText = UI.promptInput.value;
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
            const hint = await this.aiManager.getHint(this.currentChallenge.id);
            
            this.audioManager.play('hint');
            loadingMsg.textContent = hint;
            UI.setLoading(loadingMsg, false);
        }

        handleSubmitSolution(answer = null) {
            const solutionText = answer || UI.solutionInput.value;
            if (!solutionText || !this.currentChallenge) return;

            const isCorrect = this.challengeManager.validateSolution(this.currentChallenge, solutionText);

            if (isCorrect) {
                this.audioManager.play('success');
                this.gameState.state.streak++;
                UI.showFeedback(`Patch Successful! (Streak: ${this.gameState.state.streak})`, true);
                
                const integrityGained = 5 + this.gameState.state.streak;
                this.gameState.state.systemIntegrity = Math.min(100, this.gameState.state.systemIntegrity + integrityGained);

                this.gameState.addXp(this.currentChallenge.xp);
                this.gameState.markChallengeCompleted(this.currentChallenge.moduleKey, this.currentChallenge.id);

                if (!this.hintsUsedThisChallenge) this.gameState.state.stats.solvedWithoutHint++;

                const moduleData = this.challengeManager.getModule(this.currentChallenge.moduleKey);
                const newRank = this.gameState.updateRank(this.currentChallenge.moduleKey, moduleData);
                if (newRank) {
                    UI.showFeedback(`PROMOTION GRANTED: You are now a ${newRank}!`, true);
                    UI.startTypingAnimation(newRank, this.gameState.state.username);
                }

                this.updateProgress();
                this.loadNextChallenge();

            } else {
                this.audioManager.play('fail');
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
            
            this.gameState.save();
            UI.updatePlayerStats(this.gameState.state);
            UI.updateSystemIntegrity(this.gameState.state.systemIntegrity);
            this.checkForAchievements();
        }
        
        updateProgress() {
            const completed = this.challengeManager.getCompletedChallengeCount(this.gameState.state.completedChallenges);
            const total = this.challengeManager.getTotalChallengeCount();
            const allModules = this.challengeManager.getAllChallengesByModule();
            UI.updateProgressTracker(completed, total, allModules);
        }

        checkForAchievements() {
            const unlockedAchievement = this.achievementManager.checkAchievements(this.gameState.state);
            if (unlockedAchievement) {
                this.audioManager.play('achievement');
                this.gameState.state.unlockedAchievements.push(unlockedAchievement.key);
                this.gameState.save();
                UI.showAchievement(unlockedAchievement);
            }
        }
    }
    
    new Game();
});