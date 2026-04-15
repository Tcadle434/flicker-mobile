import React from "react";
import { View, Text, StyleSheet, Pressable, Image, Dimensions } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import ContentScreen from "../ContentScreen";
import { ONBOARDING_ASSETS } from "../onboardingAssets";
import { playSound } from "../../../services/audio/uiSounds";

const { width: SCREEN_W } = Dimensions.get("window");
const PHONE_W = Math.min(SCREEN_W * 0.7, 292);
const PHONE_H = PHONE_W * 1.72;

interface Props {
	onNext: () => void;
}

export default function Step0AppIntro({ onNext }: Props) {
	return (
		<ContentScreen backgroundColor="#F5F0EA">
			<View style={styles.content}>
				<Animated.View entering={FadeInDown.delay(180).duration(650)} style={styles.phoneShell}>
					<View style={styles.phoneBezel}>
						<View style={styles.notch} />
						<View style={styles.phoneScreen}>
							<Image
								source={ONBOARDING_ASSETS.sessionScreenshot}
								style={styles.previewScreenshot}
								resizeMode="cover"
							/>
						</View>
					</View>
				</Animated.View>

			</View>

			<Animated.View entering={FadeInDown.delay(860).duration(400)}>
				<View style={styles.ctaSection}>
					<Text style={styles.title}>Reset your mind. Reclaim your focus.</Text>
					<Pressable
						style={styles.ctaButton}
						onPress={() => {
							playSound("buttonPress");
							onNext();
						}}
					>
						<Text style={styles.ctaText}>Get started</Text>
					</Pressable>
					<View style={styles.signInRow}>
						<Text style={styles.signInText}>Already have an account? </Text>
						<Pressable
							onPress={() => {
								playSound("buttonPress");
								router.push("/(auth)/signin?mode=signinOnly");
							}}
							hitSlop={8}
						>
							<Text style={styles.signInStrong}>Sign in</Text>
						</Pressable>
					</View>
				</View>
			</Animated.View>
		</ContentScreen>
	);
}

const styles = StyleSheet.create({
	content: {
		flex: 1,
		justifyContent: "flex-start",
		alignItems: "center",
		paddingHorizontal: 8,
		paddingTop: 54,
	},
	title: {
		color: "#1A1A1A",
		fontSize: 32,
		fontWeight: "700",
		lineHeight: 38,
		textAlign: "center",
		marginBottom: 22,
		maxWidth: 340,
	},
	phoneShell: {
		width: PHONE_W,
		height: PHONE_H,
		marginBottom: 28,
	},
	phoneBezel: {
		flex: 1,
		backgroundColor: "#181613",
		borderRadius: 34,
		padding: 10,
		shadowColor: "rgba(0, 0, 0, 0.22)",
		shadowOffset: { width: 0, height: 18 },
		shadowOpacity: 1,
		shadowRadius: 28,
		elevation: 14,
	},
	notch: {
		position: "absolute",
		top: 14,
		alignSelf: "center",
		width: 90,
		height: 18,
		borderRadius: 12,
		backgroundColor: "#0F0E0D",
		zIndex: 2,
	},
	phoneScreen: {
		flex: 1,
		backgroundColor: "#FBF7F1",
		borderRadius: 26,
		overflow: "hidden",
	},
	previewScreenshot: {
		width: "100%",
		height: "100%",
	},
	ctaSection: {
		width: "100%",
		alignItems: "center",
	},
	ctaButton: {
		backgroundColor: "#1A1A1A",
		borderRadius: 16,
		paddingVertical: 16,
		width: "90%",
		alignSelf: "center",
	},
	ctaText: {
		color: "#FAFAFA",
		fontSize: 17,
		fontWeight: "600",
		textAlign: "center",
	},
	signInRow: {
		marginTop: 18,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
	},
	signInText: {
		color: "rgba(0, 0, 0, 0.55)",
		fontSize: 15,
		fontWeight: "400",
		textAlign: "center",
	},
	signInStrong: {
		color: "#1A1A1A",
		fontWeight: "700",
	},
});
