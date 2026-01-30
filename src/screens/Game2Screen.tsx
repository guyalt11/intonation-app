
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GameHeader from '../components/GameHeader';
import PitchIndicator from '../components/PitchIndicator';
import AnswerButtons from '../components/AnswerButtons';
import GameOver from '../components/GameOver';
import { useAudio } from '../context/AudioContext';
import { saveHighScore, getDifficultyPreference, DifficultyMode } from '../utils/storage';

const MIN_FREQ = 130.81;
const MAX_FREQ = 1046.50;

const DELTA_SEMITONES_START = 4;
const DELTA_SEMITONES_MIN = 0.1;
const K_FACTOR = 0.2;

interface Props {
    onExit: () => void;
}

export default function Game2Screen({ onExit }: Props) {
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

    useEffect(() => {
        const loadDiff = async () => {
            const pref = await getDifficultyPreference();
            setDifficulty(pref);
        };
        loadDiff();
    }, []);

    const generateNextLevel = (targetLevel: number, currentFirst: number | null = null) => {
        const safeMin = MIN_FREQ * 1.1;
        const safeMax = MAX_FREQ / 1.1;

        const f1 = currentFirst ?? (Math.random() * (safeMax - safeMin) + safeMin);

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

        if (level === 1) {
            await playPitch(firstFreq, 0.8);
            await new Promise(r => setTimeout(r, 800 + 400));
        }

        await playPitch(secondFreq, 0.8);
        await new Promise(r => setTimeout(r, 800));

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
                generateNextLevel(next, secondFreq); // Pass secondFreq as start for next
            } else {
                const remaining = lives - 1;
                setLives(remaining);
                if (remaining <= 0) {
                    setGameState('gameover');
                    saveHighScore('game2', level);
                } else {
                    const next = level + 1;
                    setLevel(next);
                    generateNextLevel(next, secondFreq);
                }
            }
        }, 800);
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
        if (gameState === 'playing' && firstFreq) {
            playSequence();
        }
    }, [firstFreq, gameState]);

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

                        <PitchIndicator
                            isPlaying={isPlaying}
                            isCorrect={isCorrect}
                            isClickable={difficulty === 'easy' && canInput}
                            onPress={playSequence}
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
                        onExit={handleExit}
                    />
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
