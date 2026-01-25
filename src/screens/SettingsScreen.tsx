
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAudio } from '../context/AudioContext';
import { saveSoundPreference, SoundType } from '../utils/storage';

interface Props {
    onBack: () => void;
}

const SOUND_OPTIONS: { id: SoundType; label: string; icon: string }[] = [
    { id: 'default', label: 'Default (Sine/Tri)', icon: 'musical-notes' },
    { id: 'piano', label: 'Piano-ish', icon: 'musical-note' },
    { id: 'guitar', label: 'Guitar-ish', icon: 'pulse' },
    { id: 'synth', label: 'Retro Synth', icon: 'radio' },
];

export default function SettingsScreen({ onBack }: Props) {
    const { soundType, updateSoundType, playPitch } = useAudio();

    const handleSelectSound = async (type: SoundType) => {
        updateSoundType(type);
        await saveSoundPreference(type);
        // Play a test note
        playPitch(440, 0.5);
    };

    return (
        <LinearGradient colors={['#1a1a2e', '#0c0c0e']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Settings</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
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

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={20} color="#94a3b8" />
                        <Text style={styles.infoText}>
                            The selected sound will be used across all games.
                        </Text>
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
    },
    sectionTitle: {
        fontSize: 16,
        color: '#94a3b8',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
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
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 24,
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 8,
    },
    infoText: {
        flex: 1,
        color: '#94a3b8',
        fontSize: 12,
    },
});
