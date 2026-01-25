
import React, { useState } from 'react';
import { StyleSheet, View, StatusBar, Platform } from 'react-native';
import Constants from 'expo-constants';
import { AudioProvider } from './src/context/AudioContext';
import HomeScreen from './src/screens/HomeScreen';
import Game1Screen from './src/screens/Game1Screen';
import Game2Screen from './src/screens/Game2Screen';
import Game3Screen from './src/screens/Game3Screen';
import Game4Screen from './src/screens/Game4Screen';
import SettingsScreen from './src/screens/SettingsScreen';

export default function App() {
    const [currentScreen, setCurrentScreen] = useState<'home' | 'game1' | 'game2' | 'game3' | 'game4' | 'settings'>('home');

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
            <View style={styles.container}>
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
