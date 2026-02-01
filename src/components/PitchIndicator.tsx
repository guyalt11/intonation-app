
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Music, Zap } from 'lucide-react-native';
import { useEffect, useRef } from 'react';

interface Props {
    isPlaying: boolean;
    isCorrect: boolean | null;
    onPress?: () => void;
    isClickable?: boolean;
}

export default function PitchIndicator({ isPlaying, isCorrect, onPress, isClickable }: Props) {
    const Container = isClickable ? TouchableOpacity : View;
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isClickable && !isPlaying) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 0,
                        duration: 1500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    })
                ])
            ).start();
        } else {
            pulseAnim.setValue(0);
        }
    }, [isClickable, isPlaying, pulseAnim]);

    const glowStyle = {
        shadowColor: '#a855f7',
        shadowOpacity: pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1]
        }),
        shadowRadius: pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [10, 25]
        }),
        elevation: pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [5, 15]
        }),
        borderColor: pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(168, 85, 247, 0.5)', 'rgba(168, 85, 247, 1)']
        }),
        backgroundColor: pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(168, 85, 247, 0.1)', 'rgba(168, 85, 247, 0.3)']
        }),
        borderRadius: 60,
        borderWidth: 2,
    };

    return (
        <View style={styles.container}>
            <Animated.View style={isClickable && !isPlaying ? glowStyle : null}>
                <Container
                    activeOpacity={0.7}
                    onPress={onPress}
                    disabled={!isClickable || isPlaying}
                    style={[
                        styles.indicator,
                        isPlaying && styles.playing,
                        isClickable && !isPlaying && { borderWidth: 0, backgroundColor: 'transparent' }
                    ]}
                >
                    <Music size={40} color={isPlaying ? "#fff" : "rgba(255,255,255,0.3)"} />
                </Container>
            </Animated.View>

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
        borderWidth: 2,
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
