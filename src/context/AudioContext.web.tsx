
import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { getSoundPreference, SoundType } from '../utils/storage';

// Web implementation uses the browser's native AudioContext

interface AudioContextType {
    playPitch: (freq: number, duration?: number) => void;
    createDrone: (freq: number) => { stop: () => void };
    soundType: SoundType;
    updateSoundType: (type: SoundType) => void;
}

const AudioGameContext = createContext<AudioContextType | null>(null);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
    const audioCtxRef = useRef<AudioContext | null>(null);
    const droneOscRef = useRef<OscillatorNode | null>(null);
    const droneGainRef = useRef<GainNode | null>(null);
    const [soundType, setSoundType] = useState<SoundType>('default');

    useEffect(() => {
        loadPreference();
    }, []);

    const loadPreference = async () => {
        const pref = await getSoundPreference();
        setSoundType(pref);
    };

    const initAudio = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    };

    const applySoundSettings = (osc: OscillatorNode, gain: GainNode, freq: number, duration: number, isDrone: boolean = false) => {
        const ctx = audioCtxRef.current!;
        const currentTime = ctx.currentTime;

        // Default base gain calculation
        const baseGain = isDrone ? 0.08 : 0.15;
        const boost = Math.max(0, 1 - (freq - 130) / (1046 - 130));
        const normalizedGain = baseGain + (boost * (isDrone ? 0.2 : 0.55));

        switch (soundType) {
            case 'piano':
                osc.type = 'triangle';
                // Add a second harmonic for piano-like richness
                const pianoOvernote = ctx.createOscillator();
                const pianoOvergain = ctx.createGain();
                pianoOvernote.type = 'sine';
                pianoOvernote.frequency.setValueAtTime(freq * 2, currentTime);
                pianoOvergain.gain.setValueAtTime(0, currentTime);
                pianoOvergain.gain.linearRampToValueAtTime(normalizedGain * 0.3, currentTime + 0.05);
                pianoOvergain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
                pianoOvernote.connect(pianoOvergain);
                pianoOvergain.connect(ctx.destination);
                pianoOvernote.start();
                pianoOvernote.stop(currentTime + duration);

                gain.gain.setValueAtTime(0, currentTime);
                gain.gain.linearRampToValueAtTime(normalizedGain, currentTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
                break;

            case 'guitar':
                osc.type = 'sawtooth'; // More harmonics
                gain.gain.setValueAtTime(0, currentTime);
                gain.gain.linearRampToValueAtTime(normalizedGain * 0.6, currentTime + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration * 0.8);

                // Add a subtle filter for "pluck"
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(freq * 3, currentTime);
                filter.frequency.exponentialRampToValueAtTime(freq, currentTime + duration * 0.5);
                osc.disconnect();
                osc.connect(filter);
                filter.connect(gain);
                break;

            case 'synth':
                osc.type = 'square';
                gain.gain.setValueAtTime(0, currentTime);
                gain.gain.linearRampToValueAtTime(normalizedGain * 0.4, currentTime + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
                break;

            default:
                osc.type = freq < 300 ? 'triangle' : 'sine';
                gain.gain.setValueAtTime(0, currentTime);
                gain.gain.linearRampToValueAtTime(normalizedGain, currentTime + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
                break;
        }
    };

    const playPitch = (freq: number, duration: number = 0.8) => {
        const ctx = initAudio();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        applySoundSettings(osc, gain, freq, duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    };

    const createDrone = (freq: number) => {
        const ctx = initAudio();

        if (droneOscRef.current) {
            try { droneOscRef.current.stop(); } catch (e) { }
            droneOscRef.current = null;
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        applySoundSettings(osc, gain, freq, 2.0, true); // Use longer duration for envelope reference

        // For drone, we want a sustained gain
        const boost = Math.max(0, 1 - (freq - 130) / (1046 - 130));
        const droneGainVal = 0.08 + (boost * 0.2);
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(droneGainVal, ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();

        droneOscRef.current = osc;
        droneGainRef.current = gain;

        return {
            stop: () => {
                if (gain) {
                    try {
                        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                    } catch (e) { }
                }
                setTimeout(() => {
                    if (osc) {
                        try { osc.stop(); } catch (e) { }
                    }
                    if (droneOscRef.current === osc) {
                        droneOscRef.current = null;
                        droneGainRef.current = null;
                    }
                }, 500);
            }
        };
    };

    const updateSoundType = (type: SoundType) => {
        setSoundType(type);
    };

    return (
        <AudioGameContext.Provider value={{ playPitch, createDrone, soundType, updateSoundType }}>
            {children}
        </AudioGameContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioGameContext);
    if (!context) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
};
