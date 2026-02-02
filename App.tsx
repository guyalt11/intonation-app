
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, StatusBar, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
    Outfit_400Regular,
    Outfit_700Bold
} from '@expo-google-fonts/outfit';
import {
    Fredoka_400Regular,
    Fredoka_700Bold
} from '@expo-google-fonts/fredoka';
import {
    LuckiestGuy_400Regular
} from '@expo-google-fonts/luckiest-guy';
import {
    Inter_400Regular,
    Inter_700Bold
} from '@expo-google-fonts/inter';

import { AudioProvider } from './src/context/AudioContext';
import HomeScreen from './src/screens/HomeScreen';
import Game1Screen from './src/screens/Game1Screen';
import Game2Screen from './src/screens/Game2Screen';
import Game3Screen from './src/screens/Game3Screen';
import Game4Screen from './src/screens/Game4Screen';
import Game5Screen from './src/screens/Game5Screen';
import SettingsScreen from './src/screens/SettingsScreen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
    const [currentScreen, setCurrentScreen] = useState<'home' | 'game1' | 'game2' | 'game3' | 'game4' | 'game5' | 'settings'>('home');

    const [fontsLoaded, fontError] = useFonts({
        'Outfit-Regular': Outfit_400Regular,
        'Outfit-Bold': Outfit_700Bold,
        'Fredoka-Regular': Fredoka_400Regular,
        'Fredoka-Bold': Fredoka_700Bold,
        'LuckiestGuy': LuckiestGuy_400Regular,
        'Inter-Regular': Inter_400Regular,
        'Inter-Bold': Inter_700Bold,
    });

    useEffect(() => {
        if (fontError) {
            console.error('Font loading error:', fontError);
        }
        if (fontsLoaded) {
            console.log('Fonts loaded successfully!');
        }
    }, [fontsLoaded, fontError]);

    const onLayoutRootView = useCallback(async () => {
        if (fontsLoaded) {
            await SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    if (fontError) {
        console.error('Critical font error - app may not display correctly');
        // Continue anyway to prevent app from being stuck
    }

    if (!fontsLoaded && !fontError) {
        return null;
    }

    const renderScreen = () => {
        switch (currentScreen) {
            case 'home':
                return (
                    <HomeScreen
                        onStartGame={(id) => setCurrentScreen(`game${id}` as any)}
                        onOpenSettings={() => setCurrentScreen('settings')}
                    />
                );
            case 'game1':
                return <Game1Screen onExit={() => setCurrentScreen('home')} />;
            case 'game2':
                return <Game2Screen onExit={() => setCurrentScreen('home')} />;
            case 'game3':
                return <Game3Screen onExit={() => setCurrentScreen('home')} />;
            case 'game4':
                return <Game4Screen onExit={() => setCurrentScreen('home')} />;
            case 'game5':
                return <Game5Screen onExit={() => setCurrentScreen('home')} />;
            case 'settings':
                return <SettingsScreen onBack={() => setCurrentScreen('home')} />;
            default:
                return <HomeScreen
                    onStartGame={(id) => setCurrentScreen(`game${id}` as any)}
                    onOpenSettings={() => setCurrentScreen('settings')}
                />;
        }
    };

    return (
        <AudioProvider>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <View style={styles.container} onLayout={onLayoutRootView}>
                {renderScreen()}
            </View>
        </AudioProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0c0c0e',
        paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
    },
});
