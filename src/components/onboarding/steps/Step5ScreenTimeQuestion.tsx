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
	{ label: "Less than 2 hours", value: "under-2h", hours: 1.5 },
	{ label: "2 to 4 hours", value: "2-4h", hours: 3 },
	{ label: "4 to 6 hours", value: "4-6h", hours: 5 },
	{ label: "6 to 8 hours", value: "6-8h", hours: 7 },
	{ label: "8+ hours", value: "8h+", hours: 8 },
];

export default function Step5ScreenTimeQuestion({ onNext }: Props) {
	const setScreenTime = useOnboardingStore((s) => s.setScreenTime);
	const [selected, setSelected] = useState<string | null>(null);

	const handleSelect = (value: string, hours: number) => {
		playSound("buttonPress");
		setSelected(value);
		setScreenTime(value, hours);
	};

	return (
		<OnboardingContentLayout
			title="How much time do you spend on your phone each day?"
			subtitle="A rough range is enough."
			ctaLabel="Continue"
			ctaDelay={1200}
			ctaDisabled={!selected}
			onNext={onNext}
		>
			<View style={styles.optionsContainer}>
				{OPTIONS.map((opt, i) => {
					const isSelected = selected === opt.value;
					return (
						<Animated.View
							key={opt.value}
							entering={FadeInDown.delay(500 + i * 100).duration(400)}
						>
							<Pressable
								style={[styles.option, isSelected && styles.optionSelected]}
								onPress={() => handleSelect(opt.value, opt.hours)}
							>
								<Text
									style={[styles.optionText, isSelected && styles.optionTextSelected]}
								>
									{opt.label}
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
