
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GameHeader from '../components/GameHeader';
import PitchIndicator from '../components/PitchIndicator';
import AnswerButtons from '../components/AnswerButtons';
import GameOver from '../components/GameOver';
import { useAudio } from '../context/AudioContext';
import { saveHighScore, getDifficultyPreference, DifficultyMode, getPauseDuration } from '../utils/storage';

const MIN_FREQ = 130.81;
const MAX_FREQ = 1046.50;

const DELTA_SEMITONES_START = 0.8;
const DELTA_SEMITONES_MIN = 0.05;
const K_FACTOR = 0.15;

interface Props {
    onExit: () => void;
}

export default function Game4Screen({ onExit }: Props) {
    const { playPitch, stopAll } = useAudio();
    const [gameState, setGameState] = useState<'playing' | 'gameover'>('playing');
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(3);

    const [rootFreq, setRootFreq] = useState(0);
    const [midFreq, setMidFreq] = useState(0);
    const [targetFreq, setTargetFreq] = useState(0);
    const [actualFreq, setActualFreq] = useState(0);

    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [lastGuess, setLastGuess] = useState<'u' | 'd' | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [canInput, setCanInput] = useState(false);
    const [difficulty, setDifficulty] = useState<DifficultyMode>('hard');
    const [waitTime, setWaitTime] = useState<number | null>(null);

    useEffect(() => {
        const loadPrefs = async () => {
            const diffPref = await getDifficultyPreference();
            setDifficulty(diffPref);
            const pausePref = await getPauseDuration();
            setWaitTime(pausePref);
        };
        loadPrefs();
    }, []);

    const generateNextLevel = (targetLevel: number) => {
        const safeMin = MIN_FREQ * 1.1;
        const safeMax = MAX_FREQ / 1.5;

        const root = Math.random() * (safeMax - safeMin) + safeMin;
        const m2_ratio = Math.pow(2, 2 / 12);
        const mid = root * m2_ratio;

        const minor_ratio = Math.pow(2, 1 / 12);
        const target = mid * minor_ratio;

        const deltaSemitones =
            DELTA_SEMITONES_START * Math.exp(-K_FACTOR * targetLevel) +
            DELTA_SEMITONES_MIN;

        const errorRatio = Math.pow(2, deltaSemitones / 12);

        let direction = Math.random() > 0.5 ? 'u' : 'd';
        const actual = direction === 'u' ? target * errorRatio : target / errorRatio;

        setRootFreq(root);
        setMidFreq(mid);
        setTargetFreq(target);
        setActualFreq(actual);

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
        const dur1 = 600;
        const dur2 = 800;

        setIsPlaying(true);
        setCanInput(false);

        await playPitch(rootFreq, dur1 / 1000);
        await new Promise(r => setTimeout(r, Math.max(0, dur1 + waitTime - 50)));
        await playPitch(midFreq, dur1 / 1000);
        await new Promise(r => setTimeout(r, Math.max(0, dur1 + waitTime - 50)));

        setCanInput(true);
        await playPitch(actualFreq, dur2 / 1000);
        await new Promise(r => setTimeout(r, dur2));

        setIsPlaying(false);
    };

    const handleGuess = (guess: 'u' | 'd') => {
        if (!canInput) return;

        const actualDirection = actualFreq > targetFreq ? 'u' : 'd';
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
                    saveHighScore('game4', level);
                } else {
                    const next = level + 1;
                    setLevel(next);
                    generateNextLevel(next);
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
        if (gameState === 'playing' && rootFreq && waitTime !== null) {
            playSequence();
        }
    }, [rootFreq, gameState, waitTime]);

    const bgDark = ['#1a1a2e', '#0c0c0e'] as const;

    return (
        <LinearGradient colors={bgDark} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {gameState === 'playing' && (
                    <View style={styles.gameContent}>
                        <GameHeader level={level} lives={lives} onHome={handleExit} />
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
});
