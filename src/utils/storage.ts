
import AsyncStorage from '@react-native-async-storage/async-storage';

const HIGH_SCORES_KEY = '@high_scores';
const SOUND_PREFERENCE_KEY = '@sound_preference';
const DIFFICULTY_PREFERENCE_KEY = '@difficulty_preference';
const PAUSE_DURATION_KEY = '@pause_duration';
const ADVANCE_MODE_KEY = '@advance_mode';
const SCALE_TYPE_KEY = '@scale_type';
const GAME4_SEQUENCE_KEY = '@game4_sequence';
const ONBOARDING_COMPLETED_KEY = '@onboarding_completed';
export interface HighScores {
    game1: number;
    game2: number;
    game3: number;
    game4: number;
    game5: number;
}

export type SoundType = 'sound1' | 'sound2' | 'sound3' | 'sound4' | 'sound5' | 'sound6' | 'sound7' | 'sound8' | 'sound9' | 'sound10' | 'sound11';
export type DifficultyMode = 'easy' | 'hard';
export type AdvanceMode = 'fast' | 'slow';
export type ScaleType = 'major' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'aeolian' | 'locrian' | 'harmonic_minor' | 'melodic_minor';

const defaultHighScores: HighScores = {
    game1: 0,
    game2: 0,
    game3: 0,
    game4: 0,
    game5: 0,
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
        return (value as SoundType) || 'sound1';
    } catch (e) {
        return 'sound1';
    }
};

export const saveSoundPreference = async (sound: SoundType): Promise<void> => {
    try {
        await AsyncStorage.setItem(SOUND_PREFERENCE_KEY, sound);
    } catch (e) {
        console.error('Failed to save sound preference', e);
    }
};

export const getDifficultyPreference = async (): Promise<DifficultyMode> => {
    try {
        const value = await AsyncStorage.getItem(DIFFICULTY_PREFERENCE_KEY);
        return (value as DifficultyMode) || 'easy';
    } catch (e) {
        return 'easy';
    }
};

export const saveDifficultyPreference = async (mode: DifficultyMode): Promise<void> => {
    try {
        await AsyncStorage.setItem(DIFFICULTY_PREFERENCE_KEY, mode);
    } catch (e) {
        console.error('Failed to save difficulty preference', e);
    }
};

export const getPauseDuration = async (): Promise<number> => {
    try {
        const value = await AsyncStorage.getItem(PAUSE_DURATION_KEY);
        return value != null ? parseInt(value, 10) : 100;
    } catch (e) {
        return 100;
    }
};

export const savePauseDuration = async (duration: number): Promise<void> => {
    try {
        await AsyncStorage.setItem(PAUSE_DURATION_KEY, duration.toString());
    } catch (e) {
        console.error('Failed to save pause duration', e);
    }
};

export const resetHighScores = async (): Promise<void> => {
    try {
        await AsyncStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(defaultHighScores));
    } catch (e) {
        console.error('Failed to reset high scores', e);
    }
};

export const getAdvanceModePreference = async (): Promise<AdvanceMode> => {
    try {
        const value = await AsyncStorage.getItem(ADVANCE_MODE_KEY);
        return (value as AdvanceMode) || 'slow';
    } catch (e) {
        return 'slow';
    }
};

export const saveAdvanceModePreference = async (mode: AdvanceMode): Promise<void> => {
    try {
        await AsyncStorage.setItem(ADVANCE_MODE_KEY, mode);
    } catch (e) {
        console.error('Failed to save advance mode preference', e);
    }
};

export const getScalePreference = async (): Promise<ScaleType> => {
    try {
        const value = await AsyncStorage.getItem(SCALE_TYPE_KEY);
        return (value as ScaleType) || 'major';
    } catch (e) {
        return 'major';
    }
};

export const saveScalePreference = async (scale: ScaleType): Promise<void> => {
    try {
        await AsyncStorage.setItem(SCALE_TYPE_KEY, scale);
    } catch (e) {
        console.error('Failed to save scale preference', e);
    }
};

export const getGame4Sequence = async (): Promise<number[]> => {
    try {
        const value = await AsyncStorage.getItem(GAME4_SEQUENCE_KEY);
        return value != null ? JSON.parse(value) : [5, 6, 7];
    } catch (e) {
        return [5, 6, 7];
    }
};

export const saveGame4Sequence = async (sequence: number[]): Promise<void> => {
    try {
        await AsyncStorage.setItem(GAME4_SEQUENCE_KEY, JSON.stringify(sequence));
    } catch (e) {
        console.error('Failed to save cadence preference', e);
    }
};

export const isOnboardingCompleted = async (): Promise<boolean> => {
    try {
        const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
        return value === 'true';
    } catch (e) {
        return false;
    }
};

export const setOnboardingCompleted = async (): Promise<void> => {
    try {
        await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    } catch (e) {
        console.error('Failed to save onboarding status', e);
    }
};
