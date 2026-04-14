/**
 * StepTransitionToDemo
 *
 * Transition screen between personalization and the product demo loop.
 * Shows Flicker calm base image with messaging about building a ritual.
 */

import React from "react";
import { Image, Text, StyleSheet, Dimensions } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import OnboardingContentLayout from "../OnboardingContentLayout";
import { ONBOARDING_ASSETS } from "../onboardingAssets";

const { width: SCREEN_W } = Dimensions.get("window");
const FLICKER_SIZE = SCREEN_W * 0.5;

interface Props {
	onNext: () => void;
}

export default function StepTransitionToDemo({ onNext }: Props) {
	return (
		<OnboardingContentLayout
			title="Turn recovery into a ritual."
			subtitle="Flicker lets you set a time each day for your mind to recover."
			ctaLabel="See how it works"
			ctaDelay={1800}
			onNext={onNext}
		>
			<Animated.View
				entering={FadeInDown.delay(800).duration(600)}
				style={styles.imageContainer}
			>
				<Image
					source={ONBOARDING_ASSETS.flickerCalmBase}
					style={styles.flickerImage}
					resizeMode="contain"
				/>
			</Animated.View>
			<Animated.Text entering={FadeInDown.delay(1400).duration(600)} style={styles.footer}>
				Ready to feel good about yourself? Let's see how the app works.
			</Animated.Text>
		</OnboardingContentLayout>
	);
}

const styles = StyleSheet.create({
	imageContainer: {
		alignItems: "center",
		justifyContent: "center",
	},
	flickerImage: {
		width: FLICKER_SIZE,
		height: FLICKER_SIZE,
	},
	footer: {
		color: "rgba(0, 0, 0, 0.55)",
		fontSize: 17,
		fontWeight: "400",
		lineHeight: 26,
		textAlign: "left",
		marginTop: 8,
	},
});
