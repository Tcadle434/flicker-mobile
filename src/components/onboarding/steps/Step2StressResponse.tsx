import React from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import OnboardingContentLayout from "../OnboardingContentLayout";
import { ONBOARDING_ASSETS } from "../onboardingAssets";

const { width: SCREEN_W } = Dimensions.get("window");
const DIAGRAM_SIZE = Math.min(SCREEN_W * 0.28, 110);

interface Props {
	onNext: () => void;
}

export default function Step2StressResponse({ onNext }: Props) {
	return (
		<OnboardingContentLayout
			title="Stress isn't inherently bad."
			subtitle="It's a survival response."
			ctaLabel="What changed →"
			ctaDelay={2400}
			onNext={onNext}
		>
			{/* Animated flow diagram */}
			<View style={styles.diagramRow}>
				{/* Tiger */}
				<Animated.View
					entering={FadeInDown.delay(500).duration(500)}
					style={styles.diagramItem}
				>
					<Image
						source={ONBOARDING_ASSETS.tigerDiagram}
						style={styles.diagramImage}
						resizeMode="contain"
					/>
				</Animated.View>

				{/* Arrow 1 */}
				<Animated.Text entering={FadeIn.delay(800).duration(400)} style={styles.arrow}>
					→
				</Animated.Text>

				{/* Brain */}
				<Animated.View
					entering={FadeInDown.delay(1000).duration(500)}
					style={styles.diagramItem}
				>
					<Image
						source={ONBOARDING_ASSETS.brainDiagram}
						style={styles.diagramImage}
						resizeMode="contain"
					/>
				</Animated.View>

				{/* Arrow 2 */}
				<Animated.Text entering={FadeIn.delay(1300).duration(400)} style={styles.arrow}>
					→
				</Animated.Text>

				{/* Body stress */}
				<Animated.View
					entering={FadeInDown.delay(1500).duration(500)}
					style={styles.diagramItem}
				>
					<Image
						source={ONBOARDING_ASSETS.bodyStressDiagram}
						style={styles.diagramImage}
						resizeMode="contain"
					/>
				</Animated.View>
			</View>

			{/* Body */}
			<Animated.Text entering={FadeInDown.delay(1800).duration(600)} style={styles.body}>
				This response kept humans alive for thousands of years.
			</Animated.Text>

			{/* Key line */}
			<Animated.Text entering={FadeInDown.delay(2100).duration(600)} style={styles.keyLine}>
				The problem isn't stress. It's when it never turns off.
			</Animated.Text>
		</OnboardingContentLayout>
	);
}

const styles = StyleSheet.create({
	diagramRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 32,
		gap: 8,
	},
	diagramItem: {
		alignItems: "center",
	},
	diagramImage: {
		width: DIAGRAM_SIZE,
		height: DIAGRAM_SIZE,
		borderRadius: 12,
	},
	arrow: {
		color: "rgba(0, 0, 0, 0.3)",
		fontSize: 24,
		fontWeight: "300",
	},
	body: {
		color: "rgba(0, 0, 0, 0.55)",
		fontSize: 17,
		fontWeight: "400",
		lineHeight: 26,
		textAlign: "left",
		marginBottom: 20,
	},
	keyLine: {
		color: "#1A1A1A",
		fontSize: 18,
		fontWeight: "700",
		lineHeight: 26,
		textAlign: "left",
	},
});
