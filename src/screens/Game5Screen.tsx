import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GameHeader from '../components/GameHeader';
import PitchIndicator from '../components/PitchIndicator';
import AnswerButtons from '../components/AnswerButtons';
import GameOver from '../components/GameOver';
import { useAudio } from '../context/AudioContext';
import { saveHighScore, getDifficultyPreference, DifficultyMode, getPauseDuration, getAdvanceModePreference, AdvanceMode } from '../utils/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BUTTON_GAP = 8;
const GRID_PADDING = 20;
const BUTTON_SIZE = Math.floor((SCREEN_WIDTH - (GRID_PADDING * 2) - (BUTTON_GAP * 3)) / 4) - 2;

const MIN_FREQ = 130.81;
const MAX_FREQ = 1046.5;

const DELTA_SEMITONES_START = 0.8;
const DELTA_SEMITONES_MIN = 0.05;
const K_FACTOR = 0.12;

interface Props {
    onExit: () => void;
}

const SCALE_RATIOS = [
    1,
    Math.pow(2, 2 / 12),
    Math.pow(2, 4 / 12),
    Math.pow(2, 5 / 12),
    Math.pow(2, 7 / 12),
    Math.pow(2, 9 / 12),
    Math.pow(2, 11 / 12),
    Math.pow(2, 12 / 12),
];

export default function Game5Screen({ onExit }: Props) {
    const { playPitch, stopAll } = useAudio();

    const [gameState, setGameState] = useState<'playing' | 'gameover'>('playing');
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(3);

    const [notes, setNotes] = useState<number[]>([]);
    const [targetNote, setTargetNote] = useState(0);
    const [actualNote, setActualNote] = useState(0);
    const [errorIndex, setErrorIndex] = useState(0);

    const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(null);
    const [selectedDirection, setSelectedDirection] = useState<'u' | 'd' | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [canInput, setCanInput] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [difficulty, setDifficulty] = useState<DifficultyMode>('hard');
    const [advanceMode, setAdvanceMode] = useState<AdvanceMode>('fast');
    const [waitTime, setWaitTime] = useState<number | null>(null);

    const sequenceId = useRef(0);

    useEffect(() => {
        (async () => {
            setDifficulty(await getDifficultyPreference());
            setWaitTime(await getPauseDuration());
            setAdvanceMode(await getAdvanceModePreference());
        })();
    }, []);

    const generateNextLevel = (targetLevel: number) => {
        const root = Math.random() * (MAX_FREQ / 2.5 - MIN_FREQ * 1.1) + MIN_FREQ * 1.1;
        const wrongIdx = Math.floor(Math.random() * 7) + 1;
        setErrorIndex(wrongIdx);

        const delta =
            DELTA_SEMITONES_START * Math.exp(-K_FACTOR * targetLevel) +
            DELTA_SEMITONES_MIN;

        const ratio = Math.pow(2, delta / 12);
        const dir = Math.random() > 0.5 ? 'u' : 'd';

        const freqs = SCALE_RATIOS.map((r, i) => {
            const base = root * r;
            if (i === wrongIdx) {
                setTargetNote(base);
                const wrong = dir === 'u' ? base * ratio : base / ratio;
                setActualNote(wrong);
                return wrong;
            }
            return base;
        });

        setNotes(freqs);
        setIsCorrect(null);
        setSelectedNoteIndex(null);
        setSelectedDirection(null);
        setCanInput(false);
        setHasSubmitted(false);
    };

    const startGame = () => {
        setGameState('playing');
        setLevel(1);
        setLives(3);
        generateNextLevel(1);
    };

    const playSequence = async () => {
        if (isPlaying || !notes.length || waitTime === null) return;
        const id = ++sequenceId.current;

        setIsPlaying(true);
        setCanInput(false);

        for (const n of notes) {
            if (sequenceId.current !== id) break;
            await playPitch(n, 0.5);
            await new Promise(r => setTimeout(r, 450 + waitTime));
        }

        if (sequenceId.current === id) {
            if (!hasSubmitted) setCanInput(true);
            setIsPlaying(false);
        }
    };

    const handleNextManual = () => {
        if (!hasSubmitted || isCorrect === null) return;

        if (isCorrect) {
            const next = level + 1;
            setLevel(next);
            generateNextLevel(next);
        } else {
            if (lives <= 0) {
                setGameState('gameover');
            } else {
                generateNextLevel(level + 1);
            }
        }
    };

    const checkAnswer = (idx: number, dir: 'u' | 'd') => {
        const correctDir = actualNote > targetNote ? 'u' : 'd';
        const won = idx === errorIndex + 1 && dir === correctDir;

        setIsCorrect(won);
        setCanInput(false);
        setHasSubmitted(true);

        if (advanceMode === 'fast') {
            setTimeout(() => {
                if (won) {
                    const next = level + 1;
                    setLevel(next);
                    saveHighScore('game5', next);
                    generateNextLevel(next);
                } else {
                    const remaining = lives - 1;
                    setLives(remaining);
                    if (remaining <= 0) {
                        setGameState('gameover');
                        saveHighScore('game5', level);
                    } else {
                        generateNextLevel(level + 1);
                    }
                }
            }, 1200);
        } else {
            // Slow mode: save progress but don't auto-advance
            if (won) {
                saveHighScore('game5', level + 1);
            } else {
                const remaining = lives - 1;
                setLives(remaining);
                if (remaining <= 0) {
                    // Even in slow mode, if game over, go to game over screen after a delay
                    setTimeout(() => {
                        setGameState('gameover');
                        saveHighScore('game5', level);
                    }, 1200);
                }
            }
        }
    };

    const getNoteButtonStyle = (num: number) => {
        if (hasSubmitted) {
            if (num === errorIndex + 1) return styles.noteButtonCorrect;
            if (num === selectedNoteIndex) return styles.noteButtonWrong;
            return styles.noteButtonDisabled;
        }
        if (num === selectedNoteIndex) return styles.noteButtonSelected;
        return styles.noteButton;
    };

    useEffect(() => {
        startGame();
        return () => {
            sequenceId.current++;
            stopAll();
        };
    }, []);

    useEffect(() => {
        if (gameState === 'playing' && waitTime !== null) playSequence();
    }, [notes, waitTime]);

    const actualDir = actualNote > targetNote ? 'u' : 'd';

    return (
        <LinearGradient colors={['#1a1a2e', '#0c0c0e']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {gameState === 'playing' && (
                    <View style={styles.gameContent}>
                        <GameHeader level={level} lives={lives} onHome={onExit} />

                        <View style={styles.pitchContainer}>
                            <PitchIndicator
                                isPlaying={isPlaying}
                                isCorrect={isCorrect}
                                isClickable={(difficulty === 'easy' || (hasSubmitted && advanceMode === 'slow'))}
                                onPress={playSequence}
                            />

                            {hasSubmitted && advanceMode === 'slow' && lives > 0 && (
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

                        <View style={styles.controlsContainer}>
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Which note was tuned?</Text>

                                <View style={styles.noteGrid}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                        <TouchableOpacity
                                            key={num}
                                            style={getNoteButtonStyle(num)}
                                            disabled={!canInput || hasSubmitted || num === 1}
                                            onPress={() => {
                                                setSelectedNoteIndex(num);
                                                if (selectedDirection) checkAnswer(num, selectedDirection);
                                            }}
                                        >
                                            <Text
                                                style={
                                                    num === 1
                                                        ? styles.noteButtonTextDisabled
                                                        : styles.noteButtonText
                                                }
                                            >
                                                {num}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.sectionAnswer}>
                                <Text style={styles.sectionLabelAnswer}>Tuning direction?</Text>
                                <AnswerButtons
                                    onGuess={dir => {
                                        setSelectedDirection(dir);
                                        if (selectedNoteIndex) checkAnswer(selectedNoteIndex, dir);
                                    }}
                                    disabled={!canInput || hasSubmitted}
                                    lastGuess={selectedDirection}
                                    isCorrect={hasSubmitted ? selectedDirection === actualDir : null}
                                />
                            </View>
                        </View>
                    </View>
                )}

                {gameState === 'gameover' && (
                    <GameOver level={level} onRestart={startGame} onExit={onExit} />
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
        bottom: 20,
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

    controlsContainer: { paddingBottom: 20, gap: 20 },

    section: { gap: 12, paddingHorizontal: GRID_PADDING },
    sectionAnswer: { gap: 12 },

    sectionLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionLabelAnswer: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginLeft: 24,
    },

    noteGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: BUTTON_GAP,
        justifyContent: 'center',
    },

    noteButton: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    noteButtonSelected: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(99,102,241,0.2)',
        borderWidth: 2,
        borderColor: '#6366f1',
    },
    noteButtonCorrect: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(34,197,94,0.2)',
        borderWidth: 2,
        borderColor: '#22c55e',
    },
    noteButtonWrong: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239,68,68,0.2)',
        borderWidth: 2,
        borderColor: '#ef4444',
    },
    noteButtonDisabled: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },

    noteButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
    },
    noteButtonTextDisabled: {
        color: 'rgba(152,152,152,0.88)',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
    },
});
