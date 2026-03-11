import React, { useState, useMemo } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
import OnboardingContentLayout from "../OnboardingContentLayout";
import { useOnboardingStore } from "../../../stores/onboardingStore";

interface Props {
	onNext: () => void;
}

const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1930;

function getDaysInMonth(month: number, year: number): number {
	return new Date(year, month + 1, 0).getDate();
}

export default function StepBirthDate({ onNext }: Props) {
	const setBirthDate = useOnboardingStore((s) => s.setBirthDate);

	const [month, setMonth] = useState(0); // January
	const [day, setDay] = useState(1);
	const [year, setYear] = useState(2000);

	const maxDays = useMemo(() => getDaysInMonth(month, year), [month, year]);

	// Clamp day if month/year changed to a shorter month
	const clampedDay = day > maxDays ? maxDays : day;

	const years = useMemo(() => {
		const arr: number[] = [];
		for (let y = CURRENT_YEAR; y >= MIN_YEAR; y--) arr.push(y);
		return arr;
	}, []);

	const days = useMemo(() => {
		const arr: number[] = [];
		for (let d = 1; d <= maxDays; d++) arr.push(d);
		return arr;
	}, [maxDays]);

	const handleContinue = () => {
		const m = String(month + 1).padStart(2, "0");
		const d = String(clampedDay).padStart(2, "0");
		const dateString = `${year}-${m}-${d}`;
		setBirthDate(dateString);
		onNext();
	};

	return (
		<OnboardingContentLayout
			title="When were you born?"
			subtitle="This helps us personalize your experience."
			ctaLabel="Continue"
			ctaDelay={800}
			onNext={handleContinue}
			onSkip={onNext}
		>
			<View style={styles.pickerRow}>
				<View style={styles.pickerMonth}>
					<Picker
						selectedValue={month}
						onValueChange={(v) => setMonth(v)}
						style={styles.picker}
						itemStyle={styles.pickerItem}
					>
						{MONTHS.map((name, i) => (
							<Picker.Item key={name} label={name} value={i} />
						))}
					</Picker>
				</View>

				<View style={styles.pickerDay}>
					<Picker
						selectedValue={clampedDay}
						onValueChange={(v) => setDay(v)}
						style={styles.picker}
						itemStyle={styles.pickerItem}
					>
						{days.map((d) => (
							<Picker.Item key={d} label={String(d)} value={d} />
						))}
					</Picker>
				</View>

				<View style={styles.pickerYear}>
					<Picker
						selectedValue={year}
						onValueChange={(v) => setYear(v)}
						style={styles.picker}
						itemStyle={styles.pickerItem}
					>
						{years.map((y) => (
							<Picker.Item key={y} label={String(y)} value={y} />
						))}
					</Picker>
				</View>
			</View>
		</OnboardingContentLayout>
	);
}

const styles = StyleSheet.create({
	pickerRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
	},
	pickerMonth: {
		flex: 3,
	},
	pickerDay: {
		flex: 1.5,
	},
	pickerYear: {
		flex: 2.5,
	},
	picker: {
		width: "100%",
		...Platform.select({
			ios: { height: 200 },
			android: { height: 50 },
		}),
	},
	pickerItem: {
		color: "#1A1A1A",
		fontSize: 18,
	},
});
