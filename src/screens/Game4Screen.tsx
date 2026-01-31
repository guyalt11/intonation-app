
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GameHeader from '../components/GameHeader';
import PitchIndicator from '../components/PitchIndicator';
import AnswerButtons from '../components/AnswerButtons';
import GameOver from '../components/GameOver';
import { useAudio } from '../context/AudioContext';
import { saveHighScore, getDifficultyPreference, DifficultyMode, getPauseDuration, getAdvanceModePreference, AdvanceMode, getGame4Sequence } from '../utils/storage';

const MIN_FREQ = 130.81;
const MAX_FREQ = 1046.50;

const DELTA_SEMITONES_START = 0.8;
const DELTA_SEMITONES_MIN = 0.05;
const K_FACTOR = 0.15;

interface Props {
    onExit: () => void;
}

const GET_RATIO = (note: number) => {
    // 1 is target (0 semitones relative to itself)
    // 7 is -1st
    // 6 is -3st
    // 5 is -5st
    switch (note) {
        case 7: return Math.pow(2, -1 / 12);
        case 6: return Math.pow(2, -3 / 12);
        case 5: return Math.pow(2, -5 / 12);
        default: return 1;
    }
};

export default function Game4Screen({ onExit }: Props) {
    const { playPitch, stopAll, stopPitches } = useAudio();
    const [gameState, setGameState] = useState<'playing' | 'gameover'>('playing');
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(3);

    const [targetFreq, setTargetFreq] = useState(0);
    const [actualFreq, setActualFreq] = useState(0);
    const [sequenceFreqs, setSequenceFreqs] = useState<number[]>([]);

    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [lastGuess, setLastGuess] = useState<'u' | 'd' | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [canInput, setCanInput] = useState(false);
    const [difficulty, setDifficulty] = useState<DifficultyMode>('hard');
    const [advanceMode, setAdvanceMode] = useState<AdvanceMode>('fast');
    const [sequence, setSequence] = useState<number[]>([5, 6, 7]);
    const [waitTime, setWaitTime] = useState<number | null>(null);

    const sequenceId = useRef(0);



    const generateNextLevel = (targetLevel: number, currentSeq?: number[]) => {
        const activeSeq = currentSeq || sequence;
        const safeMin = MIN_FREQ * 1.3; // Give more room for lower notes (5, 6, 7)
        const safeMax = MAX_FREQ / 1.5;

        const target = Math.random() * (safeMax - safeMin) + safeMin;

        const safeSeq = Array.isArray(activeSeq) ? activeSeq : [5, 6, 7];
        const freqs = safeSeq.map(note => target * GET_RATIO(note));
        setSequenceFreqs(freqs);

        const deltaSemitones =
            DELTA_SEMITONES_START * Math.exp(-K_FACTOR * targetLevel) +
            DELTA_SEMITONES_MIN;

        const errorRatio = Math.pow(2, deltaSemitones / 12);

        let direction = Math.random() > 0.5 ? 'u' : 'd';
        const actual = direction === 'u' ? target * errorRatio : target / errorRatio;

        setTargetFreq(target);
        setActualFreq(actual);

        setIsCorrect(null);
        setLastGuess(null);
        setCanInput(false);
    };

    const startGame = (currentSeq?: number[]) => {
        sequenceId.current++;
        stopAll();
        setGameState('playing');
        setLevel(1);
        setLives(3);
        generateNextLevel(1, currentSeq);
    };

    const playSequence = async () => {
        if (isPlaying || waitTime === null) return;
        const id = ++sequenceId.current;
        const dur = 600;
        const durLast = 800;

        setIsPlaying(true);
        // setCanInput(false);

        try {
            // Play sequence notes (5, 6, 7 as selected)
            for (const f of sequenceFreqs) {
                if (sequenceId.current !== id) return;
                await playPitch(f, dur / 1000);
                await new Promise(r => setTimeout(r, Math.max(0, dur + waitTime - 50)));
            }

            // Final note (actualFreq) - it's the 1st
            if (sequenceId.current !== id) return;
            if (isCorrect === null) setCanInput(true);
            await playPitch(actualFreq, durLast / 1000);
            await new Promise(r => setTimeout(r, durLast));
        } finally {
            if (sequenceId.current === id) {
                setIsPlaying(false);
            }
        }
    };

    const handleNextManual = () => {
        sequenceId.current++;
        setIsPlaying(false);
        stopAll();
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
        sequenceId.current++;
        setIsPlaying(false);
        stopAll();
        if (!canInput) return;

        const actualDirection = actualFreq > targetFreq ? 'u' : 'd';
        const won = guess === actualDirection;

        setIsCorrect(won);
        setLastGuess(guess);
        setCanInput(false);

        if (advanceMode === 'fast') {
            setTimeout(() => {
                if (won) {
                    sequenceId.current++;
                    const next = level + 1;
                    setLevel(next);
                    generateNextLevel(next);
                } else {
                    const remaining = lives - 1;
                    setLives(remaining);
                    if (remaining <= 0) {
                        sequenceId.current++;
                        setGameState('gameover');
                        saveHighScore('game4', level);
                    } else {
                        sequenceId.current++;
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
                        sequenceId.current++;
                        setGameState('gameover');
                        saveHighScore('game4', level);
                    }, 800);
                }
            } else {
                saveHighScore('game4', level + 1);
            }
        }
    };

    const handleExit = () => {
        sequenceId.current++;
        stopAll();
        onExit();
    };

    useEffect(() => {
        const init = async () => {
            const diffPref = await getDifficultyPreference();
            setDifficulty(diffPref);
            const pausePref = await getPauseDuration();
            setWaitTime(pausePref);
            const flowPref = await getAdvanceModePreference();
            setAdvanceMode(flowPref);
            const seqPref = await getGame4Sequence();
            setSequence(seqPref);
            startGame(seqPref);
        };
        init();
        return () => {
            sequenceId.current++;
            stopAll();
        };
    }, []);

    useEffect(() => {
        if (gameState === 'playing' && targetFreq && waitTime !== null) {
            playSequence();
        }
    }, [targetFreq, gameState, waitTime]);

    const bgDark = ['#1a1a2e', '#0c0c0e'] as const;

    return (
        <LinearGradient colors={bgDark} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {gameState === 'playing' && (
                    <View style={styles.gameContent}>
                        <GameHeader level={level} lives={lives} onHome={handleExit} />

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
                    <GameOver level={level} onRestart={startGame} onExit={handleExit} />
                )}
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    gameContent: { flex: 1, justifyContent: 'space-between' },
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
