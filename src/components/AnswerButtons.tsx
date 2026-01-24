
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowUp, ArrowDown } from 'lucide-react-native';

interface Props {
    onGuess: (dir: 'u' | 'd') => void;
    disabled: boolean;
    lastGuess: 'u' | 'd' | null;
    isCorrect: boolean | null;
}

export default function AnswerButtons({ onGuess, disabled, lastGuess, isCorrect }: Props) {
    const getButtonStyle = (direction: 'u' | 'd') => {
        const stylesToApply: any[] = [styles.button];
        if (lastGuess === direction) {
            if (isCorrect === true) stylesToApply.push(styles.correct);
            if (isCorrect === false) stylesToApply.push(styles.wrong);
        }
        if (disabled && lastGuess !== direction) stylesToApply.push(styles.disabled);
        return stylesToApply;
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={() => onGuess('u')}
                disabled={disabled}
                style={getButtonStyle('u')}
                activeOpacity={0.7}
            >
                <ArrowUp size={32} color="white" />
                <Text style={styles.text}>Higher</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => onGuess('d')}
                disabled={disabled}
                style={getButtonStyle('d')}
                activeOpacity={0.7}
            >
                <ArrowDown size={32} color="white" />
                <Text style={styles.text}>Lower</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 16,
        paddingHorizontal: 20,
        width: '100%',
        marginBottom: 40,
    },
    button: {
        flex: 1,
        height: 120,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    disabled: {
        opacity: 0.5,
    },
    correct: {
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: '#22c55e',
    },
    wrong: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: '#ef4444',
    },
    text: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    }
});
