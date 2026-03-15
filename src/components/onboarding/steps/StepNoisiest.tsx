import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import OnboardingContentLayout from "../OnboardingContentLayout";
import { useOnboardingStore } from "../../../stores/onboardingStore";
import { playSound } from "../../../services/audio/uiSounds";

interface Props {
	onNext: () => void;
}

const OPTIONS = [
	"First thing in the morning",
	"During work or studying",
	"In the afternoon",
	"At night",
	"It changes day to day",
];

export default function StepNoisiest({ onNext }: Props) {
	const setNoisiest = useOnboardingStore((s) => s.setNoisiest);
	const [selected, setSelected] = useState<string | null>(null);

	const handleSelect = (value: string) => {
		playSound("buttonPress");
		setSelected(value);
		setNoisiest(value);
	};

	return (
		<OnboardingContentLayout
			title="When does your mind feel the noisiest?"
			ctaLabel="Continue"
			ctaDelay={1200}
			ctaDisabled={!selected}
			onNext={onNext}
		>
			<View style={styles.optionsContainer}>
				{OPTIONS.map((opt, i) => {
					const isSelected = selected === opt;
					return (
						<Animated.View
							key={opt}
							entering={FadeInDown.delay(500 + i * 100).duration(400)}
						>
							<Pressable
								style={[styles.option, isSelected && styles.optionSelected]}
								onPress={() => handleSelect(opt)}
							>
								<Text
									style={[styles.optionText, isSelected && styles.optionTextSelected]}
								>
									{opt}
								</Text>
								{isSelected && <Text style={styles.checkmark}>✓</Text>}
							</Pressable>
						</Animated.View>
					);
				})}
			</View>
		</OnboardingContentLayout>
	);
}

const styles = StyleSheet.create({
	optionsContainer: {
		gap: 12,
	},
	option: {
		backgroundColor: "rgba(0, 0, 0, 0.04)",
		borderRadius: 14,
		paddingVertical: 18,
		paddingHorizontal: 24,
		borderWidth: 1.5,
		borderColor: "rgba(0, 0, 0, 0.06)",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	optionSelected: {
		borderColor: "#1A1A1A",
		backgroundColor: "rgba(0, 0, 0, 0.08)",
	},
	optionText: {
		color: "rgba(0, 0, 0, 0.55)",
		fontSize: 18,
		fontWeight: "400",
	},
	optionTextSelected: {
		color: "#1A1A1A",
		fontWeight: "500",
	},
	checkmark: {
		color: "#1A1A1A",
		fontSize: 18,
		fontWeight: "600",
	},
});
