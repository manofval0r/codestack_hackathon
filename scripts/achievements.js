const achievementDB = {
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
    HTML_ARCHITECT: {
        name: "HTML Architect",
        description: "Master the HTML module.",
        condition: (state) => state.rank === 'syntaxSorcerer'
    },
    CSS_WIZARD: {
        name: "CSS Wizard",
        description: "Master the CSS module.",
        condition: (state) => state.rank === 'logicWeaver'
    },
    PROMPT_PADAWAN: {
        name: "Prompt Padawan",
        description: "Use the AI hint system for the first time.",
        condition: (state) => state.stats.hintsUsed >= 1
    },
    COLD_CASE: {
        name: "Cold Case",
        description: "Solve a challenge without using any hints.",
        condition: (state) => state.stats.solvedWithoutHint >= 1
    }
};

export class AchievementManager {
    checkAchievements(state) {
        for (const [key, achievement] of Object.entries(achievementDB)) {
            if (!state.unlockedAchievements.includes(key)) {
                if (achievement.condition(state)) {
                    return { key, ...achievement };
                }
            }
        }
        return null;
    }
}