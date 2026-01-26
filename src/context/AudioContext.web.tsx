
import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { getSoundPreference, SoundType } from '../utils/storage';

// Web implementation uses the browser's native AudioContext

interface AudioContextType {
    playPitch: (freq: number, duration?: number, overrideSoundType?: SoundType) => void;
    createDrone: (freq: number) => { stop: () => void };
    soundType: SoundType;
    updateSoundType: (type: SoundType) => void;
}

const AudioGameContext = createContext<AudioContextType | null>(null);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
    const audioCtxRef = useRef<AudioContext | null>(null);
    const droneOscRef = useRef<OscillatorNode | null>(null);
    const droneGainRef = useRef<GainNode | null>(null);
    const [soundType, setSoundType] = useState<SoundType>('sound1');

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

    const applySoundSettings = (osc: OscillatorNode, gain: GainNode, freq: number, duration: number, soundTypeToUse: SoundType, isDrone: boolean = false) => {
        const ctx = audioCtxRef.current!;
        const currentTime = ctx.currentTime;

        // Default base gain calculation
        const baseGain = isDrone ? 0.08 : 0.15;
        const boost = Math.max(0, 1 - (freq - 130) / (1046 - 130));
        const normalizedGain = baseGain + (boost * (isDrone ? 0.2 : 0.55));

        switch (soundTypeToUse) {
            case 'sound2': // Piano-ish
                osc.type = 'triangle';
                const p2Overnote = ctx.createOscillator();
                const p2Overgain = ctx.createGain();
                p2Overnote.type = 'sine';
                p2Overnote.frequency.setValueAtTime(freq * 2, currentTime);
                p2Overgain.gain.setValueAtTime(0, currentTime);
                p2Overgain.gain.linearRampToValueAtTime(normalizedGain * 0.3, currentTime + 0.05);
                p2Overgain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
                p2Overnote.connect(p2Overgain);
                p2Overgain.connect(ctx.destination);
                p2Overnote.start();
                p2Overnote.stop(currentTime + duration);

                gain.gain.setValueAtTime(0, currentTime);
                gain.gain.linearRampToValueAtTime(normalizedGain, currentTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
                break;

            case 'sound3': // Flute-ish
                osc.type = 'triangle';
                gain.gain.setValueAtTime(0, currentTime);
                gain.gain.linearRampToValueAtTime(normalizedGain * 0.8, currentTime + 0.15);
                gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
                const s3Noise = ctx.createOscillator();
                const s3NoiseGain = ctx.createGain();
                s3Noise.type = 'sine';
                s3Noise.frequency.setValueAtTime(freq * 4, currentTime);
                s3NoiseGain.gain.setValueAtTime(0, currentTime);
                s3NoiseGain.gain.linearRampToValueAtTime(normalizedGain * 0.1, currentTime + 0.1);
                s3NoiseGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
                s3Noise.connect(s3NoiseGain);
                s3NoiseGain.connect(ctx.destination);
                s3Noise.start();
                s3Noise.stop(currentTime + duration);
                break;

            case 'sound4': // Xylophone
                osc.type = 'sine';
                gain.gain.setValueAtTime(0, currentTime);
                gain.gain.linearRampToValueAtTime(normalizedGain, currentTime + 0.005);
                gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration * 0.5);
                const s4Over = ctx.createOscillator();
                const s4OverGain = ctx.createGain();
                s4Over.frequency.setValueAtTime(freq * 2.5, currentTime);
                s4OverGain.gain.setValueAtTime(0, currentTime);
                s4OverGain.gain.linearRampToValueAtTime(normalizedGain * 0.5, currentTime + 0.005);
                s4OverGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration * 0.2);
                s4Over.connect(s4OverGain);
                s4OverGain.connect(ctx.destination);
                s4Over.start();
                s4Over.stop(currentTime + duration * 0.2);
                break;

            case 'sound5': // Organ
                osc.type = 'sine';
                gain.gain.setValueAtTime(0, currentTime);
                gain.gain.linearRampToValueAtTime(normalizedGain * 0.5, currentTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
                [0.5, 2, 4].forEach(mult => {
                    const s5Ovc = ctx.createOscillator();
                    const s5Ovg = ctx.createGain();
                    s5Ovc.type = 'sine';
                    s5Ovc.frequency.setValueAtTime(freq * mult, currentTime);
                    s5Ovg.gain.setValueAtTime(0, currentTime);
                    s5Ovg.gain.linearRampToValueAtTime(normalizedGain * 0.2, currentTime + 0.05);
                    s5Ovg.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
                    s5Ovc.connect(s5Ovg);
                    s5Ovg.connect(ctx.destination);
                    s5Ovc.start();
                    s5Ovc.stop(currentTime + duration);
                });
                break;

            case 'sound6': // Electric Piano
                osc.type = 'sine';
                gain.gain.setValueAtTime(0, currentTime);
                gain.gain.linearRampToValueAtTime(normalizedGain, currentTime + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
                const s6Mod = ctx.createOscillator();
                const s6ModGain = ctx.createGain();
                s6Mod.frequency.setValueAtTime(freq * 3, currentTime);
                s6ModGain.gain.setValueAtTime(normalizedGain * 500, currentTime);
                s6ModGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration * 0.5);
                s6Mod.connect(s6ModGain);
                s6ModGain.connect(osc.frequency);
                s6Mod.start();
                s6Mod.stop(currentTime + duration);
                break;

            case 'sound7': // Chimes
                osc.type = 'sine';
                gain.gain.setValueAtTime(0, currentTime);
                gain.gain.linearRampToValueAtTime(normalizedGain * 0.3, currentTime + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
                [2.41, 3.16, 5.23].forEach(m => {
                    const s7O = ctx.createOscillator();
                    const s7G = ctx.createGain();
                    s7O.frequency.setValueAtTime(freq * m, currentTime);
                    s7G.gain.setValueAtTime(0, currentTime);
                    s7G.gain.linearRampToValueAtTime(normalizedGain * 0.2, currentTime + 0.01);
                    s7G.gain.exponentialRampToValueAtTime(0.001, currentTime + duration * 0.8);
                    s7O.connect(s7G);
                    s7G.connect(ctx.destination);
                    s7O.start();
                    s7O.stop(currentTime + duration);
                });
                break;

            case 'sound8': // Space Bell
                osc.type = 'sine';
                gain.gain.setValueAtTime(0, currentTime);
                gain.gain.linearRampToValueAtTime(normalizedGain, currentTime + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
                const s8Mod = ctx.createOscillator();
                const s8ModG = ctx.createGain();
                s8Mod.frequency.setValueAtTime(freq * 1.414, currentTime);
                s8ModG.gain.setValueAtTime(normalizedGain * 1000, currentTime);
                s8ModG.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
                s8Mod.connect(s8ModG);
                s8ModG.connect(osc.frequency);
                s8Mod.start();
                s8Mod.stop(currentTime + duration);
                break;

            case 'sound9': // Celestial
                osc.type = 'sine';
                gain.gain.setValueAtTime(0, currentTime);
                gain.gain.linearRampToValueAtTime(normalizedGain * 0.4, currentTime + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
                [2, 3, 4, 5, 6].forEach(m => {
                    const s9O = ctx.createOscillator();
                    const s9G = ctx.createGain();
                    s9O.frequency.setValueAtTime(freq * m, currentTime);
                    s9G.gain.setValueAtTime(0, currentTime);
                    s9G.gain.linearRampToValueAtTime(normalizedGain * 0.05, currentTime + 0.2);
                    s9G.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
                    s9O.connect(s9G);
                    s9G.connect(ctx.destination);
                    s9O.start();
                    s9O.stop(currentTime + duration);
                });
                break;

            case 'sound10': // Deep Organ
                osc.type = 'sine';
                gain.gain.setValueAtTime(0, currentTime);
                gain.gain.linearRampToValueAtTime(normalizedGain * 0.6, currentTime + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
                [0.25, 0.5, 1, 1.5].forEach(m => {
                    const s10O = ctx.createOscillator();
                    const s10G = ctx.createGain();
                    s10O.frequency.setValueAtTime(freq * m, currentTime);
                    s10G.gain.setValueAtTime(0, currentTime);
                    s10G.gain.linearRampToValueAtTime(normalizedGain * 0.2, currentTime + 0.1);
                    s10G.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
                    s10O.connect(s10G);
                    s10G.connect(ctx.destination);
                    s10O.start();
                    s10O.stop(currentTime + duration);
                });
                break;

            case 'sound11': // Ethereal
                osc.type = 'sine';
                gain.gain.setValueAtTime(0, currentTime);
                gain.gain.linearRampToValueAtTime(normalizedGain * 0.5, currentTime + duration * 0.5);
                gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
                const s11F = ctx.createBiquadFilter();
                s11F.type = 'lowpass';
                s11F.frequency.setValueAtTime(freq * 0.5, currentTime);
                s11F.frequency.exponentialRampToValueAtTime(freq * 4, currentTime + duration);
                osc.disconnect();
                osc.connect(s11F);
                s11F.connect(gain);
                break;

            default: // sound1 (Default)
                osc.type = freq < 300 ? 'triangle' : 'sine';
                gain.gain.setValueAtTime(0, currentTime);
                gain.gain.linearRampToValueAtTime(normalizedGain, currentTime + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
                break;
        }
    };

    const playPitch = (freq: number, duration: number = 0.8, overrideSoundType?: SoundType) => {
        const ctx = initAudio();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        applySoundSettings(osc, gain, freq, duration, overrideSoundType || soundType);

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
        applySoundSettings(osc, gain, freq, 2.0, soundType, true); // Use longer duration for envelope reference

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
