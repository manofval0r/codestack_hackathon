const achievementDB = {
    // Code Warrior Ranks
    SCRIPT_KIDDIE: {
        name: "Script Kiddie",
        description: "Complete your first challenge.",
        condition: (state) => Object.values(state.completedChallenges).flat().length >= 1
    },
    JUNIOR_DEV: {
        name: "Junior Dev",
        description: "Complete 5 challenges.",
        condition: (state) => Object.values(state.completedChallenges).flat().length >= 5
    },

    // Technical Skill Unlocks
    HTML_ARCHITECT: {
        name: "HTML Architect",
        description: "Master the HTML module.",
        condition: (state) => state.rank === 'syntaxSorcerer' // This rank is awarded on module completion
    },
    CSS_WIZARD: {
        name: "CSS Wizard",
        description: "Master the CSS module.",
        condition: (state) => state.rank === 'logicWeaver'
    },

    // AI Mastery
    PROMPT_PADAWAN: {
        name: "Prompt Padawan",
        description: "Use the AI hint system for the first time.",
        condition: (state) => state.stats.hintsUsed >= 1
    },

    // Debugging Detective Series
    COLD_CASE: {
        name: "Cold Case",
        description: "Solve a challenge without using any hints.",
        condition: (state) => state.stats.solvedWithoutHint >= 1
    }
};

export class AchievementManager {
    /**
     * Checks the entire list of achievements against the current game state.
     * @param {object} state - The current gameState object.
     * @returns {object|null} The achievement object that was just unlocked, or null.
     */
    checkAchievements(state) {
        // Loop through every achievement in our database
        for (const [key, achievement] of Object.entries(achievementDB)) {
            // Check if the achievement has *not* yet been unlocked
            if (!state.unlockedAchievements.includes(key)) {
                // If the condition for unlocking is met...
                if (achievement.condition(state)) {
                    return { key, ...achievement }; // Return the achievement to be unlocked
                }
            }
        }
        return null; // No new achievements
    }
}
