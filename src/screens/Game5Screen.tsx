
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GameHeader from '../components/GameHeader';
import PitchIndicator from '../components/PitchIndicator';
import AnswerButtons from '../components/AnswerButtons';
import GameOver from '../components/GameOver';
import { useAudio } from '../context/AudioContext';
import { saveHighScore, getDifficultyPreference, DifficultyMode } from '../utils/storage';

const MIN_FREQ = 130.81;
const MAX_FREQ = 1046.50;

const DELTA_SEMITONES_START = 0.8;
const DELTA_SEMITONES_MIN = 0.05;
const K_FACTOR = 0.12;

interface Props {
    onExit: () => void;
}

const SCALE_RATIOS = [
    1,              // 1
    Math.pow(2, 2 / 12),  // 2
    Math.pow(2, 4 / 12),  // 3
    Math.pow(2, 5 / 12),  // 4
    Math.pow(2, 7 / 12),  // 5
    Math.pow(2, 9 / 12),  // 6
    Math.pow(2, 11 / 12), // 7
    Math.pow(2, 12 / 12), // 8
];

export default function Game5Screen({ onExit }: Props) {
    const { playPitch } = useAudio();
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

    useEffect(() => {
        const loadDiff = async () => {
            const pref = await getDifficultyPreference();
            setDifficulty(pref);
        };
        loadDiff();
    }, []);

    const generateNextLevel = (targetLevel: number) => {
        const safeMin = MIN_FREQ * 1.1;
        const safeMax = MAX_FREQ / 2.5;

        const root = Math.random() * (safeMax - safeMin) + safeMin;

        // Pick which note will be out of tune (random index 1 to 7)
        const wrongIdx = Math.floor(Math.random() * 7) + 1;
        setErrorIndex(wrongIdx);

        const deltaSemitones =
            DELTA_SEMITONES_START * Math.exp(-K_FACTOR * targetLevel) +
            DELTA_SEMITONES_MIN;

        const errorRatio = Math.pow(2, deltaSemitones / 12);
        let direction = Math.random() > 0.5 ? 'u' : 'd';

        const scaleFreqs = SCALE_RATIOS.map((ratio, i) => {
            const baseFreq = root * ratio;
            if (i === wrongIdx) {
                setTargetNote(baseFreq);
                const wrongFreq = direction === 'u' ? baseFreq * errorRatio : baseFreq / errorRatio;
                setActualNote(wrongFreq);
                return wrongFreq;
            }
            return baseFreq;
        });

        setNotes(scaleFreqs);
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
        if (isPlaying || notes.length === 0) return;

        setIsPlaying(true);
        setCanInput(false);

        for (let i = 0; i < notes.length; i++) {
            playPitch(notes[i], 0.5);
            await new Promise(r => setTimeout(r, 500 + 80));
        }

        if (!hasSubmitted) setCanInput(true);
        setIsPlaying(false);
    };

    const checkFullAnswer = (index: number | null, dir: 'u' | 'd' | null) => {
        if (index === null || dir === null) return;

        const actualDirection = actualNote > targetNote ? 'u' : 'd';
        const isNoteCorrect = index === (errorIndex + 1);
        const isDirCorrect = dir === actualDirection;
        const won = isNoteCorrect && isDirCorrect;

        setIsCorrect(won);
        setCanInput(false);
        setHasSubmitted(true);
    };

    const handleNoteSelect = (index: number) => {
        if (!canInput || hasSubmitted) return;
        setSelectedNoteIndex(index);
        checkFullAnswer(index, selectedDirection);
    };

    const handleDirSelect = (dir: 'u' | 'd') => {
        if (!canInput || hasSubmitted) return;
        setSelectedDirection(dir);
        checkFullAnswer(selectedNoteIndex, dir);
    };

    const handleNext = () => {
        if (isCorrect) {
            const next = level + 1;
            setLevel(next);
            generateNextLevel(next);
        } else {
            const remaining = lives - 1;
            setLives(remaining);
            if (remaining <= 0) {
                setGameState('gameover');
                saveHighScore('game5', level);
            } else {
                generateNextLevel(level); // Stay at the same level if incorrect
            }
        }
    };

    useEffect(() => {
        startGame();
    }, []);

    useEffect(() => {
        if (gameState === 'playing' && notes.length > 0) {
            playSequence();
        }
    }, [notes, gameState]);

    const getNoteButtonStyle = (idx: number) => {
        const num = idx + 1;
        const isErrorPos = num === (errorIndex + 1);
        const isSelected = num === selectedNoteIndex;

        if (hasSubmitted) {
            if (isErrorPos) return styles.noteButtonCorrect;
            if (isSelected) return styles.noteButtonWrong;
            return styles.noteButtonDisabled;
        }

        if (isSelected) return styles.noteButtonSelected;
        return styles.noteButton;
    };

    const getDirButtonStyle = (dir: 'u' | 'd') => {
        const actualDir = actualNote > targetNote ? 'u' : 'd';
        const isSelected = selectedDirection === dir;

        if (hasSubmitted) {
            if (dir === actualDir) return styles.dirButtonCorrect;
            if (isSelected) return styles.dirButtonWrong;
            return styles.dirButtonDisabled;
        }

        if (isSelected) return styles.dirButtonSelected;
        return styles.dirButton;
    };

    const bgDark = ['#1a1a2e', '#0c0c0e'] as const;

    return (
        <LinearGradient colors={bgDark} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {gameState === 'playing' && (
                    <View style={styles.gameContent}>
                        <GameHeader level={level} lives={lives} onHome={onExit} />

                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <PitchIndicator
                                isPlaying={isPlaying}
                                isCorrect={isCorrect}
                                isClickable={difficulty === 'easy' && (canInput || hasSubmitted)}
                                onPress={playSequence}
                            />
                        </View>

                        <View style={styles.controlsContainer}>
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Which note?</Text>
                                <View style={styles.noteGrid}>
                                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                                        <TouchableOpacity
                                            key={i}
                                            style={getNoteButtonStyle(i)}
                                            onPress={() => handleNoteSelect(i + 1)}
                                            disabled={!canInput || hasSubmitted}
                                        >
                                            <Text style={styles.noteButtonText}>{i + 1}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Tuning?</Text>
                                <View style={styles.dirRow}>
                                    <TouchableOpacity
                                        style={getDirButtonStyle('u')}
                                        onPress={() => handleDirSelect('u')}
                                        disabled={!canInput || hasSubmitted}
                                    >
                                        <Text style={styles.dirButtonText}>Higher</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={getDirButtonStyle('d')}
                                        onPress={() => handleDirSelect('d')}
                                        disabled={!canInput || hasSubmitted}
                                    >
                                        <Text style={styles.dirButtonText}>Lower</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {hasSubmitted && (
                                <View style={styles.postAnswerContainer}>
                                    <TouchableOpacity
                                        style={styles.nextButton}
                                        onPress={handleNext}
                                    >
                                        <Text style={styles.nextButtonText}>Next Question</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
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
    controlsContainer: {
        paddingBottom: 40,
        paddingHorizontal: 20,
        gap: 24,
    },
    section: {
        gap: 12,
    },
    sectionLabel: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    noteGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    noteButton: {
        width: '22%',
        aspectRatio: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    noteButtonSelected: {
        width: '22%',
        aspectRatio: 1,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#6366f1',
    },
    noteButtonCorrect: {
        width: '22%',
        aspectRatio: 1,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#10b981',
    },
    noteButtonWrong: {
        width: '22%',
        aspectRatio: 1,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#ef4444',
    },
    noteButtonDisabled: {
        width: '22%',
        aspectRatio: 1,
        backgroundColor: 'transparent',
        opacity: 0.2,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    noteButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    dirRow: {
        flexDirection: 'row',
        gap: 16,
    },
    dirButton: {
        flex: 1,
        paddingVertical: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    dirButtonSelected: {
        flex: 1,
        paddingVertical: 16,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#6366f1',
    },
    dirButtonCorrect: {
        flex: 1,
        paddingVertical: 16,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#10b981',
    },
    dirButtonWrong: {
        flex: 1,
        paddingVertical: 16,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ef4444',
    },
    dirButtonDisabled: {
        flex: 1,
        paddingVertical: 16,
        backgroundColor: 'transparent',
        opacity: 0.2,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    dirButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    postAnswerContainer: {
        marginTop: 10,
    },
    nextButton: {
        backgroundColor: '#10b981',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    nextButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
