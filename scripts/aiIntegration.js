export class AIManager {
    constructor() {
        this.hints = {};
    }

    async load() {
        const response = await fetch('./data/hints.json');
        this.hints = await response.json();
    }

    async getHint(challengeId) {
        await new Promise(resolve => setTimeout(resolve, 800));
        const challengeHints = this.hints[challengeId] || this.hints['default'];
        const hint = challengeHints[Math.floor(Math.random() * challengeHints.length)];
        return hint;
    }
}