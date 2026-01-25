
import React, { createContext, useContext, useRef, useEffect, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { getSoundPreference, SoundType } from '../utils/storage';

// The audio logic to be injected into the WebView
const audioScript = `
window.audioContext = new (window.AudioContext || window.webkitAudioContext)();

window.applySoundSettings = (osc, gain, freq, duration, soundType, isDrone = false) => {
    const ctx = window.audioContext;
    const currentTime = ctx.currentTime;

    const baseGain = isDrone ? 0.08 : 0.15;
    const boost = Math.max(0, 1 - (freq - 130) / (1046 - 130));
    const normalizedGain = baseGain + (boost * (isDrone ? 0.2 : 0.55));

    switch (soundType) {
        case 'piano':
            osc.type = 'triangle';
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
            osc.type = 'sawtooth';
            gain.gain.setValueAtTime(0, currentTime);
            gain.gain.linearRampToValueAtTime(normalizedGain * 0.6, currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration * 0.8);
            
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

window.playPitch = (freq, duration = 0.8, soundType = 'default') => {
    return new Promise(resolve => {
        if (!window.audioContext) return resolve();
        if (window.audioContext.state === 'suspended') {
            window.audioContext.resume();
        }

        const osc = window.audioContext.createOscillator();
        const gain = window.audioContext.createGain();

        osc.frequency.setValueAtTime(freq, window.audioContext.currentTime);
        window.applySoundSettings(osc, gain, freq, duration, soundType);

        osc.connect(gain);
        gain.connect(window.audioContext.destination);

        osc.start();
        osc.stop(window.audioContext.currentTime + duration);

        setTimeout(resolve, duration * 1000);
    });
};

window.createDrone = (freq, soundType = 'default') => {
    if (!window.audioContext) return null;
    if (window.audioContext.state === 'suspended') {
        window.audioContext.resume();
    }
    
    const osc = window.audioContext.createOscillator();
    const gain = window.audioContext.createGain();

    osc.frequency.setValueAtTime(freq, window.audioContext.currentTime);
    window.applySoundSettings(osc, gain, freq, 2.0, soundType, true);

    const boost = Math.max(0, 1 - (freq - 130) / (1046 - 130));
    const droneGainVal = 0.08 + (boost * 0.2);
    gain.gain.cancelScheduledValues(window.audioContext.currentTime);
    gain.gain.setValueAtTime(0, window.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(droneGainVal, window.audioContext.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(window.audioContext.destination);

    osc.start();

    window.currentDroneOsc = osc;
    window.currentDroneGain = gain;
};

window.stopDrone = () => {
    if (window.currentDroneGain) {
        window.currentDroneGain.gain.exponentialRampToValueAtTime(0.001, window.audioContext.currentTime + 0.5);
    }
    if (window.currentDroneOsc) {
        setTimeout(() => {
             if (window.currentDroneOsc) window.currentDroneOsc.stop();
             window.currentDroneOsc = null;
             window.currentDroneGain = null;
        }, 500);
    }
};

const handleMessage = (data) => {
    if (data.type === 'playPitch') {
        window.playPitch(data.freq, data.duration, data.soundType);
    } else if (data.type === 'createDrone') {
        window.stopDrone();
        window.createDrone(data.freq, data.soundType);
    } else if (data.type === 'stopDrone') {
        window.stopDrone();
    }
};

document.addEventListener('message', (event) => {
    try {
        handleMessage(JSON.parse(event.data));
    } catch (e) {}
});

window.addEventListener('message', (event) => {
    try {
        handleMessage(JSON.parse(event.data));
    } catch (e) {}
});
`;

const htmlContent = `
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"></head>
<body>
<script>
${audioScript}
</script>
</body>
</html>
`;

interface AudioContextType {
    playPitch: (freq: number, duration?: number) => void;
    createDrone: (freq: number) => { stop: () => void };
    soundType: SoundType;
    updateSoundType: (type: SoundType) => void;
}

const AudioGameContext = createContext<AudioContextType | null>(null);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
    const webviewRef = useRef<WebView>(null);
    const [soundType, setSoundType] = useState<SoundType>('default');

    useEffect(() => {
        loadPreference();
    }, []);

    const loadPreference = async () => {
        const pref = await getSoundPreference();
        setSoundType(pref);
    };

    const playPitch = (freq: number, duration: number = 0.8) => {
        webviewRef.current?.postMessage(JSON.stringify({ type: 'playPitch', freq, duration, soundType }));
    };

    const createDrone = (freq: number) => {
        webviewRef.current?.postMessage(JSON.stringify({ type: 'createDrone', freq, soundType }));
        return {
            stop: () => {
                webviewRef.current?.postMessage(JSON.stringify({ type: 'stopDrone' }));
            }
        };
    };

    const updateSoundType = (type: SoundType) => {
        setSoundType(type);
    };

    return (
        <AudioGameContext.Provider value={{ playPitch, createDrone, soundType, updateSoundType }}>
            {children}
            <View style={{ height: 0, width: 0, position: 'absolute', opacity: 0 }}>
                <WebView
                    ref={webviewRef}
                    source={{ html: htmlContent }}
                    originWhitelist={['*']}
                    javaScriptEnabled={true}
                    mediaPlaybackRequiresUserAction={false}
                />
            </View>
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
