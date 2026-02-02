import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Image, Platform, PanResponder, Animated } from 'react-native';
import { Play, House, Rabbit, AudioWaveform, Library, Trophy, Settings } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getHighScores, HighScores } from '../utils/storage';

const GAMES = [
    {
        id: 1,
        title: "Basic Mode",
        desc: "Compare 2nd note to 1st note.",
        icon: <Play size={24} color="white" />,
        colors: ['#a855f7', '#8b5cf6'] as const
    },
    {
        id: 2,
        title: "Fast Mode",
        desc: "Always relative to the previous note.",
        icon: <Rabbit size={24} color="white" />,
        colors: ['#6366f1', '#4f46e5'] as const
    },
    {
        id: 3,
        title: "Drone Mode",
        desc: "Compare the notes to a drone.",
        icon: <AudioWaveform size={24} color="white" />,
        colors: ['#ec4899', '#d946ef'] as const
    },
    {
        id: 4,
        title: "Cadence Mode",
        desc: "Last note is out of tune.",
        icon: <House size={24} color="white" />,
        colors: ['#f59e0b', '#d97706'] as const
    },
    {
        id: 5,
        title: "Scale Mode",
        desc: "Find the out of tune note.",
        icon: <Library size={24} color="white" />,
        colors: ['#10b981', '#059669'] as const
    }
];

interface HomeProps {
    onStartGame: (gameId: number) => void;
    onOpenSettings: () => void;
}

export default function HomeScreen({ onStartGame, onOpenSettings }: HomeProps) {
    const [highScores, setHighScores] = useState<HighScores | null>(null);
    const rotation = useRef(new Animated.Value(0)).current;

    // We use a ref to track the last committed rotation value to avoid jumps
    const lastRotation = useRef(0);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                // Map horizontal movement (dx) to rotation degrees
                // Dragging 100px = roughly 10 degrees change
                let nextRotation = lastRotation.current + (gestureState.dx / 10);

                // Clamp between -15 and 15
                nextRotation = Math.max(-15, Math.min(15, nextRotation));

                rotation.setValue(nextRotation);
            },
            onPanResponderRelease: (_, gestureState) => {
                // Save the current rotation as the new baseline
                let finalRotation = lastRotation.current + (gestureState.dx / 10);
                lastRotation.current = Math.max(-15, Math.min(15, finalRotation));
            },
        })
    ).current;

    useEffect(() => {
        const loadScores = async () => {
            console.log('Fetching high scores in HomeScreen...');
            const scores = await getHighScores();
            setHighScores(scores);
        };
        loadScores();
    }, []);

    return (
        <LinearGradient
            colors={['#050505', '#1B0721', '#3D1141']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.header, { position: 'relative' }]}>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={onOpenSettings}
                    >
                        <Settings size={28} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>

                    <Animated.View
                        {...panResponder.panHandlers}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 14,
                            transform: [{
                                rotate: rotation.interpolate({
                                    inputRange: [-15, 15],
                                    outputRange: ['-15deg', '15deg']
                                })
                            }]
                        }}
                    >
                        <Image
                            source={require('../../assets/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.appTitle}>EarTune</Text>
                    </Animated.View>
                </View>

                <ScrollView contentContainerStyle={styles.gamesList}>
                    {GAMES.map((game, i) => (
                        <View
                            key={game.id}
                        >
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => onStartGame(game.id)}
                            >
                                <View style={styles.card}>
                                    <LinearGradient
                                        colors={game.colors}
                                        style={styles.iconContainer}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        {game.icon}
                                    </LinearGradient>
                                    <View style={styles.cardContent}>
                                        <View style={styles.titleRow}>
                                            <Text style={styles.cardTitle}>{game.title}</Text>
                                            {highScores && highScores[`game${game.id}` as keyof HighScores] > 0 && (
                                                <View style={styles.bestScore}>
                                                    <Trophy size={12} color="#f59e0b" />
                                                    <Text style={styles.bestScoreText}>Best : Lvl {highScores[`game${game.id}` as keyof HighScores]}</Text>
                                                </View>
                                            )}
                                        </View>
                                        {game.desc && <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={styles.cardDesc}>{game.desc}</Text>
                                        </View>}
                                    </View>
                                    <Play size={20} color="rgba(255,255,255,0.3)" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        © {new Date().getFullYear()} Guy Altmann. All rights reserved.
                    </Text>
                </View>
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
        marginTop: 60,
        marginBottom: 40,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    settingsButton: {
        position: 'absolute',
        top: -40,
        right: 20,
        padding: 12,
        zIndex: 10,
    },
    logo: {
        width: 40,
        height: 40,
    },
    appTitle: {
        fontSize: 42,
        color: '#a855f7',
        fontFamily: 'LuckiestGuy',
        textShadowColor: 'rgba(177, 55, 234, 0.71)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 10,
        letterSpacing: 2,
    },
    gamesList: {
        paddingHorizontal: 20,
        gap: 16,
        paddingBottom: 40,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
        marginRight: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    cardTitle: {
        fontSize: 16,
        fontFamily: 'Outfit-Bold',
        color: 'white',
        flex: 1,
    },
    cardDesc: {
        fontSize: 14,
        fontFamily: 'Fredoka-Regular',
        color: 'rgba(255, 255, 255, 0.6)',
        lineHeight: 20,
    },
    bestScore: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    bestScoreText: {
        fontSize: 11,
        color: '#f59e0b',
        fontFamily: 'Fredoka-Bold',
    },
    footer: {
        paddingTop: 20,
        paddingBottom: 45,
        alignItems: 'center',
    },
    footerText: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 12,
        fontFamily: 'Fredoka-Regular',
    },
});
