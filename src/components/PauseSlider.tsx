
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, LayoutChangeEvent, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    value: number; // in ms
    onValueChange: (value: number) => void;
    onSlidingComplete?: (value: number) => void;
    onPlay?: () => void;
    min?: number;
    max?: number;
}

export default function PauseSlider({ value, onValueChange, onSlidingComplete, onPlay, min = 0, max = 1000 }: Props) {
    const sliderWidth = useRef(0);
    const [localValue, setLocalValue] = useState(value);
    const isSliding = useRef(false);

    // Sync local value when external value changes
    useEffect(() => {
        if (!isSliding.current) {
            setLocalValue(value);
        }
    }, [value]);

    // Normalized value (0 to 1) based on local state for smooth visual
    const normalizedValue = (localValue - min) / (max - min);

    const onLayout = (event: LayoutChangeEvent) => {
        const { width: w } = event.nativeEvent.layout;
        sliderWidth.current = w;
    };

    const handleTouch = (evt: any, isFinal: boolean = false) => {
        if (sliderWidth.current === 0) return;

        const touchX = evt.nativeEvent.locationX;
        let newValue = (touchX / sliderWidth.current) * (max - min) + min;

        // Snap to 100ms strictly
        newValue = Math.max(min, Math.min(max, Math.round(newValue / 100) * 100));

        setLocalValue(newValue);
        onValueChange(newValue);
        if (isFinal) {
            onSlidingComplete?.(newValue);
        }
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                isSliding.current = true;
                handleTouch(evt);
            },
            onPanResponderMove: (evt) => handleTouch(evt),
            onPanResponderRelease: (evt) => {
                handleTouch(evt, true);
                isSliding.current = false;
            },
            onPanResponderTerminate: () => {
                isSliding.current = false;
            }
        })
    ).current;

    return (
        <View style={styles.container}>
            <View style={styles.labelRow}>
                <View style={styles.labelContainer}>
                    <Text style={styles.valueText}>{localValue.toFixed(0)}ms</Text>
                    {onPlay && (
                        <TouchableOpacity onPress={onPlay} style={styles.playButton}>
                            <Ionicons name="play" size={20} color="white" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View
                style={styles.sliderContainer}
                onLayout={onLayout}
                {...panResponder.panHandlers}
            >
                {/* Track */}
                <View style={styles.track} pointerEvents="none">
                    {/* Active Part */}
                    <View
                        style={[
                            styles.activeTrack,
                            { width: `${normalizedValue * 100}%` }
                        ]}
                    />
                </View>

                {/* Thumb */}
                <View
                    pointerEvents="none"
                    style={[
                        styles.thumb,
                        { left: `${normalizedValue * 100}%` }
                    ]}
                />
            </View>

            <View style={styles.limitRow}>
                <Text style={styles.limitText}>{min}ms</Text>
                <Text style={styles.limitText}>{max}ms</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    playButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#a855f7',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#a855f7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    valueText: {
        color: '#a855f7',
        fontSize: 24,
        fontWeight: 'bold',
        minWidth: 80,
        textAlign: 'center',
    },
    sliderContainer: {
        height: 40,
        justifyContent: 'center',
        position: 'relative',
    },
    track: {
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    activeTrack: {
        height: '100%',
        backgroundColor: '#a855f7',
    },
    thumb: {
        position: 'absolute',
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'white',
        borderWidth: 3,
        borderColor: '#a855f7',
        marginLeft: -14, // Center the thumb
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
    limitRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    limitText: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 12,
    },
});
