import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    TouchableOpacity,
    Modal,
    Platform,
} from 'react-native';
import Svg, { Defs, Mask, Rect as SvgRect } from 'react-native-svg';
import { ChevronRight, ChevronLeft, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

export interface TourStep {
    targetRef: React.RefObject<View | null>;
    title: string;
    description: string;
    id: string;
    placement?: 'top' | 'bottom';
}

interface OnboardingTourProps {
    steps: TourStep[];
    visible: boolean;
    onComplete: () => void;
    onStepChange?: (index: number) => void;
}

export default function OnboardingTour({ steps, visible, onComplete, onStepChange }: OnboardingTourProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [layout, setLayout] = useState<{
        x: number, y: number, width: number, height: number, overlayWidth: number, overlayHeight: number
    } | null>(null);
    const overlayRef = useRef<View>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const bubbleAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    const currentStep = steps[currentStepIndex];

    useEffect(() => {
        if (visible && currentStep?.targetRef?.current) {
            onStepChange?.(currentStepIndex);
            // Delay measurement to allow for any scrolling/animations in the parent
            const timer = setTimeout(measureStep, 250);
            return () => clearTimeout(timer);
        }
    }, [visible, currentStepIndex]);

    const measureStep = () => {
        if (!currentStep?.targetRef?.current) return;

        // Determine the absolute root position of both the target and our overlay.
        // By subtracting them, we get the MATHEMATICALLY EXACT pixel offset within the same view node structure,
        // side-stepping every single OS-specific padding, safe area, and status-bar quirk completely!
        overlayRef.current.measure((_ox, _oy, owidth, oheight, opageX, opageY) => {
            currentStep.targetRef.current?.measure((x, y, width, height, pageX, pageY) => {
                setLayout({
                    x: pageX - (opageX || 0),
                    y: pageY - (opageY || 0),
                    width,
                    height,
                    overlayWidth: owidth || SCREEN_WIDTH,
                    overlayHeight: oheight || SCREEN_HEIGHT
                });

                // Animate in
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.spring(bubbleAnim, {
                        toValue: 1,
                        friction: 8,
                        useNativeDriver: true,
                    })
                ]).start();

                // Start the glow loop
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(glowAnim, {
                            toValue: 1,
                            duration: 1500,
                            useNativeDriver: true,
                        }),
                        Animated.timing(glowAnim, {
                            toValue: 0,
                            duration: 1500,
                            useNativeDriver: true,
                        })
                    ])
                ).start();
            });
        });
    };

    const nextStep = () => {
        if (currentStepIndex < steps.length - 1) {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                bubbleAnim.setValue(0);
                setCurrentStepIndex(prev => prev + 1);
            });
        } else {
            finish();
        }
    };
    const prevStep = () => {
        if (currentStepIndex > 0) {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                setLayout(null);
                bubbleAnim.setValue(0);
                setCurrentStepIndex(prev => prev - 1);
            });
        }
    };
    const finish = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            onComplete();
        });
    };

    if (!visible) return null;

    // Calculate layout dependent values if layout exists
    let bubbleContainerStyle: any = null;
    let expansionPx = 8;
    let scaleX = 1;
    let scaleY = 1;
    let targetCenterX = 0;
    let arrowLeft = 0;
    let placement: 'top' | 'bottom' = 'bottom';

    if (layout) {
        const gap = 25;
        const isBubbleAtBottom = (layout.y + layout.height + 200) > layout.overlayHeight;
        placement = currentStep.placement || (isBubbleAtBottom ? 'top' : 'bottom');

        bubbleContainerStyle = {
            opacity: fadeAnim,
            transform: [
                { scale: bubbleAnim },
                {
                    translateY: bubbleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [placement === 'top' ? -20 : 20, 0]
                    })
                }
            ]
        };

        if (placement === 'bottom') {
            bubbleContainerStyle.top = layout.y + layout.height + gap;
        } else {
            bubbleContainerStyle.bottom = layout.overlayHeight - layout.y + gap;
        }

        // Breathing scale: make expansion equal in pixels on both axes (e.g. 10px)
        scaleX = (layout.width + expansionPx) / layout.width;
        scaleY = (layout.height + expansionPx) / layout.height;

        // Center the arrow relative to the target
        targetCenterX = layout.x + layout.width / 2;
        const arrowLeftRaw = targetCenterX - 20 - 10;
        const containerWidth = layout.overlayWidth - 40;
        arrowLeft = Math.max(10, Math.min(containerWidth - 30, arrowLeftRaw));
    }

    return (
        <View
            ref={overlayRef}
            style={[StyleSheet.absoluteFill, styles.overlay]}
        >
            {layout && (
                <>
                    {/* Background Mask */}
                    <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
                        <Defs>
                            <Mask id="mask">
                                <SvgRect height="100%" width="100%" fill="white" />
                                <SvgRect
                                    x={layout.x - 4}
                                    y={layout.y - 4}
                                    width={layout.width + 8}
                                    height={layout.height + 8}
                                    rx={28}
                                    fill="black"
                                />
                            </Mask>
                        </Defs>
                        <SvgRect
                            height="100%"
                            width="100%"
                            fill="rgba(0, 0, 0, 0.82)"
                            mask="url(#mask)"
                        />
                    </Svg>

                    {/* Glowing border around target */}
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            styles.spotlightBorder,
                            {
                                top: layout.y - 6,
                                left: layout.x - 6,
                                width: layout.width + 12,
                                height: layout.height + 12,
                                opacity: fadeAnim,
                                transform: [
                                    {
                                        scaleX: glowAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [1, scaleX]
                                        })
                                    },
                                    {
                                        scaleY: glowAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [1, scaleY]
                                        })
                                    }
                                ]
                            }
                        ]}
                    />

                    <Animated.View
                        style={[
                            styles.bubbleContainer,
                            bubbleContainerStyle
                        ]}
                    >
                        <LinearGradient
                            colors={['#2A1447', '#1D0B2E']}
                            style={styles.bubble}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={[
                                styles.arrow,
                                placement === 'top' ? styles.arrowBottom : styles.arrowTop,
                                { left: arrowLeft }
                            ]} />

                            <View style={styles.bubbleHeader}>
                                <View style={styles.dotContainer}>
                                    {steps.map((_, i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.progessDot,
                                                i === currentStepIndex && styles.activeDot,
                                                i < currentStepIndex && styles.completedDot
                                            ]}
                                        />
                                    ))}
                                </View>
                                <TouchableOpacity onPress={finish} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <X size={16} color="rgba(255,255,255,0.4)" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.title}>{currentStep.title}</Text>
                            <Text style={styles.description}>{currentStep.description}</Text>

                            <View style={styles.footerRow}>
                                {currentStepIndex > 0 && (
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        style={styles.backButton}
                                        onPress={prevStep}
                                    >
                                        <ChevronLeft size={24} color="rgba(255,255,255,0.7)" />
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={[styles.nextButton, { flex: 1 }]}
                                    onPress={nextStep}
                                >
                                    <LinearGradient
                                        colors={['#a855f7', '#7c3aed']}
                                        style={styles.nextGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <Text style={styles.nextText}>
                                            {currentStepIndex === steps.length - 1 ? 'Got it!' : 'Next'}
                                        </Text>
                                        <ChevronRight size={18} color="white" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </Animated.View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        zIndex: 9999,
        elevation: 9999,
    },
    spotlightBorder: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: '#a855f7',
        borderRadius: 30,
        shadowColor: '#a855f7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
    bubbleContainer: {
        position: 'absolute',
        left: 20,
        right: 20,
    },
    bubble: {
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.6,
        shadowRadius: 30,
        elevation: 20,
    },
    bubbleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    dotContainer: {
        flexDirection: 'row',
        gap: 6,
    },
    progessDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    activeDot: {
        width: 16,
        backgroundColor: '#a855f7',
    },
    completedDot: {
        backgroundColor: 'rgba(168, 85, 247, 0.4)',
    },
    title: {
        color: 'white',
        fontSize: 22,
        fontFamily: 'Outfit-Bold',
        marginBottom: 8,
    },
    description: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 15,
        fontFamily: 'Fredoka-Regular',
        lineHeight: 22,
        marginBottom: 24,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButton: {
        width: 50,
        height: 50,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextButton: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    nextGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 4,
    },
    nextText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'Outfit-Bold',
    },
    arrow: {
        position: 'absolute',
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
    },
    arrowTop: {
        top: -15,
        borderBottomWidth: 15,
        borderBottomColor: '#2A1447',
    },
    arrowBottom: {
        bottom: -15,
        borderTopWidth: 15,
        borderTopColor: '#1D0B2E',
    }
});
