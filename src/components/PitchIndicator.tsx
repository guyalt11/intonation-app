
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Music } from 'lucide-react-native';

interface Props {
    isPlaying: boolean;
    isCorrect: boolean | null;
}

export default function PitchIndicator({ isPlaying, isCorrect }: Props) {
    return (
        <View style={styles.container}>
            <View
                style={[
                    styles.indicator,
                    isPlaying && styles.playing
                ]}
            >
                <Music size={40} color={isPlaying ? "#fff" : "rgba(255,255,255,0.3)"} />
            </View>

            <View style={styles.feedbackContainer}>
                {isCorrect === true && <Text style={styles.correctText}>Correct!</Text>}
                {isCorrect === false && <Text style={styles.wrongText}>Wrong!</Text>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    indicator: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    playing: {
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        transform: [{ scale: 1.1 }]
    },
    feedbackContainer: {
        height: 40,
        marginTop: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    correctText: {
        color: '#22c55e',
        fontSize: 24,
        fontWeight: 'bold',
    },
    wrongText: {
        color: '#ef4444',
        fontSize: 24,
        fontWeight: 'bold',
    }
});
