
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
    level: number;
    onRestart: () => void;
    onExit: () => void;
}

export default function GameOver({ level, onRestart, onExit }: Props) {
    return (
        <View
            style={styles.container}
        >
            <View style={styles.content}>
                <Text style={styles.title}>Game Over</Text>
                <Text style={styles.score}>Score: Level {level}</Text>
            </View>

            <View style={styles.buttons}>
                <TouchableOpacity onPress={onRestart} activeOpacity={0.8}>
                    <LinearGradient
                        colors={['#6366f1', '#4f46e5']}
                        style={styles.primaryButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.primaryButtonText}>Try Again</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={onExit} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>Back to Home</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        width: '100%',
    },
    content: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#ef4444',
        marginBottom: 16,
    },
    score: {
        fontSize: 24,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    buttons: {
        width: '100%',
        gap: 16,
    },
    primaryButton: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    secondaryButton: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    secondaryButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    }
});
