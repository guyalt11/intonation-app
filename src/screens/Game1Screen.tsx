
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GameHeader from '../components/GameHeader';
import PitchIndicator from '../components/PitchIndicator';
import AnswerButtons from '../components/AnswerButtons';
import GameOver from '../components/GameOver';
import { useAudio } from '../context/AudioContext';
import { saveHighScore, getDifficultyPreference, DifficultyMode, getPauseDuration, getAdvanceModePreference, AdvanceMode } from '../utils/storage';

const MIN_FREQ = 130.81;   // C3
const MAX_FREQ = 1046.50;  // C6

// Difficulty model (logarithmic)
const DELTA_SEMITONES_START = 4;
const DELTA_SEMITONES_MIN = 0.1;
const K_FACTOR = 0.2;

interface Props {
    onExit: () => void;
}

export default function Game1Screen({ onExit }: Props) {
    const { playPitch, stopAll } = useAudio();
    const [gameState, setGameState] = useState<'playing' | 'gameover'>('playing');
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(3);
    const [firstFreq, setFirstFreq] = useState(0);
    const [secondFreq, setSecondFreq] = useState(0);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [lastGuess, setLastGuess] = useState<'u' | 'd' | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [canInput, setCanInput] = useState(false);
    const [difficulty, setDifficulty] = useState<DifficultyMode>('hard');
    const [advanceMode, setAdvanceMode] = useState<AdvanceMode>('fast');
    const [waitTime, setWaitTime] = useState<number | null>(null);

    useEffect(() => {
        const loadPrefs = async () => {
            const diffPref = await getDifficultyPreference();
            setDifficulty(diffPref);
            const pausePref = await getPauseDuration();
            setWaitTime(pausePref);
            const flowPref = await getAdvanceModePreference();
            setAdvanceMode(flowPref);
        };
        loadPrefs();
    }, []);

    const generateNextLevel = (targetLevel: number) => {
        const safeMin = MIN_FREQ * 1.1;
        const safeMax = MAX_FREQ / 1.1;

        const f1 = Math.random() * (safeMax - safeMin) + safeMin;

        const deltaSemitones =
            DELTA_SEMITONES_START * Math.exp(-K_FACTOR * targetLevel) +
            DELTA_SEMITONES_MIN;

        const ratio = Math.pow(2, deltaSemitones / 12);

        let direction;
        if (f1 * ratio > MAX_FREQ) direction = 'd';
        else if (f1 / ratio < MIN_FREQ) direction = 'u';
        else direction = Math.random() > 0.5 ? 'u' : 'd';

        const f2 = direction === 'u' ? f1 * ratio : f1 / ratio;
        setFirstFreq(f1);
        setSecondFreq(f2);
        setIsCorrect(null);
        setLastGuess(null);
        setCanInput(false);
    };

    const startGame = () => {
        setGameState('playing');
        setLevel(1);
        setLives(3);
        generateNextLevel(1);
    };

    const playSequence = async () => {
        if (isPlaying || waitTime === null) return;
        const dur = 500;

        setIsPlaying(true);
        setCanInput(false);
        await playPitch(firstFreq, dur / 1000);

        await new Promise(r => setTimeout(r, Math.max(0, dur + waitTime - 50)));

        await playPitch(secondFreq, dur / 1000);
        await new Promise(r => setTimeout(r, dur));

        setIsPlaying(false);
        if (isCorrect === null) setCanInput(true);
    };

    const handleNextManual = () => {
        if (isCorrect === null) return;

        if (isCorrect) {
            const next = level + 1;
            setLevel(next);
            generateNextLevel(next);
        } else {
            if (lives <= 0) {
                setGameState('gameover');
            } else {
                const next = level + 1;
                setLevel(next);
                generateNextLevel(next);
            }
        }
    };

    const handleGuess = (guess: 'u' | 'd') => {
        if (!canInput) return;

        const actual = secondFreq > firstFreq ? 'u' : 'd';
        const won = guess === actual;

        setIsCorrect(won);
        setLastGuess(guess);
        setCanInput(false);

        if (advanceMode === 'fast') {
            setTimeout(() => {
                if (won) {
                    const next = level + 1;
                    setLevel(next);
                    generateNextLevel(next);
                } else {
                    const remaining = lives - 1;
                    setLives(remaining);
                    if (remaining <= 0) {
                        setGameState('gameover');
                        saveHighScore('game1', level);
                    } else {
                        const next = level + 1;
                        setLevel(next);
                        generateNextLevel(next);
                    }
                }
            }, 800);
        } else {
            // Slow mode
            if (!won) {
                const remaining = lives - 1;
                setLives(remaining);
                if (remaining <= 0) {
                    setTimeout(() => {
                        setGameState('gameover');
                        saveHighScore('game1', level);
                    }, 800);
                }
            } else {
                saveHighScore('game1', level + 1);
            }
        }
    };

    const handleExit = () => {
        stopAll();
        onExit();
    };

    useEffect(() => {
        startGame();
        return () => stopAll();
    }, []);

    useEffect(() => {
        if (gameState === 'playing' && firstFreq && waitTime !== null) {
            playSequence();
        }
    }, [firstFreq, gameState, waitTime]);

    // Gradient colors for Game 1
    const bgColors = ['#a855f7', '#8b5cf6'];
    // Darker version for background
    const bgDark = ['#1a1a2e', '#0c0c0e'] as const;

    return (
        <LinearGradient colors={bgDark} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {gameState === 'playing' && (
                    <View style={styles.gameContent}>
                        <GameHeader
                            level={level}
                            lives={lives}
                            onHome={handleExit}
                        />

                        <View style={styles.pitchContainer}>
                            <PitchIndicator
                                isPlaying={isPlaying}
                                isCorrect={isCorrect}
                                isClickable={(difficulty === 'easy' || (isCorrect !== null && advanceMode === 'slow')) && (canInput || isCorrect !== null)}
                                onPress={playSequence}
                            />

                            {isCorrect !== null && advanceMode === 'slow' && lives > 0 && (
                                <TouchableOpacity
                                    style={styles.nextButton}
                                    onPress={handleNextManual}
                                >
                                    <LinearGradient
                                        colors={['#6366f1', '#4f46e5']}
                                        style={styles.nextButtonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <Text style={styles.nextButtonText}>Next Level</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                        </View>

                        <AnswerButtons
                            onGuess={handleGuess}
                            disabled={!canInput}
                            lastGuess={lastGuess}
                            isCorrect={isCorrect}
                        />
                    </View>
                )}

                {gameState === 'gameover' && (
                    <GameOver
                        level={level}
                        onRestart={startGame}
                        onExit={handleExit}
                    />
                )}
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
    gameContent: {
        flex: 1,
        justifyContent: 'space-between',
    },
    pitchContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    nextButton: {
        position: 'absolute',
        bottom: 150,
        width: '60%',
        height: 50,
        zIndex: 10,
    },
    nextButtonGradient: {
        flex: 1,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    nextButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
