
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Music, RotateCcw } from 'lucide-react-native';

interface Props {
    isPlaying: boolean;
    isCorrect: boolean | null;
    onPress?: () => void;
    isClickable?: boolean;
}

export default function PitchIndicator({ isPlaying, isCorrect, onPress, isClickable }: Props) {
    const Container = isClickable ? TouchableOpacity : View;

    return (
        <View style={styles.container}>
            <Container
                activeOpacity={0.7}
                onPress={onPress}
                disabled={!isClickable || isPlaying}
                style={[
                    styles.indicator,
                    isPlaying && styles.playing,
                    isClickable && styles.clickable
                ]}
            >
                {isClickable && !isPlaying && (
                    <View style={styles.repeatIcon}>
                        <RotateCcw size={16} color="rgba(255,255,255,0.4)" />
                    </View>
                )}
                <Music size={40} color={isPlaying ? "#fff" : (isClickable ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)")} />
            </Container>

            <View style={styles.feedbackContainer}>
                {isCorrect === true && <Text style={styles.correctText}>Correct!</Text>}
                {isCorrect === false && <Text style={styles.wrongText}>Wrong!</Text>}
                {isClickable && !isPlaying && isCorrect === null && (
                    <Text style={styles.tapText}>Tap to repeat</Text>
                )}
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
    },
    clickable: {
        borderColor: 'rgba(99, 102, 241, 0.4)',
        borderStyle: 'dashed',
    },
    repeatIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    tapText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginTop: 4,
    }
});
