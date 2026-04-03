import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	Pressable,
	StyleSheet,
	Dimensions,
	type StyleProp,
	type ViewStyle,
} from "react-native";
import Animated, {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DurationDialPicker from "./DurationDialPicker";
import PixelPanel from "./PixelPanel";
import { HUD_ASSETS } from "./hudAssets";
import { DEV_RELAX_SESSION_MINUTES } from "../../constants/devSession";

const { width: SCREEN_W, height: SCREEN_HEIGHT } = Dimensions.get("window");
const PANEL_TOP = SCREEN_HEIGHT * 0.35;
const PANEL_HEIGHT = SCREEN_HEIGHT - PANEL_TOP;
const DISMISS_THRESHOLD = 100;
const SESSION_PANEL_MODES = ["reset", "focus"] as const;
const SESSION_DURATION_RANGE = {
	min: 5,
	max: 120,
	step: 5,
} as const;

type SessionMode = (typeof SESSION_PANEL_MODES)[number];

const MODE_DISPLAY: Record<SessionMode, string> = {
	reset: "Relax",
	focus: "Focus",
};

const MODE_COLORS: Record<SessionMode, string> = {
	reset: "#7DD3FC",
	focus: "#5EEAD4",
};

const INITIAL_DURATIONS: Record<SessionMode, number> = {
	reset: 10,
	focus: 25,
};

interface SessionPanelProps {
	visible: boolean;
	onClose: () => void;
}

interface SessionPanelButtonProps {
	label: string;
	active: boolean;
	onPress: () => void;
	style?: StyleProp<ViewStyle>;
}

function SessionPanelButton({ label, active, onPress, style }: SessionPanelButtonProps) {
	return (
		<TouchableOpacity onPress={onPress} activeOpacity={0.85} style={style}>
			<PixelPanel source={HUD_ASSETS.panelSlice2} scale={1} style={styles.choicePanel}>
				<View
					style={[
						styles.choiceInner,
						active && {
							backgroundColor: "rgba(139, 100, 50, 0.18)",
						},
					]}
				>
					<Text style={[styles.choiceText, active && styles.choiceTextActive]}>
						{label}
					</Text>
				</View>
			</PixelPanel>
		</TouchableOpacity>
	);
}

export default function SessionPanel({ visible, onClose }: SessionPanelProps) {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const translateY = useSharedValue(SCREEN_HEIGHT);
	const backdropOpacity = useSharedValue(0);

	const [selectedMode, setSelectedMode] = useState<SessionMode>("reset");
	const [durationByMode, setDurationByMode] =
		useState<Record<SessionMode, number>>(INITIAL_DURATIONS);

	const selectedDuration = durationByMode[selectedMode];
	const accent = MODE_COLORS[selectedMode];

	useEffect(() => {
		if (visible) {
			translateY.value = withTiming(PANEL_TOP, { duration: 300 });
			backdropOpacity.value = withTiming(0.6, { duration: 300 });
		} else {
			translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
			backdropOpacity.value = withTiming(0, { duration: 250 });
		}
	}, [backdropOpacity, translateY, visible]);

	const handleModeChange = (mode: SessionMode) => {
		setSelectedMode(mode);
	};

	const handleDurationChange = (minutes: number) => {
		setDurationByMode((current) => {
			if (current[selectedMode] === minutes) {
				return current;
			}

			return {
				...current,
				[selectedMode]: minutes,
			};
		});
	};

	const handleBegin = () => {
		onClose();

		if (selectedMode === "reset") {
			router.push(`/(session)/reset?duration=${selectedDuration}`);
			return;
		}

		router.push(`/(session)/run?mode=focus&duration=${selectedDuration}`);
	};

	const handleBeginDevRelax = () => {
		onClose();
		router.push({
			pathname: "/(session)/reset",
			params: {
				duration: String(DEV_RELAX_SESSION_MINUTES),
				devSession: "1",
			},
		});
	};

	const dismiss = () => {
		onClose();
	};

	const pan = Gesture.Pan()
		.activeOffsetY(20)
		.onUpdate((event) => {
			if (event.translationY > 0) {
				translateY.value = PANEL_TOP + event.translationY;
			}
		})
		.onEnd((event) => {
			if (event.translationY > DISMISS_THRESHOLD) {
				translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
				backdropOpacity.value = withTiming(0, { duration: 250 });
				runOnJS(dismiss)();
			} else {
				translateY.value = withTiming(PANEL_TOP, { duration: 300 });
			}
		});

	const panelStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
	}));

	const backdropStyle = useAnimatedStyle(() => ({
		opacity: backdropOpacity.value,
	}));

	if (!visible) return null;

	return (
		<View style={StyleSheet.absoluteFill} pointerEvents="box-none">
			<Pressable style={StyleSheet.absoluteFill} onPress={dismiss}>
				<Animated.View style={[styles.backdrop, backdropStyle]} />
			</Pressable>

			<GestureDetector gesture={pan}>
				<Animated.View style={[styles.panelWrapper, panelStyle]}>
					<PixelPanel style={styles.panel} inset={10}>
						<View style={[styles.content, { paddingBottom: insets.bottom + 18 }]}>
							<Text style={styles.title}>Start Session</Text>
							<Text style={styles.subtitle}>
								Choose your mode, dial in the duration, then begin.
							</Text>

							<Text style={styles.sectionLabel}>Mode</Text>
							<View style={styles.modeRow}>
								{SESSION_PANEL_MODES.map((mode) => (
									<SessionPanelButton
										key={mode}
										label={MODE_DISPLAY[mode]}
										active={mode === selectedMode}
										onPress={() => handleModeChange(mode)}
										style={styles.modeCard}
									/>
								))}
							</View>

							<Text style={styles.sectionLabel}>Duration</Text>
							<View style={styles.durationSection}>
								<DurationDialPicker
									value={selectedDuration}
									onChange={handleDurationChange}
									min={SESSION_DURATION_RANGE.min}
									max={SESSION_DURATION_RANGE.max}
									step={SESSION_DURATION_RANGE.step}
									accent={accent}
									mode={selectedMode}
								/>
							</View>

							<TouchableOpacity
								onPress={handleBegin}
								activeOpacity={0.85}
								style={styles.beginButtonWrap}
							>
								<PixelPanel
									source={HUD_ASSETS.panelSlice2}
									scale={1}
									style={styles.beginButtonPanel}
								>
									<View style={styles.beginButtonInner}>
										<Text style={styles.beginText}>Begin</Text>
									</View>
								</PixelPanel>
							</TouchableOpacity>

							{__DEV__ && (
								<TouchableOpacity
									onPress={handleBeginDevRelax}
									activeOpacity={0.85}
									style={styles.devButtonWrap}
								>
									<PixelPanel
										source={HUD_ASSETS.panelSlice2}
										scale={1}
										style={styles.devButtonPanel}
									>
										<View style={styles.devButtonInner}>
											<Text style={styles.devButtonText}>5s Relax (Dev)</Text>
										</View>
									</PixelPanel>
								</TouchableOpacity>
							)}
						</View>
					</PixelPanel>
				</Animated.View>
			</GestureDetector>
		</View>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "#000",
	},
	panelWrapper: {
		position: "absolute",
		left: 0,
		right: 0,
		height: SCREEN_HEIGHT,
	},
	panel: {
		width: SCREEN_W,
		height: PANEL_HEIGHT,
	},
	content: {
		flex: 1,
	},
	title: {
		color: "#3B2A1A",
		fontSize: 22,
		fontWeight: "500",
		letterSpacing: 0.3,
		textAlign: "center",
		marginTop: 14,
	},
	subtitle: {
		color: "#6E5A48",
		fontSize: 13,
		fontWeight: "600",
		textAlign: "center",
		marginTop: 8,
		marginBottom: 18,
	},
	sectionLabel: {
		color: "#8B7A6A",
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1.2,
		textTransform: "uppercase",
		marginBottom: 10,
	},
	modeRow: {
		flexDirection: "row",
		gap: 10,
		marginBottom: 16,
	},
	modeCard: {
		flex: 1,
		height: 58,
	},
	choicePanel: {
		flex: 1,
	},
	choiceInner: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "transparent",
	},
	choiceText: {
		color: "#5C4A3A",
		fontSize: 15,
		fontWeight: "700",
		textAlign: "center",
	},
	choiceTextActive: {
		color: "#2E2014",
	},
	durationSection: {
		alignItems: "center",
		marginBottom: 6,
	},
	beginButtonWrap: {
		marginTop: "auto",
		alignSelf: "center",
		width: Math.min(SCREEN_W - 72, 300),
		height: 64,
	},
	beginButtonPanel: {
		flex: 1,
	},
	beginButtonInner: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(139, 100, 50, 0.18)",
	},
	beginText: {
		color: "#2E2014",
		fontSize: 18,
		fontWeight: "700",
		letterSpacing: 0.2,
	},
	devButtonWrap: {
		alignSelf: "center",
		width: Math.min(SCREEN_W - 120, 220),
		height: 48,
		marginTop: 10,
	},
	devButtonPanel: {
		flex: 1,
	},
	devButtonInner: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(125, 211, 252, 0.16)",
	},
	devButtonText: {
		color: "#24506A",
		fontSize: 14,
		fontWeight: "700",
		letterSpacing: 0.2,
	},
});
