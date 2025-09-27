export class AIManager {
    constructor() {
        this.hints = {};
    }

    async load() {
        const response = await fetch('./data/hints.json');
        this.hints = await response.json();
    }

    async getHint(challengeId) {
        // Simulate network delay for realism
        await new Promise(resolve => setTimeout(resolve, 800));

        const challengeHints = this.hints[challengeId] || this.hints['default'];
        // For the demo, we'll just return the first hint.
        // A more advanced version could track how many times the user asked.
        const hint = challengeHints[0];

        return hint;
    }
}       