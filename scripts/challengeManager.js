export class ChallengeManager {
    constructor() {
        this.modules = {};
        this.moduleOrder = [];
        this.allChallengesFlat = [];
    }

    async load() {
        const response = await fetch('./data/challenges.json');
        this.modules = await response.json();
        this.moduleOrder = Object.keys(this.modules);
        this.allChallengesFlat = this.moduleOrder.flatMap(key => 
            this.modules[key].challenges.map(c => ({...c, moduleKey: key}))
        );
    }

    getCurrentChallenge(completedChallenges) {
        for (const moduleKey of this.moduleOrder) {
            const module = this.modules[moduleKey];
            const completedInModule = completedChallenges[moduleKey] || [];
            
            for (const challenge of module.challenges) {
                if (!completedInModule.includes(challenge.id)) {
                    return { ...challenge, moduleKey };
                }
            }
        }
        return null;
    }
    
    getModule(moduleKey) {
        return this.modules[moduleKey];
    }

    getAllChallengesByModule() {
        return this.moduleOrder.map(key => ({
            key,
            ...this.modules[key]
        }));
    }

    getRandomChallenge() {
        if (this.allChallengesFlat.length === 0) return null;
        const nonBossChallenges = this.allChallengesFlat.filter(c => !c.isBoss);
        const randomIndex = Math.floor(Math.random() * nonBossChallenges.length);
        return nonBossChallenges[randomIndex];
    }

    getTotalChallengeCount() {
        return Object.values(this.modules).reduce((total, module) => total + module.challenges.length, 0);
    }

    getCompletedChallengeCount(completedChallenges) {
        return Object.values(completedChallenges).flat().length;
    }

    normalizeStringForComparison(str) {
        if (typeof str !== 'string') return '';
        return str
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/"/g, "'")
            .replace(/;\s*$/, "")
            .replace(/\s*\/>/g, '>');
    }

    validateSolution(challenge, submittedSolution, bossStage = -1) {
        let expectedSolution;
        if (bossStage !== -1 && challenge.isBoss) {
            expectedSolution = challenge.stages[bossStage].solution;
        } else {
            expectedSolution = challenge.solution;
        }
        
        const normalizedExpected = this.normalizeStringForComparison(expectedSolution);
        const normalizedSubmitted = this.normalizeStringForComparison(submittedSolution);
        
        return normalizedExpected === normalizedSubmitted;
    }
}