/**
 * Onboarding Welcome — Step Orchestrator
 *
 * Drives the active onboarding flow. Renders the current step component
 * with horizontal slide + fade transitions. Supports swipe-back gesture.
 */

import React, { useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, Image, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Asset } from "expo-asset";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	runOnJS,
	Easing,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useOnboardingStore } from "../../src/stores/onboardingStore";
import ProgressIndicator from "../../src/components/onboarding/ProgressIndicator";
import {
	Step0Welcome,
	Step0AppIntro,
	Step1StressEpidemic,
	Step2StressResponse,
	Step3AlwaysOn,
	Step5ProductIntro,
	Step5bFlickerTransition,
	Step6Personalization,
	StepNoisiest,
	StepTransitionToDemo,
	StepCinematicDemo,
	StepPostDemoDialogue,
	Step14ScreenTimeExplain,
	Step15ScreenTimeAuth,
	Step15PermissionReady,
	Step20Paywall,
} from "../../src/components/onboarding/steps";
import { ONBOARDING_WARMUP_ASSETS, warmDemoAssets } from "../../src/components/onboarding/onboardingAssets";

const { width: SCREEN_W } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_W * 0.25;
const SLIDE_OFFSET = SCREEN_W * 0.3;

// Ordered step components
const STEPS: React.ComponentType<{ onNext: () => void }>[] = [
	Step0AppIntro, //  0 - Content (app intro)
	Step0Welcome, //  1 - Dialogue (welcome)
	Step1StressEpidemic, //  2 - Content (Your mind isn't broken)
	Step2StressResponse, //  3 - Content (Stress biology)
	Step3AlwaysOn, //  4 - Content (Notifications hijack)
	Step5ProductIntro, //  5 - Content (Flicker helps)
	Step5bFlickerTransition, //  7 - Dialogue (transition)
	Step6Personalization, //  7 - Content (Goals multi-select)
	StepNoisiest, //  8 - Content (noisiest time)
	StepTransitionToDemo, //  9 - Content (transition to demo)
	StepCinematicDemo, // 10 - Cinematic auto-playing product demo
	StepPostDemoDialogue, // 11 - Dialogue (pretty cool right?)
	Step14ScreenTimeExplain, // 12 - Content (screen time explain) — permission prompt before paywall
	Step15ScreenTimeAuth, // 13 - System (permission) — calls native requestAuthorization
	Step15PermissionReady, // 14 - Content (permission success bridge)
	Step20Paywall, // 15 - Paywall (7-day trial, annual pre-selected)
];

const TIMING_CONFIG = {
	duration: 350,
	easing: Easing.out(Easing.cubic),
};

let onboardingAssetWarmupPromise: Promise<Asset[]> | null = null;

function warmOnboardingAssets() {
	if (!onboardingAssetWarmupPromise) {
		onboardingAssetWarmupPromise = Asset.loadAsync([...ONBOARDING_WARMUP_ASSETS]);
	}

	return onboardingAssetWarmupPromise;
}

export default function OnboardingWelcome() {
	const insets = useSafeAreaInsets();
	const currentStep = useOnboardingStore((s) => s.currentStep);
	const totalSteps = useOnboardingStore((s) => s.totalSteps);
	const nextStep = useOnboardingStore((s) => s.nextStep);
	const previousStep = useOnboardingStore((s) => s.previousStep);

	// Transition state
	const translateX = useSharedValue(0);
	const opacity = useSharedValue(1);
	const isTransitioning = useRef(false);

	useEffect(() => {
		void warmOnboardingAssets();
	}, []);

	// Warm heavy demo assets once user reaches step 5-6
	useEffect(() => {
		if (currentStep >= 5) {
			void warmDemoAssets();
		}
	}, [currentStep >= 5]);

	const clearTransition = useCallback(() => {
		isTransitioning.current = false;
	}, []);

	// After fade-out completes, snap position and fade back in (forward)
	const slideInForward = useCallback(() => {
		translateX.value = SLIDE_OFFSET;
		nextStep();
		translateX.value = withTiming(0, TIMING_CONFIG);
		opacity.value = withTiming(1, { duration: 250 }, () => {
			runOnJS(clearTransition)();
		});
	}, [nextStep, translateX, opacity, clearTransition]);

	// After fade-out completes, snap position and fade back in (backward)
	const slideInBackward = useCallback(() => {
		translateX.value = -SLIDE_OFFSET;
		previousStep();
		translateX.value = withTiming(0, TIMING_CONFIG);
		opacity.value = withTiming(1, { duration: 250 }, () => {
			runOnJS(clearTransition)();
		});
	}, [previousStep, translateX, opacity, clearTransition]);

	// Animate forward (slide left + fade)
	const animateForward = useCallback(() => {
		if (isTransitioning.current) return;
		isTransitioning.current = true;

		translateX.value = withTiming(-SLIDE_OFFSET, TIMING_CONFIG);
		opacity.value = withTiming(0, { duration: 200 }, () => {
			runOnJS(slideInForward)();
		});
	}, [slideInForward, translateX, opacity]);

	// Animate backward (slide right + fade)
	const animateBackward = useCallback(() => {
		if (isTransitioning.current || currentStep === 0) return;
		isTransitioning.current = true;

		translateX.value = withTiming(SLIDE_OFFSET, TIMING_CONFIG);
		opacity.value = withTiming(0, { duration: 200 }, () => {
			runOnJS(slideInBackward)();
		});
	}, [slideInBackward, currentStep, translateX, opacity]);

	// Swipe-back gesture
	const swipeGesture = Gesture.Pan()
		.activeOffsetX(30)
		.onEnd((event) => {
			if (event.translationX > SWIPE_THRESHOLD && event.velocityX > 0) {
				runOnJS(animateBackward)();
			}
		});

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }],
		opacity: opacity.value,
	}));

	const StepComponent = STEPS[currentStep];
	if (!StepComponent) return null;

	return (
		<View style={styles.root}>
			<StatusBar style="light" />
			<View style={styles.container}>
				<View
					style={styles.assetWarmupLayer}
					pointerEvents="none"
					accessible={false}
					collapsable={false}
				>
					{ONBOARDING_WARMUP_ASSETS.map((source, index) => (
						<Image key={index} source={source} style={styles.assetWarmupImage} />
					))}
				</View>
				<GestureDetector gesture={swipeGesture}>
					<Animated.View style={[styles.stepContainer, animatedStyle]}>
						<StepComponent onNext={animateForward} />
					</Animated.View>
				</GestureDetector>
				{/* Progress bar + back button overlay */}
				<View
					style={[styles.progressOverlay, { top: insets.top + 8 }]}
					pointerEvents="box-none"
				>
					<View style={styles.progressRow} pointerEvents="box-none">
						{currentStep > 0 ? (
							<Pressable onPress={animateBackward} style={styles.backButton} hitSlop={8}>
								<Text style={styles.backArrow}>‹</Text>
							</Pressable>
						) : (
							<View style={styles.backButtonPlaceholder} />
						)}
						<View style={styles.progressBarWrapper}>
							<ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
						</View>
						<View style={styles.backButtonPlaceholder} />
					</View>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: "#0A0A0B",
	},
	container: {
		flex: 1,
		backgroundColor: "#0A0A0B",
	},
	stepContainer: {
		flex: 1,
	},
	assetWarmupLayer: {
		position: "absolute",
		left: -16,
		top: -16,
	},
	assetWarmupImage: {
		width: 2,
		height: 2,
		opacity: 0.01,
	},
	progressOverlay: {
		position: "absolute",
		left: 0,
		right: 0,
		zIndex: 10,
		paddingHorizontal: 20,
	},
	progressRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingBottom: 16,
	},
	backButton: {
		width: 34,
		height: 34,
		alignItems: "center",
		justifyContent: "center",
	},
	backButtonPlaceholder: {
		width: 34,
		height: 34,
	},
	backArrow: {
		color: "#1A1A1A",
		fontSize: 34,
		fontWeight: "300",
		lineHeight: 34,
		marginTop: -2,
	},
	progressBarWrapper: {
		flex: 1,
	},
});
