/**
 * StepTransitionToDemo
 *
 * Transition screen between personalization and the product demo loop.
 * Shows Flicker calm base image with messaging about building a ritual.
 */

import React from "react";
import { Image, StyleSheet, Dimensions } from "react-native";
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
			title="Recovery works best when it becomes a ritual."
			subtitle="Flicker turns calm and focus sessions into something visible you can come back to each day."
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
});
