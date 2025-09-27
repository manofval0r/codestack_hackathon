const SAVE_KEY = 'codeStackSave';

export class GameState {
    constructor() {
        this.state = this.load();
    }

    getInitialState() {
        return {
            level: 1,
            xp: 0,
            xpForNextLevel: 100,
            rank: "imNewGuy",
            completedChallenges: {},
            unlockedAchievements: [],
            stats: {
                hintsUsed: 0,
                solvedWithoutHint: 0,
            },
            systemIntegrity: 100,
            streak: 0,
            isProfileSetup: false,
            username: '',
            favoriteLanguage: 'JavaScript',
            upgrades: {
                cheaperHints: false,
                strongerFirewall: false,
                streakStabilizer: false
            }
        };
    }

    load() {
        const savedState = localStorage.getItem(SAVE_KEY);
        if (savedState) {
            const parsed = JSON.parse(savedState);
            return { ...this.getInitialState(), ...parsed };
        }
        return this.getInitialState();
    }

    save() {
        localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
    }

    addXp(amount) {
        this.state.xp = Math.max(0, this.state.xp + amount);
        if (this.state.xp >= this.state.xpForNextLevel) {
            this.levelUp();
        }
        this.save();
    }

    levelUp() {
        this.state.level++;
        this.state.xp -= this.state.xpForNextLevel;
        this.state.xpForNextLevel = Math.floor(this.state.xpForNextLevel * 1.5);
    }
    
    markChallengeCompleted(moduleKey, challengeId) {
        if (!this.state.completedChallenges[moduleKey]) {
            this.state.completedChallenges[moduleKey] = [];
        }
        if (!this.state.completedChallenges[moduleKey].includes(challengeId)) {
            this.state.completedChallenges[moduleKey].push(challengeId);
        }
        this.save();
    }
    
    updateRank(moduleKey, totalModuleChallenges) {
        const completedInModule = this.state.completedChallenges[moduleKey]?.length || 0;
        if (completedInModule === totalModuleChallenges) {
            const rankMap = {
                "HTML": "syntaxSorcerer",
                "CSS": "logicWeaver",
                "JavaScript": "architectArcanist"
            };
            const newRank = rankMap[moduleKey];
            if (newRank && this.state.rank !== newRank) {
                this.state.rank = newRank;
                this.save();
                return newRank;
            }
        }
        return null;
    }
}