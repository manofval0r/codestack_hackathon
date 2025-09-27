export class ChallengeManager {
    constructor() {
        this.modules = {};
        this.moduleOrder = [];
    }

    async load() {
        const response = await fetch('./data/challenges.json');
        this.modules = await response.json();
        this.moduleOrder = Object.keys(this.modules);
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

    getTotalChallengeCount() {
        return Object.values(this.modules).reduce((total, module) => total + module.challenges.length, 0);
    }

    getCompletedChallengeCount(completedChallenges) {
        return Object.values(completedChallenges).flat().length;
    }

    validateSolution(challenge, submittedSolution) {
        const solution = challenge.solution.trim().toLowerCase();
        const submitted = submittedSolution.trim().toLowerCase();
        return solution.replace(/[{};]/g, '') === submitted.replace(/[{};]/g, '');
    }
}