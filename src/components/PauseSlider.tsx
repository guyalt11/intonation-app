
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';

interface Props {
    value: number; // in ms
    onValueChange: (value: number) => void;
    min?: number;
    max?: number;
}

export default function PauseSlider({ value, onValueChange, min = 0, max = 1000 }: Props) {
    const [width, setWidth] = useState(0);
    const sliderWidth = useRef(0);

    // Normalized value (0 to 1)
    const normalizedValue = (value - min) / (max - min);

    const onLayout = (event: LayoutChangeEvent) => {
        const { width: w } = event.nativeEvent.layout;
        setWidth(w);
        sliderWidth.current = w;
    };

    const handleTouch = (evt: any) => {
        if (sliderWidth.current === 0) return;
        const touchX = evt.nativeEvent.locationX;
        let newValue = (touchX / sliderWidth.current) * (max - min) + min;
        newValue = Math.max(min, Math.min(max, Math.round(newValue / 100) * 100)); // Snap to 100ms
        onValueChange(newValue);
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => handleTouch(evt),
            onPanResponderMove: (evt) => handleTouch(evt),
        })
    ).current;

    return (
        <View style={styles.container}>
            <View style={styles.labelRow}>
                <Text style={styles.valueText}>{value}ms</Text>
            </View>

            <View
                style={styles.sliderContainer}
                onLayout={onLayout}
                {...panResponder.panHandlers}
            >
                {/* Track */}
                <View style={styles.track}>
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
        marginBottom: 15,
    },
    valueText: {
        color: '#a855f7',
        fontSize: 24,
        fontWeight: 'bold',
    },
    sliderContainer: {
        height: 40,
        justifyContent: 'center',
        position: 'relative',
    },
    track: {
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    activeTrack: {
        height: '100%',
        backgroundColor: '#a855f7',
    },
    thumb: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#a855f7',
        marginLeft: -12, // Center the thumb
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
