import React from "react";
import { Text, Image, StyleSheet, Dimensions } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import OnboardingContentLayout from "../OnboardingContentLayout";
import { ONBOARDING_ASSETS } from "../onboardingAssets";

const { width: SCREEN_W } = Dimensions.get("window");
const IMAGE_W = SCREEN_W - 64;

interface Props {
	onNext: () => void;
}

export default function Step4Recovery({ onNext }: Props) {
	return (
		<OnboardingContentLayout
			title="Your nervous system needs recovery."
			ctaLabel="How we help →"
			ctaDelay={1700}
			onNext={onNext}
		>
			{/* Visual */}
			<Animated.View
				entering={FadeInDown.delay(600).duration(600)}
				style={styles.imageWrapper}
			>
				<Image
					source={ONBOARDING_ASSETS.alertVsRecovery}
					style={styles.image}
					resizeMode="contain"
				/>
			</Animated.View>

			{/* Body */}
			<Animated.Text entering={FadeInDown.delay(1000).duration(600)} style={styles.body}>
				Your body is designed to move between:{" "}
				<Text style={styles.bold}>Alert → Recovery.</Text>
				{"\n\n"}
				But constant stimulation keeps many people stuck in alert mode. It is essential
				you give your mind the chance to recover.
			</Animated.Text>

			{/* Evidence line */}
			<Animated.Text
				entering={FadeInDown.delay(1400).duration(600)}
				style={styles.evidence}
			>
				Flicker exists to help lower stress hormones and improves focus.
			</Animated.Text>
		</OnboardingContentLayout>
	);
}

const styles = StyleSheet.create({
	imageWrapper: {
		alignItems: "center",
		marginBottom: 28,
	},
	image: {
		width: IMAGE_W,
		height: IMAGE_W * 0.55,
		borderRadius: 16,
	},
	body: {
		color: "rgba(0, 0, 0, 0.55)",
		fontSize: 17,
		fontWeight: "400",
		lineHeight: 26,
		textAlign: "center",
		marginBottom: 16,
	},
	bold: {
		fontWeight: "700",
		color: "#1A1A1A",
	},
	evidence: {
		color: "rgba(0, 0, 0, 0.35)",
		fontSize: 14,
		fontWeight: "300",
		lineHeight: 22,
		textAlign: "center",
		fontStyle: "italic",
	},
});
