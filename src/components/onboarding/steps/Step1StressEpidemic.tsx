import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import type { ViewStyle } from "react-native";
import Animated, {
	FadeInDown,
	FadeIn,
	useSharedValue,
	useAnimatedStyle,
	withRepeat,
	withSequence,
	withTiming,
	withDelay,
} from "react-native-reanimated";
import { Canvas, useImage } from "@shopify/react-native-skia";
import OnboardingContentLayout from "../OnboardingContentLayout";
import AnimatedSprite from "../../world/AnimatedSprite";
import { ONBOARDING_ASSETS, FLICKER_OVERWHELMED_META } from "../onboardingAssets";

const { width: SCREEN_W } = Dimensions.get("window");

// Flicker is ~20% of frame, so 1.3x screen width → ~26% screen appearance
const FLICKER_W = SCREEN_W * 1.1;
const FLICKER_ASPECT = FLICKER_OVERWHELMED_META.frameHeight / FLICKER_OVERWHELMED_META.frameWidth;
const FLICKER_H = FLICKER_W * FLICKER_ASPECT;
const CANVAS_H = 280;

interface BubbleConfig {
	text: string;
	color: string;
	position: ViewStyle;
	delay: number;
	bobDelay: number;
}

const BUBBLES: BubbleConfig[] = [
	{
		text: "43 people liked...",
		color: "#EF4444",
		position: { top: 10, left: 16 },
		delay: 600,
		bobDelay: 0,
	},
	{
		text: "BREAKING - The US...",
		color: "#F59E0B",
		position: { top: 0, right: 10 },
		delay: 800,
		bobDelay: 300,
	},
	{
		text: "Sent you a reel",
		color: "#A78BFA",
		position: { top: 110, right: 20 },
		delay: 1000,
		bobDelay: 600,
	},
	{
		text: "...just commented on...",
		color: "#3B82F6",
		position: { top: 170, left: 8 },
		delay: 1200,
		bobDelay: 150,
	},
	{
		text: "posted a new video",
		color: "#EF4444",
		position: { top: 210, right: 35 },
		delay: 1400,
		bobDelay: 450,
	},
];

function ThoughtBubble({ text, color, position, delay, bobDelay }: BubbleConfig) {
	const translateY = useSharedValue(0);

	useEffect(() => {
		translateY.value = withDelay(
			bobDelay,
			withRepeat(
				withSequence(withTiming(-5, { duration: 1800 }), withTiming(5, { duration: 1800 })),
				-1,
				true
			)
		);
	}, []);

	const animStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
	}));

	return (
		<Animated.View
			entering={FadeIn.delay(delay).duration(400)}
			style={[styles.bubble, position, animStyle]}
		>
			<View style={[styles.bubbleDot, { backgroundColor: color }]} />
			<Text style={styles.bubbleText}>{text}</Text>
		</Animated.View>
	);
}

interface Props {
	onNext: () => void;
}

export default function Step1StressEpidemic({ onNext }: Props) {
	const flickerSheet = useImage(ONBOARDING_ASSETS.flickerOverwhelmedIdle);
	const flickerX = useSharedValue((SCREEN_W - FLICKER_W) / 2 - SCREEN_W * 0.08);
	const flickerY = useSharedValue((CANVAS_H - FLICKER_H) * 0.3);

	return (
		<OnboardingContentLayout
			title="Your mind isn't broken."
			subtitle="It's busy."
			ctaLabel="Learn how stress actually works"
			ctaDelay={2000}
			onNext={onNext}
		>
			{/* Character + thought bubbles */}
			<View style={styles.characterSection}>
				{BUBBLES.map((b) => (
					<ThoughtBubble key={b.text} {...b} />
				))}

				{flickerSheet && (
					<Canvas style={styles.canvas} pointerEvents="none">
						<AnimatedSprite
							image={flickerSheet}
							frameWidth={FLICKER_OVERWHELMED_META.frameWidth}
							frameHeight={FLICKER_OVERWHELMED_META.frameHeight}
							frameCount={FLICKER_OVERWHELMED_META.frameCount}
							fps={FLICKER_OVERWHELMED_META.fps}
							columns={FLICKER_OVERWHELMED_META.columns}
							x={flickerX}
							y={flickerY}
							width={FLICKER_W}
							height={FLICKER_H}
							nearestFilter={false}
						/>
					</Canvas>
				)}
			</View>

			{/* Subtext */}
			<Animated.Text entering={FadeInDown.delay(1600).duration(600)} style={styles.subtext}>
				You're plugged in more than ever. This keeps you alert.{"\n"}
				But your body was <Text style={styles.subtextBold}>designed to recover.</Text>
			</Animated.Text>
		</OnboardingContentLayout>
	);
}

const styles = StyleSheet.create({
	characterSection: {
		height: CANVAS_H,
		width: "100%",
		marginBottom: 24,
	},
	canvas: {
		...StyleSheet.absoluteFillObject,
	},
	bubble: {
		position: "absolute",
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(255, 255, 255, 0.92)",
		borderRadius: 20,
		paddingHorizontal: 14,
		paddingVertical: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 4,
	},
	bubbleDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginRight: 8,
	},
	bubbleText: {
		color: "#1A1A1A",
		fontSize: 14,
		fontWeight: "500",
	},
	subtext: {
		color: "rgba(0, 0, 0, 0.55)",
		fontSize: 17,
		fontWeight: "400",
		lineHeight: 26,
		textAlign: "left",
		marginBottom: 16,
	},
	subtextBold: {
		fontWeight: "700",
		color: "#1A1A1A",
	},
});
