
import AsyncStorage from '@react-native-async-storage/async-storage';

const HIGH_SCORES_KEY = '@high_scores';

export interface HighScores {
    game1: number;
    game2: number;
    game3: number;
    game4: number;
}

const defaultHighScores: HighScores = {
    game1: 0,
    game2: 0,
    game3: 0,
    game4: 0,
};

export const getHighScores = async (): Promise<HighScores> => {
    try {
        const jsonValue = await AsyncStorage.getItem(HIGH_SCORES_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : defaultHighScores;
    } catch (e) {
        console.error('Failed to load high scores', e);
        return defaultHighScores;
    }
};

export const saveHighScore = async (gameKey: keyof HighScores, score: number): Promise<void> => {
    try {
        const currentScores = await getHighScores();
        if (score > currentScores[gameKey]) {
            currentScores[gameKey] = score;
            const jsonValue = JSON.stringify(currentScores);
            await AsyncStorage.setItem(HIGH_SCORES_KEY, jsonValue);
        }
    } catch (e) {
        console.error('Failed to save high score', e);
    }
};
