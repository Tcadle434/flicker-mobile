/**
 * Session Complete Popup
 *
 * PixelPanel overlay shown on the home screen after completing
 * a session. Awards currency, logs the session, and refreshes mood/streak.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal, Dimensions } from "react-native";
import Animated, { FadeIn, FadeInDown, useSharedValue } from "react-native-reanimated";
import { Canvas, useImage } from "@shopify/react-native-skia";
import { useSessionStore } from "../../stores/sessionStore";
import { useCurrencyStore } from "../../stores/currencyStore";
import { useStreakStore } from "../../stores/streakStore";
import { useMoodStore } from "../../stores/moodStore";
import { cancelStreakReminder } from "../../services/notifications/notificationService";
import { logSession } from "../../services/api/sessionLogService";
import AnimatedSprite from "../world/AnimatedSprite";
import PixelPanel from "./PixelPanel";
import { HUD_ASSETS } from "./hudAssets";

const { width: SCREEN_W } = Dimensions.get("window");
const PANEL_WIDTH = Math.min(SCREEN_W - 48, 320);

// Flicker calm meditate spritesheet
const SPRITE_FRAME_W = 512;
const SPRITE_FRAME_H = 293;
const SPRITE_FRAME_COUNT = 61;
const SPRITE_COLUMNS = 8;
const SPRITE_FPS = 12;
const SPRITE_DISPLAY_W = PANEL_WIDTH - 40;
const SPRITE_DISPLAY_H = SPRITE_DISPLAY_W * (SPRITE_FRAME_H / SPRITE_FRAME_W);

interface Props {
	onOpenShop?: () => void;
}

export default function SessionCompletePopup({ onOpenShop }: Props) {
	const status = useSessionStore((s) => s.status);
	const sessionId = useSessionStore((s) => s.sessionId);
	const mode = useSessionStore((s) => s.mode);
	const completedDurationMinutes = useSessionStore((s) => s.completedDurationMinutes);
	const durationMinutes = useSessionStore((s) => s.durationMinutes);
	const targetSeconds = useSessionStore((s) => s.targetSeconds);
	const elapsedSeconds = useSessionStore((s) => s.elapsed);
	const resetSession = useSessionStore((s) => s.resetSession);
	const awardSessionCompletion = useCurrencyStore((s) => s.awardSessionCompletion);
	const lightBalance = useCurrencyStore((s) => s.balance);
	const fetchStreak = useStreakStore((s) => s.fetchStreak);
	const refreshMood = useMoodStore((s) => s.refreshMood);

	const [earnedLight, setEarnedLight] = useState(0);
	const processedRef = useRef<string | null>(null);

	const visible = status === "completed";
	const duration = completedDurationMinutes > 0 ? completedDurationMinutes : durationMinutes;

	const title = useMemo(() => {
		if (mode === "focus") return "Focus complete.";
		if (mode === "move") return "Move complete.";
		return "Reset complete.";
	}, [mode]);

	// Run side effects when session completes
	useEffect(() => {
		if (!visible || !sessionId || processedRef.current === sessionId) return;
		processedRef.current = sessionId;

		let cancelled = false;
		(async () => {
			const result = await awardSessionCompletion({
				sessionId,
				mode,
				durationMinutes: duration,
			});
			if (cancelled) return;
			setEarnedLight(result.amount);

			await logSession({
				sessionId,
				mode,
				targetSeconds,
				elapsedSeconds,
				status: "completed",
				lightEarned: result.amount,
			});

			if (cancelled) return;
			await refreshMood();
			fetchStreak();
		})();

		cancelStreakReminder();
		return () => {
			cancelled = true;
		};
	}, [
		visible,
		sessionId,
		mode,
		duration,
		targetSeconds,
		elapsedSeconds,
		awardSessionCompletion,
		refreshMood,
		fetchStreak,
	]);

	const handleDismiss = useCallback(() => {
		setEarnedLight(0);
		resetSession();
	}, [resetSession]);

	const handleShop = useCallback(() => {
		setEarnedLight(0);
		resetSession();
		onOpenShop?.();
	}, [resetSession, onOpenShop]);

	const meditateSheet = useImage(require("../../../assets/sprites/flicker_calm_meditate.png"));
	const spriteX = useSharedValue((PANEL_WIDTH - 40 - SPRITE_DISPLAY_W) / 2);
	const spriteY = useSharedValue(0);

	if (!visible) return null;

	return (
		<Modal visible transparent animationType="none">
			<Animated.View style={styles.overlay} entering={FadeIn.duration(200)}>
				<TouchableOpacity
					style={StyleSheet.absoluteFill}
					activeOpacity={1}
					onPress={handleDismiss}
				/>

				<Animated.View style={styles.center} entering={FadeInDown.duration(300)}>
					<PixelPanel style={styles.panel} inset={10}>
						<View style={styles.content}>
							{/* X close — top right */}
							<TouchableOpacity
								onPress={handleDismiss}
								activeOpacity={0.7}
								style={styles.closeBtn}
							>
								<Image
									source={HUD_ASSETS.xClose}
									style={styles.closeIcon}
									resizeMode="contain"
								/>
							</TouchableOpacity>

							{/* Title */}
							<Text style={styles.title}>{title}</Text>

							{/* Light earned */}
							<View style={styles.lightRow}>
								<Image
									source={HUD_ASSETS.lightCrystal}
									style={styles.lightIcon}
									resizeMode="contain"
								/>
								<Text style={styles.earnedText}>+{earnedLight} light earned</Text>
							</View>
							<Text style={styles.totalText}>
								total {lightBalance.toLocaleString()}
							</Text>

							{/* Flicker meditate sprite */}
							{meditateSheet && (
								<View style={styles.spriteWrap}>
									<Canvas style={styles.spriteCanvas} pointerEvents="none">
										<AnimatedSprite
											image={meditateSheet}
											frameWidth={SPRITE_FRAME_W}
											frameHeight={SPRITE_FRAME_H}
											frameCount={SPRITE_FRAME_COUNT}
											columns={SPRITE_COLUMNS}
											fps={SPRITE_FPS}
											x={spriteX}
											y={spriteY}
											width={SPRITE_DISPLAY_W}
											height={SPRITE_DISPLAY_H}
											nearestFilter={false}
										/>
									</Canvas>
								</View>
							)}

							{/* Subtitle */}
							<Text style={styles.subtitle}>
								Spend your light to decorate{"\n"}Flicker's sanctuary at the{" "}
								<Text style={styles.shopLink} onPress={handleShop}>
									Shop
								</Text>
							</Text>

							{/* Continue button — matches SessionPanel mode buttons */}
							<TouchableOpacity
								onPress={handleDismiss}
								activeOpacity={0.85}
								style={styles.continueBtnWrap}
							>
								<PixelPanel
									source={HUD_ASSETS.panelSlice2}
									scale={1}
									style={styles.continueBtnPanel}
								>
									<View style={styles.continueBtnInner}>
										<Text style={styles.continueText}>Continue</Text>
									</View>
								</PixelPanel>
							</TouchableOpacity>
						</View>
					</PixelPanel>
				</Animated.View>
			</Animated.View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.6)",
		justifyContent: "center",
		alignItems: "center",
	},
	center: {
		alignItems: "center",
	},
	panel: {
		width: PANEL_WIDTH,
		height: 420,
	},
	content: {
		alignItems: "center",
		paddingTop: 8,
		paddingBottom: 4,
	},
	closeBtn: {
		position: "absolute",
		top: -4,
		right: -4,
		width: 36,
		height: 36,
		alignItems: "center",
		justifyContent: "center",
		zIndex: 1,
	},
	closeIcon: {
		width: 28,
		height: 28,
	},
	title: {
		color: "#3B2A1A",
		fontSize: 18,
		fontWeight: "500",
		letterSpacing: 0.3,
		textAlign: "center",
		marginTop: 4,
		marginBottom: 16,
	},
	lightRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	lightIcon: {
		width: 32,
		height: 32,
		marginTop: -2,
	},
	earnedText: {
		color: "#432925",
		fontFamily: "Toriko",
		fontSize: 34,
		marginTop: 14,
	},
	totalText: {
		color: "#8B7A6A",
		fontSize: 12,
		fontWeight: "500",
		marginTop: 2,
		marginBottom: 6,
	},
	spriteWrap: {
		width: SPRITE_DISPLAY_W,
		height: SPRITE_DISPLAY_H,
		marginBottom: 6,
	},
	spriteCanvas: {
		width: SPRITE_DISPLAY_W,
		height: SPRITE_DISPLAY_H,
	},
	subtitle: {
		color: "#8B7A6A",
		fontSize: 12,
		textAlign: "center",
		lineHeight: 18,
		marginBottom: 14,
	},
	shopLink: {
		color: "#3B2A1A",
		fontWeight: "700",
		textDecorationLine: "underline",
	},
	continueBtnWrap: {
		width: PANEL_WIDTH - 60,
		height: 52,
	},
	continueBtnPanel: {
		flex: 1,
	},
	continueBtnInner: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(139, 100, 50, 0.18)",
	},
	continueText: {
		color: "#2E2014",
		fontSize: 16,
		fontWeight: "700",
		letterSpacing: 0.2,
	},
});
