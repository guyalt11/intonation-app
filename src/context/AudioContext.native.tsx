
import React, { createContext, useContext, useRef, useEffect } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

// The audio logic to be injected into the WebView
const audioScript = `
window.audioContext = new (window.AudioContext || window.webkitAudioContext)();

window.playPitch = (freq, duration = 0.8) => {
    return new Promise(resolve => {
        if (!window.audioContext) return resolve();

        // Resume context if suspended (policy)
        if (window.audioContext.state === 'suspended') {
            window.audioContext.resume();
        }

        const osc = window.audioContext.createOscillator();
        const gain = window.audioContext.createGain();

        osc.type = freq < 300 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, window.audioContext.currentTime);

        const baseGain = 0.15;
        const boost = Math.max(0, 1 - (freq - 130) / (1046 - 130));
        const normalizedGain = baseGain + (boost * 0.55);

        gain.gain.setValueAtTime(0, window.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(normalizedGain, window.audioContext.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, window.audioContext.currentTime + duration);

        osc.connect(gain);
        gain.connect(window.audioContext.destination);

        osc.start();
        osc.stop(window.audioContext.currentTime + duration);

        setTimeout(resolve, duration * 1000);
    });
};

window.createDrone = (freq) => {
    if (!window.audioContext) return null;
    if (window.audioContext.state === 'suspended') {
        window.audioContext.resume();
    }
    
    const osc = window.audioContext.createOscillator();
    const gain = window.audioContext.createGain();

    osc.type = freq < 300 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, window.audioContext.currentTime);

    const baseGain = 0.08;
    const boost = Math.max(0, 1 - (freq - 130) / (1046 - 130));
    const droneGain = baseGain + (boost * 0.2);

    gain.gain.setValueAtTime(0, window.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(droneGain, window.audioContext.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(window.audioContext.destination);

    osc.start();

    // Store drone reference
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

// Message Handler
document.addEventListener('message', (event) => {
    try {
        const data = JSON.parse(event.data);
        if (data.type === 'playPitch') {
            window.playPitch(data.freq, data.duration);
        } else if (data.type === 'createDrone') {
            window.stopDrone(); // Stop any existing drone first
            window.createDrone(data.freq);
        } else if (data.type === 'stopDrone') {
            window.stopDrone();
        }
    } catch (e) {
        // console.error(e);
    }
});
// Also listen to window messages for Android
window.addEventListener('message', (event) => {
    try {
        const data = JSON.parse(event.data);
        if (data.type === 'playPitch') {
            window.playPitch(data.freq, data.duration);
        } else if (data.type === 'createDrone') {
            window.stopDrone();
            window.createDrone(data.freq);
        } else if (data.type === 'stopDrone') {
            window.stopDrone();
        }
    } catch (e) {
         // console.error(e);
    }
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
}

const AudioGameContext = createContext<AudioContextType | null>(null);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
    const webviewRef = useRef<WebView>(null);

    const playPitch = (freq: number, duration: number = 0.8) => {
        webviewRef.current?.postMessage(JSON.stringify({ type: 'playPitch', freq, duration }));
    };

    const createDrone = (freq: number) => {
        webviewRef.current?.postMessage(JSON.stringify({ type: 'createDrone', freq }));
        return {
            stop: () => {
                webviewRef.current?.postMessage(JSON.stringify({ type: 'stopDrone' }));
            }
        };
    };

    return (
        <AudioGameContext.Provider value={{ playPitch, createDrone }}>
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
