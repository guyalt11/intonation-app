
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Trophy, Heart, Home } from 'lucide-react-native';

interface Props {
    level: number;
    lives: number;
    onHome: () => void;
}

export default function GameHeader({ level, lives, onHome }: Props) {
    return (
        <View style={styles.container}>
            <View style={styles.left}>
                <TouchableOpacity onPress={onHome} style={styles.homeButton}>
                    <Home size={20} color="white" />
                </TouchableOpacity>
                <View style={styles.stat}>
                    <Trophy size={20} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.statText}>Lvl {level}</Text>
                </View>
            </View>
            <View style={styles.stat}>
                <Heart
                    size={20}
                    color="#ef4444"
                    fill={lives > 0 ? "#ef4444" : "transparent"}
                />
                <Text style={styles.statText}>{lives}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20, // SafeArea handled by parent usually, but good to have some padding
        width: '100%',
        marginBottom: 40,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    homeButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        fontWeight: '600',
    }
});
