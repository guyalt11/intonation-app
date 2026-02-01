
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudio } from '../context/AudioContext.native';
import { saveSoundPreference, getDifficultyPreference, saveDifficultyPreference, getPauseDuration, savePauseDuration, resetHighScores, getAdvanceModePreference, saveAdvanceModePreference, getScalePreference, saveScalePreference, getGame4Sequence, saveGame4Sequence, SoundType, DifficultyMode, AdvanceMode, ScaleType } from '../utils/storage';
import { useState, useEffect } from 'react';
import PauseSlider from '../components/PauseSlider';

interface Props {
    onBack: () => void;
}

const SOUND_OPTIONS: { id: SoundType; label: string; icon: string }[] = [
    { id: 'sound1', label: 'Default', icon: 'bulb' },
    { id: 'sound5', label: 'Organ', icon: 'grid' },
    { id: 'sound10', label: 'Deep Organ', icon: 'reorder-four' },
    { id: 'sound6', label: 'E-Piano', icon: 'flash' },
    { id: 'sound4', label: 'Xylophone', icon: 'water' },
    { id: 'sound8', label: 'Space Bell', icon: 'planet' },
    { id: 'sound7', label: 'Chimes', icon: 'notifications' },
    { id: 'sound9', label: 'Celestial', icon: 'sparkles' },
    { id: 'sound11', label: 'Ethereal', icon: 'eye' },
    { id: 'sound3', label: 'Breeze', icon: 'leaf' },
    { id: 'sound2', label: 'Crystal', icon: 'diamond' },

];

const SCALE_OPTIONS: { id: ScaleType; label: string }[] = [
    { id: 'major', label: 'Major (Ionian)' },
    { id: 'dorian', label: 'Dorian' },
    { id: 'phrygian', label: 'Phrygian' },
    { id: 'lydian', label: 'Lydian' },
    { id: 'mixolydian', label: 'Mixolydian (Dominant)' },
    { id: 'aeolian', label: 'Minor (Aeolian)' },
    { id: 'locrian', label: 'Locrian' },
    { id: 'harmonic_minor', label: 'Harmonic Minor' },
    { id: 'melodic_minor', label: 'Melodic Minor' },
];

export default function SettingsScreen({ onBack }: Props) {
    const { soundType, updateSoundType, playPitch } = useAudio();
    const [difficulty, setDifficulty] = useState<DifficultyMode>('hard');
    const [advanceMode, setAdvanceMode] = useState<AdvanceMode>('fast');
    const [scaleType, setScaleType] = useState<ScaleType>('major');
    const [game4Sequence, setGame4Sequence] = useState<number[]>([5, 6, 7]);
    const [pauseDuration, setPauseDuration] = useState(100);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setDifficulty(await getDifficultyPreference());
        setAdvanceMode(await getAdvanceModePreference());
        setPauseDuration(await getPauseDuration());
        setScaleType(await getScalePreference());
        setGame4Sequence(await getGame4Sequence());
    };

    const handleSelectSound = async (type: SoundType) => {
        updateSoundType(type);
        await saveSoundPreference(type);
        // Play a test note using the NEW sound type explicitly
        playPitch(440, 0.5, type);
    };

    const handleSelectDifficulty = async (mode: DifficultyMode) => {
        setDifficulty(mode);
        await saveDifficultyPreference(mode);
    };

    const handleSelectAdvanceMode = async (mode: AdvanceMode) => {
        setAdvanceMode(mode);
        await saveAdvanceModePreference(mode);
    };

    const handleSelectScale = async (scale: ScaleType) => {
        setScaleType(scale);
        await saveScalePreference(scale);
    };

    const handleToggleGame4Note = async (note: number) => {
        const next = game4Sequence.includes(note)
            ? game4Sequence.filter(n => n !== note)
            : [...game4Sequence, note].sort((a, b) => a - b);
        setGame4Sequence(next);
        await saveGame4Sequence(next);
    };

    const handlePauseChange = (val: number) => {
        setPauseDuration(val);
    };

    const handlePauseSave = async (val: number) => {
        await savePauseDuration(val);
    };

    const playTestPause = async () => {
        // Play A4 (440Hz) followed by E5 (659.25Hz) with the current pause
        playPitch(440, 0.4);
        setTimeout(() => {
            playPitch(659.25, 0.4);
        }, 400 + pauseDuration);
    };

    const handleResetHighScores = () => {
        Alert.alert(
            "Reset Highscores",
            "Are you sure you want to reset all highscores? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    style: "destructive",
                    onPress: async () => {
                        await resetHighScores();
                        Alert.alert("Success", "All highscores have been reset.");
                    }
                }
            ]
        );
    };

    return (
        <LinearGradient colors={['#3D1141', '#1B0721', '#050505']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Settings</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.sectionTitle}>Difficulty</Text>
                    <View style={[styles.optionsContainer, { marginBottom: 32 }]}>
                        {(['easy', 'hard'] as DifficultyMode[]).map((mode) => (
                            <TouchableOpacity
                                key={mode}
                                style={[
                                    styles.optionCard,
                                    difficulty === mode && styles.selectedCard
                                ]}
                                onPress={() => handleSelectDifficulty(mode)}
                            >
                                <View style={styles.optionInfo}>
                                    <Ionicons
                                        name={mode === 'easy' ? 'cafe-outline' : 'flame-outline'}
                                        size={24}
                                        color={difficulty === mode ? '#a855f7' : '#94a3b8'}
                                    />
                                    <Text style={[
                                        styles.optionLabel,
                                        difficulty === mode && styles.selectedLabel
                                    ]}>
                                        {mode === 'easy' ? 'Easy (Allow Repeats)' : 'Hard (No Repeats)'}
                                    </Text>
                                </View>
                                {difficulty === mode && (
                                    <Ionicons name="checkmark-circle" size={20} color="#a855f7" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.sectionTitle}>Game Mode</Text>
                    <View style={[styles.optionsContainer, { marginBottom: 32 }]}>
                        {(['slow', 'fast'] as AdvanceMode[]).map((mode) => (
                            <TouchableOpacity
                                key={mode}
                                style={[
                                    styles.optionCard,
                                    advanceMode === mode && styles.selectedCard
                                ]}
                                onPress={() => handleSelectAdvanceMode(mode)}
                            >
                                <View style={styles.optionInfo}>
                                    <MaterialCommunityIcons
                                        name={mode === 'fast' ? 'rabbit' : 'turtle'}
                                        size={24}
                                        color={advanceMode === mode ? '#a855f7' : '#94a3b8'}
                                    />
                                    <Text style={[
                                        styles.optionLabel,
                                        advanceMode === mode && styles.selectedLabel
                                    ]}>
                                        {mode === 'fast' ? 'Fast (Auto-Next)' : 'Slow (Manual Next)'}
                                    </Text>
                                </View>
                                {advanceMode === mode && (
                                    <Ionicons name="checkmark-circle" size={20} color="#a855f7" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.sectionTitle}>Pause Between Notes</Text>
                    <PauseSlider
                        value={pauseDuration}
                        onValueChange={handlePauseChange}
                        onSlidingComplete={handlePauseSave}
                        onPlay={playTestPause}
                        min={0}
                        max={1000}
                    />
                    <View style={{ marginBottom: 32 }} />

                    <Text style={styles.sectionTitle}>Choose Sound</Text>

                    <View style={styles.optionsContainer}>
                        {SOUND_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.optionCard,
                                    soundType === option.id && styles.selectedCard
                                ]}
                                onPress={() => handleSelectSound(option.id)}
                            >
                                <View style={styles.optionInfo}>
                                    <Ionicons
                                        name={option.icon as any}
                                        size={24}
                                        color={soundType === option.id ? '#a855f7' : '#94a3b8'}
                                    />
                                    <Text style={[
                                        styles.optionLabel,
                                        soundType === option.id && styles.selectedLabel
                                    ]}>
                                        {option.label}
                                    </Text>
                                </View>
                                {soundType === option.id && (
                                    <Ionicons name="checkmark-circle" size={20} color="#a855f7" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={{ marginBottom: 32 }} />
                    <Text style={styles.sectionTitle}>Cadence Mode</Text>
                    <View style={[styles.sequenceContainer]}>
                        {[5, 6, 7, 1].map((note) => {
                            const isFixed = note === 1;
                            const isActive = isFixed || game4Sequence.includes(note);
                            return (
                                <TouchableOpacity
                                    key={note}
                                    activeOpacity={isFixed ? 1 : 0.7}
                                    style={[
                                        styles.sequenceButton,
                                        isActive && styles.sequenceButtonActive,
                                        isFixed && styles.sequenceButtonFixed
                                    ]}
                                    onPress={() => !isFixed && handleToggleGame4Note(note)}
                                >
                                    <Text style={[
                                        styles.sequenceButtonText,
                                        isActive && styles.sequenceButtonTextActive
                                    ]}>{note}</Text>
                                    {isFixed && (
                                        <Text style={styles.fixedLabel}>Fixed</Text>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View style={{ marginBottom: 32 }} />
                    <Text style={styles.sectionTitle}>Scale Mode</Text>
                    <View style={[styles.optionsContainer]}>
                        {SCALE_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.optionCard,
                                    scaleType === option.id && styles.selectedCard
                                ]}
                                onPress={() => handleSelectScale(option.id)}
                            >
                                <View style={styles.optionInfo}>
                                    <Ionicons
                                        name="musical-notes-outline"
                                        size={24}
                                        color={scaleType === option.id ? '#a855f7' : '#94a3b8'}
                                    />
                                    <Text style={[
                                        styles.optionLabel,
                                        scaleType === option.id && styles.selectedLabel
                                    ]}>
                                        {option.label}
                                    </Text>
                                </View>
                                {scaleType === option.id && (
                                    <Ionicons name="checkmark-circle" size={20} color="#a855f7" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.dangerZone}>
                        <Text style={styles.sectionTitleDanger}>Danger Zone</Text>
                        <TouchableOpacity
                            style={styles.resetButton}
                            onPress={handleResetHighScores}
                        >
                            <Ionicons name="trash-outline" size={24} color="#ef4444" />
                            <Text style={styles.resetButtonText}>Reset All Highscores</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: 'bold',
    },
    sectionTitleDanger: {
        fontSize: 14,
        color: '#ef4444',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: 'bold',
    },
    optionsContainer: {
        gap: 12,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    selectedCard: {
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderColor: '#a855f7',
    },
    optionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    optionLabel: {
        fontSize: 16,
        color: '#e2e8f0',
    },
    selectedLabel: {
        color: 'white',
        fontWeight: '600',
    },
    dangerZone: {
        marginTop: 48,
        paddingTop: 32,
        borderTopWidth: 1,
        borderTopColor: 'rgba(239, 68, 68, 0.2)',
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    resetButtonText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '600',
    },
    noteBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedNoteBadge: {
        backgroundColor: '#a855f7',
    },
    noteBadgeText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: 'bold',
    },
    selectedNoteBadgeText: {
        color: 'white',
    },
    sequenceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    sequenceButton: {
        flex: 1,
        height: 64,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    sequenceButtonActive: {
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        borderColor: '#a855f7',
    },
    sequenceButtonFixed: {
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderColor: 'rgba(168, 85, 247, 0.4)',
    },
    sequenceButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#94a3b8',
    },
    sequenceButtonTextActive: {
        color: 'white',
    },
    fixedLabel: {
        fontSize: 8,
        color: '#a855f7',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        position: 'absolute',
        bottom: 8,
    },
});

