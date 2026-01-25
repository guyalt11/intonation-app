
import AsyncStorage from '@react-native-async-storage/async-storage';

const HIGH_SCORES_KEY = '@high_scores';
const SOUND_PREFERENCE_KEY = '@sound_preference';

export interface HighScores {
    game1: number;
    game2: number;
    game3: number;
    game4: number;
}

export type SoundType = 'default' | 'piano' | 'guitar' | 'synth';

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

export const getSoundPreference = async (): Promise<SoundType> => {
    try {
        const value = await AsyncStorage.getItem(SOUND_PREFERENCE_KEY);
        return (value as SoundType) || 'default';
    } catch (e) {
        return 'default';
    }
};

export const saveSoundPreference = async (sound: SoundType): Promise<void> => {
    try {
        await AsyncStorage.setItem(SOUND_PREFERENCE_KEY, sound);
    } catch (e) {
        console.error('Failed to save sound preference', e);
    }
};
