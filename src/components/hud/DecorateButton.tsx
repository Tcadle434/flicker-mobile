/**
 * Decorate Button
 *
 * Spritesheet-based animated button. Shows the first frame at rest,
 * plays through all frames on press, then fires onPress.
 *
 * Spritesheet: 4 frames, each 96×32 px, laid out horizontally (384×32 total).
 * Same frame layout as HudIconButton — the visible button is the center 32×32.
 */

import React, { useCallback, useRef } from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	useFrameCallback,
	runOnJS,
} from "react-native-reanimated";
import { playSound } from "../../services/audio/uiSounds";

const SPRITESHEET = require("../../../assets/ui/btn_press_decorate_spritesheet.png");

const FRAME_W = 96;
const FRAME_H = 32;
const FRAME_COUNT = 4;
const BUTTON_REGION = 32;
const PADDING = (FRAME_W - BUTTON_REGION) / 2;

const DISPLAY_SIZE = 56;
const SCALE = DISPLAY_SIZE / BUTTON_REGION;
const FRAME_DISPLAY_W = FRAME_W * SCALE;
const FRAME_DISPLAY_H = FRAME_H * SCALE;
const PAD_DISPLAY = PADDING * SCALE;
const SHEET_DISPLAY_W = FRAME_DISPLAY_W * FRAME_COUNT;

const FRAME_DURATION = 70;

interface Props {
	onPress: () => void;
	style?: ViewStyle;
}

export default function DecorateButton({ onPress, style }: Props) {
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
				frameIndex.value = 0;
				playing.value = false;
				runOnJS(onAnimationDone)();
			} else {
				frameIndex.value = next;
			}
		}
	}, false);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: -(frameIndex.value * FRAME_DISPLAY_W) - PAD_DISPLAY }],
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

	const tap = Gesture.Tap().onEnd(() => {
		runOnJS(handlePress)();
	});

	return (
		<GestureDetector gesture={tap}>
			<Animated.View style={[styles.container, style]}>
				<View style={styles.clip}>
					<Animated.Image
						source={SPRITESHEET}
						style={[styles.sheet, animatedStyle]}
						resizeMode="stretch"
					/>
				</View>
			</Animated.View>
		</GestureDetector>
	);
}

const styles = StyleSheet.create({
	container: {
		width: DISPLAY_SIZE,
		height: DISPLAY_SIZE,
	},
	clip: {
		width: DISPLAY_SIZE,
		height: DISPLAY_SIZE,
		overflow: "hidden",
	},
	sheet: {
		width: SHEET_DISPLAY_W,
		height: FRAME_DISPLAY_H,
	},
});
