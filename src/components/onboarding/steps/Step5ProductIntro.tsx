import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, { FadeInDown, useSharedValue } from "react-native-reanimated";
import { Canvas, useImage } from "@shopify/react-native-skia";
import OnboardingContentLayout from "../OnboardingContentLayout";
import AnimatedSprite from "../../world/AnimatedSprite";

const { width: SCREEN_W } = Dimensions.get("window");

const SITTING_META = {
	columns: 8,
	rows: 8,
	frameWidth: 512,
	frameHeight: 293,
	frameCount: 61,
	fps: 12,
} as const;

const FLICKER_W = SCREEN_W * 0.7;
const FLICKER_ASPECT = SITTING_META.frameHeight / SITTING_META.frameWidth;
const FLICKER_H = FLICKER_W * FLICKER_ASPECT;
const CANVAS_H = FLICKER_H;

interface Props {
	onNext: () => void;
}

const FEATURES = [
	{ icon: "🌿", label: "Daily resets for calm" },
	{ icon: "🛡️", label: "Protected sessions for focus" },
	{ icon: "📱", label: "Screen time control" },
];

export default function Step5ProductIntro({ onNext }: Props) {
	const sittingSheet = useImage(
		require("../../../../assets/sprites/flicker_calm_sitting_idle.png")
	);
	const flickerX = useSharedValue((SCREEN_W - FLICKER_W) / 2 - 24);
	const flickerY = useSharedValue(-20);

	return (
		<OnboardingContentLayout
			title="Introducing Flicker."
			subtitle="Protected time for your mind."
			ctaLabel="Learn more"
			ctaDelay={1800}
			onNext={onNext}
		>
			{/* Feature list */}
			<View style={styles.featureList}>
				{FEATURES.map((f, i) => (
					<Animated.View
						key={f.label}
						entering={FadeInDown.delay(500 + i * 150).duration(500)}
						style={styles.featureRow}
					>
						<Text style={styles.featureIcon}>{f.icon}</Text>
						<Text style={styles.featureLabel}>{f.label}</Text>
					</Animated.View>
				))}
			</View>

			{/* Flicker sitting animation */}
			<Animated.View
				entering={FadeInDown.delay(1200).duration(600)}
				style={styles.characterSection}
			>
				{sittingSheet && (
					<Canvas style={styles.canvas} pointerEvents="none">
						<AnimatedSprite
							image={sittingSheet}
							frameWidth={SITTING_META.frameWidth}
							frameHeight={SITTING_META.frameHeight}
							frameCount={SITTING_META.frameCount}
							fps={SITTING_META.fps}
							columns={SITTING_META.columns}
							x={flickerX}
							y={flickerY}
							width={FLICKER_W}
							height={FLICKER_H}
							nearestFilter
						/>
					</Canvas>
				)}
			</Animated.View>

			<Animated.Text entering={FadeInDown.delay(1500).duration(600)} style={styles.footerScience}>
				Because stress without recovery compounds — quietly eroding your mood, sleep, and long-term health.
			</Animated.Text>
			<Animated.Text entering={FadeInDown.delay(1700).duration(600)} style={styles.footer}>
				Small protected moments can change the shape of a day.
			</Animated.Text>
		</OnboardingContentLayout>
	);
}

const styles = StyleSheet.create({
	characterSection: {
		height: CANVAS_H,
		width: "100%",
		marginBottom: 0,
		overflow: "hidden",
	},
	canvas: {
		...StyleSheet.absoluteFillObject,
	},
	featureList: {
		gap: 12,
		marginBottom: 12,
	},
	featureRow: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(0, 0, 0, 0.04)",
		borderRadius: 14,
		paddingVertical: 16,
		paddingHorizontal: 20,
	},
	featureIcon: {
		fontSize: 22,
		marginRight: 14,
	},
	featureLabel: {
		color: "#1A1A1A",
		fontSize: 18,
		fontWeight: "500",
	},
	footerScience: {
		color: "rgba(0, 0, 0, 0.55)",
		fontSize: 17,
		fontWeight: "400",
		lineHeight: 26,
		textAlign: "left",
		marginBottom: 8,
	},
	footer: {
		color: "#1A1A1A",
		fontSize: 18,
		fontWeight: "700",
		lineHeight: 26,
		textAlign: "left",
	},
});
