
import React, { createContext, useContext, useRef, useEffect } from 'react';

// Web implementation uses the browser's native AudioContext

interface AudioContextType {
    playPitch: (freq: number, duration?: number) => void;
    createDrone: (freq: number) => { stop: () => void };
}

const AudioGameContext = createContext<AudioContextType | null>(null);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
    const audioCtxRef = useRef<AudioContext | null>(null);
    const droneOscRef = useRef<OscillatorNode | null>(null);
    const droneGainRef = useRef<GainNode | null>(null);

    const initAudio = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    };

    const playPitch = (freq: number, duration: number = 0.8) => {
        const ctx = initAudio();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = freq < 300 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const baseGain = 0.15;
        const boost = Math.max(0, 1 - (freq - 130) / (1046 - 130));
        const normalizedGain = baseGain + (boost * 0.55);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(normalizedGain, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    };

    const createDrone = (freq: number) => {
        const ctx = initAudio();

        // Stop existing if any (though logic usually handles this)
        if (droneOscRef.current) {
            try { droneOscRef.current.stop(); } catch (e) { }
            droneOscRef.current = null;
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = freq < 300 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const baseGain = 0.08;
        const boost = Math.max(0, 1 - (freq - 130) / (1046 - 130));
        const droneGain = baseGain + (boost * 0.2);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(droneGain, ctx.currentTime + 0.5);

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

    return (
        <AudioGameContext.Provider value={{ playPitch, createDrone }}>
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
