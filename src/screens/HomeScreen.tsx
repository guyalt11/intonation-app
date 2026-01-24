import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Play, Music, Shuffle, Waves, Activity, Trophy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getHighScores, HighScores } from '../utils/storage';

const GAMES = [
    {
        id: 1,
        title: "Basic Mode",
        desc: "Simple comparison",
        icon: <Shuffle size={24} color="white" />,
        colors: ['#a855f7', '#8b5cf6']
    },
    {
        id: 2,
        title: "Consecutive Mode",
        desc: "Each note becomes the next reference.",
        icon: <Waves size={24} color="white" />,
        colors: ['#6366f1', '#4f46e5']
    },
    {
        id: 3,
        title: "Drone Mode",
        desc: "A constant reference tone plays non-stop.",
        icon: <Music size={24} color="white" />,
        colors: ['#ec4899', '#d946ef']
    },
    {
        id: 4,
        title: "Cadence Mode",
        desc: "6-7-1 sequence detection.",
        icon: <Activity size={24} color="white" />,
        colors: ['#f59e0b', '#d97706']
    }
];

interface HomeProps {
    onStartGame: (gameId: number) => void;
}

export default function HomeScreen({ onStartGame }: HomeProps) {
    const [highScores, setHighScores] = useState<HighScores | null>(null);

    useEffect(() => {
        const loadScores = async () => {
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
                <View style={styles.header}>
                    <Text style={styles.title}>Intonation</Text>
                    <Text style={styles.subtitle}>Master your pitch perception</Text>
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
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={styles.cardDesc}>{game.desc}</Text>
                                        </View>
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
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#8b5cf6',
        textAlign: 'center',
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 18,
        marginTop: 8,
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
});
