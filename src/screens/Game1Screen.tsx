
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GameHeader from '../components/GameHeader';
import PitchIndicator from '../components/PitchIndicator';
import AnswerButtons from '../components/AnswerButtons';
import GameOver from '../components/GameOver';
import { useAudio } from '../context/AudioContext';
import { saveHighScore } from '../utils/storage';

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
    const { playPitch } = useAudio();
    const [gameState, setGameState] = useState<'playing' | 'gameover'>('playing');
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(3);
    const [firstFreq, setFirstFreq] = useState(0);
    const [secondFreq, setSecondFreq] = useState(0);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [lastGuess, setLastGuess] = useState<'u' | 'd' | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [canInput, setCanInput] = useState(false);

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
        if (isPlaying) return;

        setIsPlaying(true);
        setCanInput(false);
        playPitch(firstFreq, 0.8);
        await new Promise(r => setTimeout(r, 800 + 100)); // 0.8s duration + 0.1s gap
        playPitch(secondFreq, 0.8);
        await new Promise(r => setTimeout(r, 800)); // wait for second note to finish

        setIsPlaying(false);
        setCanInput(true);
    };

    const handleGuess = (guess: 'u' | 'd') => {
        if (!canInput) return;

        const actual = secondFreq > firstFreq ? 'u' : 'd';
        const won = guess === actual;

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
                    saveHighScore('game1', level);
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
        if (gameState === 'playing' && firstFreq) {
            playSequence();
        }
    }, [firstFreq, gameState]);

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
                            onHome={onExit}
                        />

                        <PitchIndicator
                            isPlaying={isPlaying}
                            isCorrect={isCorrect}
                        />

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
                        onExit={onExit}
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
});
