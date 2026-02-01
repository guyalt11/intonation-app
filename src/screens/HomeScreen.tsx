import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Image, Platform } from 'react-native';
import { Play, House, Rabbit, AudioWaveform, Library, Trophy, Settings } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getHighScores, HighScores } from '../utils/storage';

const GAMES = [
    {
        id: 1,
        title: "Basic Mode",
        icon: <Play size={24} color="white" />,
        colors: ['#a855f7', '#8b5cf6'] as const
    },
    {
        id: 2,
        title: "Fast Mode",
        icon: <Rabbit size={24} color="white" />,
        colors: ['#6366f1', '#4f46e5'] as const
    },
    {
        id: 3,
        title: "Drone Mode",
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
            colors={['#1a1a2e', '#0c0c0e']}
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
                    <View
                        style={styles.logoWrapper}
                    >
                        <Image
                            source={require('../../assets/logo.webp')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.appTitle}>EarTune</Text>
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
                                        <Text style={styles.cardTitle}>{game.title}</Text>
                                        {game.desc && <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={styles.cardDesc}>{game.desc}</Text>
                                        </View>}
                                        {highScores && highScores[`game${game.id}` as keyof HighScores] > 0 && (
                                            <View style={styles.bestScore}>
                                                <Trophy size={14} color="#f59e0b" />
                                                <Text style={styles.bestScoreText}>Best: Lvl {highScores[`game${game.id}` as keyof HighScores]}</Text>
                                            </View>
                                        )}
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
    logoWrapper: {
        position: 'absolute',
        top: -40,
        left: 20,
        padding: 10,
        zIndex: 10,
    },
    logo: {
        width: 30,
        height: 30,
    },
    appTitle: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#a855f7',
        fontFamily: Platform.OS === 'ios' ? 'Marker Felt' : 'sans-serif-condensed',
        textShadowColor: 'rgba(168, 85, 247, 0.4)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 10,
        letterSpacing: 2,
        transform: [{ rotate: '-4deg' }],
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
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
        marginRight: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.5)',
        lineHeight: 20,
    },
    bestScore: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    bestScoreText: {
        fontSize: 12,
        color: '#f59e0b',
        fontWeight: 'bold',
    },
    footer: {
        paddingTop: 20,
        paddingBottom: 40,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    footerText: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 12,
    },
});
