import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import ContentScreen from "./ContentScreen";
import { playSound } from "../../services/audio/uiSounds";

interface OnboardingContentLayoutProps {
	title: string;
	subtitle?: string;
	ctaLabel: string;
	onNext: () => void;
	ctaDisabled?: boolean;
	/** Delay (ms) before CTA fades in */
	ctaDelay?: number;
	/** When provided, renders a "Skip" link below the CTA */
	onSkip?: () => void;
	children: React.ReactNode;
}

export default function OnboardingContentLayout({
	title,
	subtitle,
	ctaLabel,
	onNext,
	ctaDisabled,
	ctaDelay = 2000,
	onSkip,
	children,
}: OnboardingContentLayoutProps) {
	return (
		<ContentScreen backgroundColor="#F5F0EA">
			{/* Header — pinned top left */}
			<View style={styles.header}>
				<Animated.Text entering={FadeInDown.delay(200).duration(600)} style={styles.title}>
					{title}
				</Animated.Text>
				{subtitle && (
					<Animated.Text
						entering={FadeInDown.delay(400).duration(600)}
						style={styles.subtitle}
					>
						{subtitle}
					</Animated.Text>
				)}
			</View>

			{/* Centered content area */}
			<View style={styles.content}>{children}</View>

			{/* CTA */}
			<Animated.View entering={FadeInDown.delay(ctaDelay).duration(400)}>
				<Pressable
					style={[styles.ctaButton, ctaDisabled && styles.ctaDisabled]}
					disabled={ctaDisabled}
					onPress={() => {
						playSound("buttonPress");
						onNext();
					}}
				>
					<Text style={styles.ctaText}>{ctaLabel}</Text>
				</Pressable>
				{onSkip && (
					<Pressable onPress={onSkip} style={styles.skipButton}>
						<Text style={styles.skipText}>Skip</Text>
					</Pressable>
				)}
			</Animated.View>
		</ContentScreen>
	);
}

const styles = StyleSheet.create({
	header: {
		paddingTop: 68,
	},
	title: {
		color: "#1A1A1A",
		fontSize: 34,
		fontWeight: "700",
		textAlign: "left",
		marginBottom: 8,
	},
	subtitle: {
		color: "rgba(0, 0, 0, 0.45)",
		fontSize: 20,
		fontWeight: "300",
		textAlign: "left",
		marginBottom: 24,
	},
	content: {
		flex: 1,
		justifyContent: "center",
	},
	ctaButton: {
		backgroundColor: "#1A1A1A",
		borderRadius: 16,
		paddingVertical: 16,
	},
	ctaDisabled: {
		opacity: 0.3,
	},
	ctaText: {
		color: "#FAFAFA",
		fontSize: 17,
		fontWeight: "500",
		textAlign: "center",
	},
	skipButton: {
		alignSelf: "center",
		paddingVertical: 14,
	},
	skipText: {
		color: "rgba(0, 0, 0, 0.4)",
		fontSize: 15,
		textDecorationLine: "underline",
	},
});
