/**
 * Start Session Button
 *
 * Spritesheet-based animated button. Shows the first frame at rest,
 * plays through all frames on press, then fires onPress.
 *
 * Spritesheet: 4 frames, each 96×32 px, laid out horizontally.
 * Uses useFrameCallback for discrete frame stepping (same pattern as AnimatedSprite).
 */

import React, { useCallback, useRef } from "react";
import { TouchableOpacity, View, Text, StyleSheet, type ViewStyle } from "react-native";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	useFrameCallback,
	runOnJS,
} from "react-native-reanimated";
import { playSound } from "../../services/audio/uiSounds";

const SPRITESHEET = require("../../../assets/ui/session_start_button_spritesheet.png");

const FRAME_W = 96;
const FRAME_H = 32;
const FRAME_COUNT = 4;

const DISPLAY_W = 220;
const DISPLAY_H = Math.round(DISPLAY_W * (FRAME_H / FRAME_W)); // 73
const SHEET_DISPLAY_W = DISPLAY_W * FRAME_COUNT;

const FRAME_DURATION = 70; // ms per frame

interface Props {
	onPress: () => void;
	style?: ViewStyle;
}

export default function StartSessionButton({ onPress, style }: Props) {
	const frameIndex = useSharedValue(0);
	const elapsed = useSharedValue(0);
	const playing = useSharedValue(false);
	const isPlaying = useRef(false);

	const onAnimationDone = useCallback(() => {
		frameCallback.setActive(false);
		isPlaying.current = false;
		onPress();
	}, [onPress]);

	const frameCallback = useFrameCallback((info) => {
		if (!playing.value) return;
		if (info.timeSincePreviousFrame === null) return;

		elapsed.value += info.timeSincePreviousFrame;
		if (elapsed.value >= FRAME_DURATION) {
			elapsed.value -= FRAME_DURATION;
			const next = frameIndex.value + 1;
			if (next >= FRAME_COUNT) {
				// Done — reset to frame 0 and fire callback
				frameIndex.value = 0;
				playing.value = false;
				runOnJS(onAnimationDone)();
			} else {
				frameIndex.value = next;
			}
		}
	}, false);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: -(frameIndex.value * DISPLAY_W) }],
	}));

	// Label follows the button face — pressed frames shift the face down
	const LABEL_OFFSET_PER_FRAME = [0, 2, 4, 4]; // px shift down per frame
	const labelStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: LABEL_OFFSET_PER_FRAME[frameIndex.value] ?? 0 }],
	}));

	const handlePress = useCallback(() => {
		if (isPlaying.current) return;
		isPlaying.current = true;
		playSound("buttonPress");
		frameIndex.value = 0;
		elapsed.value = 0;
		playing.value = true;
		frameCallback.setActive(true);
	}, [frameCallback, frameIndex, elapsed, playing]);

	return (
		<TouchableOpacity
			onPress={handlePress}
			activeOpacity={0.9}
			style={[styles.container, style]}
		>
			<View style={styles.clip}>
				<Animated.Image
					source={SPRITESHEET}
					style={[styles.sheet, animatedStyle]}
					resizeMode="stretch"
				/>
			</View>
			<Animated.View style={[styles.labelOverlay, labelStyle]}>
				<Text style={styles.label}>Start</Text>
			</Animated.View>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: {
		width: DISPLAY_W,
		height: DISPLAY_H,
	},
	clip: {
		width: DISPLAY_W,
		height: DISPLAY_H,
		overflow: "hidden",
	},
	sheet: {
		width: SHEET_DISPLAY_W,
		height: DISPLAY_H,
	},
	labelOverlay: {
		...StyleSheet.absoluteFillObject,
		alignItems: "center",
		justifyContent: "center",
	},
	label: {
		color: "#432925",
		fontFamily: "Toriko",
		fontSize: 36,
		letterSpacing: 1,
		marginTop: -12,
		textShadowColor: "rgba(255, 220, 160, 0.5)",
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 0,
	},
});
