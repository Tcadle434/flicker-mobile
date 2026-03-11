import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import OnboardingContentLayout from "../OnboardingContentLayout";
import { useOnboardingStore } from "../../../stores/onboardingStore";
import { playSound } from "../../../services/audio/uiSounds";

interface Props {
	onNext: () => void;
}

const GOALS = [
	"Reduce stress",
	"Improve focus",
	"Use my phone less",
	"Sleep better",
	"Build a meditation habit",
	"Increase productivity",
];

export default function Step6Personalization({ onNext }: Props) {
	const setGoals = useOnboardingStore((s) => s.setGoals);
	const [selected, setSelected] = useState<Set<string>>(new Set());

	const toggleGoal = (goal: string) => {
		playSound("buttonPress");
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(goal)) {
				next.delete(goal);
			} else {
				next.add(goal);
			}
			return next;
		});
	};

	const handleContinue = () => {
		setGoals(Array.from(selected));
		onNext();
	};

	return (
		<OnboardingContentLayout
			title="What brings you here?"
			subtitle="We'll personalize your experience."
			ctaLabel="Continue"
			ctaDelay={1200}
			ctaDisabled={selected.size === 0}
			onNext={handleContinue}
		>
			{/* Goal options */}
			<View style={styles.optionsContainer}>
				{GOALS.map((goal, i) => {
					const isSelected = selected.has(goal);
					return (
						<Animated.View
							key={goal}
							entering={FadeInDown.delay(500 + i * 100).duration(400)}
						>
							<Pressable
								style={[styles.option, isSelected && styles.optionSelected]}
								onPress={() => toggleGoal(goal)}
							>
								<Text
									style={[
										styles.optionText,
										isSelected && styles.optionTextSelected,
									]}
								>
									{goal}
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
