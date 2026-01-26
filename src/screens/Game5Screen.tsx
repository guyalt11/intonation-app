
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GameHeader from '../components/GameHeader';
import PitchIndicator from '../components/PitchIndicator';
import AnswerButtons from '../components/AnswerButtons';
import GameOver from '../components/GameOver';
import { useAudio } from '../context/AudioContext';
import { saveHighScore } from '../utils/storage';

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

    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [lastGuess, setLastGuess] = useState<'u' | 'd' | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [canInput, setCanInput] = useState(false);

    const generateNextLevel = (targetLevel: number) => {
        const safeMin = MIN_FREQ * 1.1;
        const safeMax = MAX_FREQ / 2.5; // Enough room for the full scale

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
        if (isPlaying || notes.length === 0) return;

        setIsPlaying(true);
        setCanInput(false);

        for (let i = 0; i < notes.length; i++) {
            playPitch(notes[i], 0.5);
            // Wait for note duration + gap
            await new Promise(r => setTimeout(r, 500 + 80));
        }

        setCanInput(true);
        setIsPlaying(false);
    };

    const handleGuess = (guess: 'u' | 'd') => {
        if (!canInput) return;

        const actualDirection = actualNote > targetNote ? 'u' : 'd';
        const won = guess === actualDirection;

        setIsCorrect(won);
        setLastGuess(guess);
        setCanInput(false);

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
                    saveHighScore('game5', level);
                } else {
                    const next = level + 1;
                    setLevel(next);
                    generateNextLevel(next);
                }
            }
        }, 800);
    };

    useEffect(() => {
        startGame();
    }, []);

    useEffect(() => {
        if (gameState === 'playing' && notes.length > 0) {
            playSequence();
        }
    }, [notes, gameState]);

    const bgDark = ['#1a1a2e', '#0c0c0e'] as const;

    return (
        <LinearGradient colors={bgDark} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {gameState === 'playing' && (
                    <View style={styles.gameContent}>
                        <GameHeader level={level} lives={lives} onHome={onExit} />
                        <PitchIndicator isPlaying={isPlaying} isCorrect={isCorrect} />
                        <AnswerButtons
                            onGuess={handleGuess}
                            disabled={!canInput}
                            lastGuess={lastGuess}
                            isCorrect={isCorrect}
                        />
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
});
