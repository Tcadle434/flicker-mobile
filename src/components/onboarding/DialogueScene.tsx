/**
 * DialogueScene
 *
 * Skia Canvas rendering the forest tileset image as a fullscreen background
 * with a dark overlay, and a massive animated Flicker character positioned
 * on the right side above the dialogue box area.
 */

import React, { useRef, useEffect } from "react";
import { Dimensions, StyleSheet } from "react-native";
import {
	Canvas,
	Fill,
	Image,
	Rect,
	useImage,
	FilterMode,
	MipmapMode,
} from "@shopify/react-native-skia";
import { useSharedValue } from "react-native-reanimated";
import AnimatedSprite from "../world/AnimatedSprite";
import { ONBOARDING_ASSETS, FLICKER_IDLE_META } from "./onboardingAssets";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// Flicker is ~20% of each sprite frame, so ~1.4x screen width puts his body at ~28% screen
const FLICKER_DISPLAY_W = SCREEN_W * 1.0;
const FLICKER_ASPECT = FLICKER_IDLE_META.frameHeight / FLICKER_IDLE_META.frameWidth;
const FLICKER_DISPLAY_H = FLICKER_DISPLAY_W * FLICKER_ASPECT;

interface Props {
	onReady?: () => void;
}

export default function DialogueScene({ onReady }: Props) {
	const tileset = useImage(require("../../../assets/tiled/flicker-forest.png"));
	const flickerSheet = useImage(ONBOARDING_ASSETS.flickerCalmIdle);

	const flickerX = useSharedValue(SCREEN_W * 0.85 - FLICKER_DISPLAY_W * 0.5);
	const flickerY = useSharedValue(SCREEN_H * 0.77 - FLICKER_DISPLAY_H * 0.7);

	const allLoaded = !!tileset && !!flickerSheet;
	const firedRef = useRef(false);

	useEffect(() => {
		if (allLoaded && !firedRef.current) {
			firedRef.current = true;
			onReady?.();
		}
	}, [allLoaded, onReady]);

	if (!allLoaded) return null;

	return (
		<Canvas style={styles.canvas} pointerEvents="none">
			<Fill color="#0A0A0B" />

			{/* Forest tileset as fullscreen background */}
			<Image
				image={tileset}
				x={0}
				y={0}
				width={SCREEN_W}
				height={SCREEN_H}
				fit="cover"
				sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
			/>

			{/* Dark overlay */}
			<Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H} color="rgba(10, 10, 11, 0.45)" />

			{/* Flicker — calm idle animation, massive on right side */}
			<AnimatedSprite
				image={flickerSheet}
				frameWidth={FLICKER_IDLE_META.frameWidth}
				frameHeight={FLICKER_IDLE_META.frameHeight}
				frameCount={FLICKER_IDLE_META.frameCount}
				fps={FLICKER_IDLE_META.fps}
				columns={FLICKER_IDLE_META.columns}
				x={flickerX}
				y={flickerY}
				width={FLICKER_DISPLAY_W}
				height={FLICKER_DISPLAY_H}
			/>
		</Canvas>
	);
}

const styles = StyleSheet.create({
	canvas: {
		...StyleSheet.absoluteFillObject,
		width: SCREEN_W,
		height: SCREEN_H,
	},
});
