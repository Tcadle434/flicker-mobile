/**
 * Decorate Mode HUD
 *
 * Shown when decorating the tent interior.
 * - Done button (top-right) → exit decorate mode
 * - When ghost active: Checkmark + X buttons (right side), Rotate (if rotatable)
 * - Checkmark disabled/red-tinted when ghostValid === false
 */

import React from "react";
import { StyleSheet, TouchableOpacity, Image, View, Text } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDecorateStore } from "../../stores/decorateStore";
import {
	getCatalogItem,
	getAdjacentItemScale,
	normalizeItemScale,
} from "../../services/tent/tentCatalog";
import { HUD_ASSETS } from "./hudAssets";

interface Props {
	onDone: () => void;
	onOpenShop: () => void;
	onExitPreview?: () => void;
	surfacePreviewActive?: boolean;
}

export default function DecorateModeHud({
	onDone,
	onOpenShop,
	onExitPreview,
	surfacePreviewActive = false,
}: Props) {
	const insets = useSafeAreaInsets();
	const ghostItemId = useDecorateStore((s) => s.ghostItemId);
	const ghostPlacementId = useDecorateStore((s) => s.ghostPlacementId);
	const ghostValid = useDecorateStore((s) => s.ghostValid);
	const isPersistingPlacement = useDecorateStore((s) => s.isPersistingPlacement);
	const isPreview = useDecorateStore((s) => s.isPreview);
	const ghostScale = useDecorateStore((s) => s.ghostScale);
	const confirmPlacement = useDecorateStore((s) => s.confirmPlacement);
	const cancelPlacement = useDecorateStore((s) => s.cancelPlacement);
	const rotateGhost = useDecorateStore((s) => s.rotateGhost);
	const decreaseGhostScale = useDecorateStore((s) => s.decreaseGhostScale);
	const increaseGhostScale = useDecorateStore((s) => s.increaseGhostScale);
	const removeGhostItem = useDecorateStore((s) => s.removeGhostItem);

	const item = ghostItemId ? getCatalogItem(ghostItemId) : null;
	const canRotate = item?.rotatable ?? false;
	const hasGhost = !!ghostItemId;
	const isMoving = !!ghostPlacementId;
	const showSurfacePreviewBack = surfacePreviewActive && !hasGhost;
	const normalizedScale = normalizeItemScale(ghostScale);
	const canScaleDown = getAdjacentItemScale(normalizedScale, -1) !== normalizedScale;
	const canScaleUp = getAdjacentItemScale(normalizedScale, 1) !== normalizedScale;

	return (
		<Animated.View
			style={[styles.container, { paddingBottom: insets.bottom }]}
			pointerEvents="box-none"
			entering={FadeIn.duration(200)}
		>
			{/* Done button — top right */}
			<TouchableOpacity
				onPress={isPersistingPlacement ? undefined : onDone}
				activeOpacity={isPersistingPlacement ? 1 : 0.7}
				style={[
					styles.doneBtn,
					{ top: insets.top + 8 },
					isPersistingPlacement && styles.controlBtnDisabled,
				]}
			>
				<Image source={HUD_ASSETS.xClose} style={styles.doneIcon} resizeMode="contain" />
			</TouchableOpacity>

			{/* Placement controls — bottom right, horizontal row */}
			{hasGhost && (
				<Animated.View
					style={[styles.scaleControls, { bottom: insets.bottom + 76 }]}
					entering={FadeIn.duration(200)}
				>
					<TouchableOpacity
						onPress={
							canScaleDown && !isPersistingPlacement ? decreaseGhostScale : undefined
						}
						activeOpacity={canScaleDown && !isPersistingPlacement ? 0.7 : 1}
						style={[
							styles.scaleBtn,
							(!canScaleDown || isPersistingPlacement) && styles.scaleBtnDisabled,
						]}
					>
						<Text style={styles.scaleBtnText}>-</Text>
					</TouchableOpacity>

					<View
						style={[
							styles.scaleReadout,
							isPersistingPlacement && styles.scaleBtnDisabled,
						]}
					>
						<Text style={styles.scaleReadoutLabel}>Size</Text>
						<Text style={styles.scaleReadoutValue}>
							{Math.round(normalizedScale * 100)}%
						</Text>
					</View>

					<TouchableOpacity
						onPress={
							canScaleUp && !isPersistingPlacement ? increaseGhostScale : undefined
						}
						activeOpacity={canScaleUp && !isPersistingPlacement ? 0.7 : 1}
						style={[
							styles.scaleBtn,
							(!canScaleUp || isPersistingPlacement) && styles.scaleBtnDisabled,
						]}
					>
						<Text style={styles.scaleBtnText}>+</Text>
					</TouchableOpacity>
				</Animated.View>
			)}

			{hasGhost && (
				<Animated.View
					style={[styles.placementControls, { bottom: insets.bottom + 16 }]}
					entering={FadeIn.duration(200)}
				>
					{isPersistingPlacement && (
						<View style={styles.savingPill}>
							<Text style={styles.savingText}>Saving...</Text>
						</View>
					)}

					{isPreview ? (
						<>
							{/* Preview mode: Back + Rotate only */}
							{canRotate && (
								<TouchableOpacity
									onPress={isPersistingPlacement ? undefined : rotateGhost}
									activeOpacity={isPersistingPlacement ? 1 : 0.7}
									style={[
										styles.controlBtn,
										isPersistingPlacement && styles.controlBtnDisabled,
									]}
								>
									<Image
										source={HUD_ASSETS.rotate}
										style={styles.controlIcon}
										resizeMode="contain"
									/>
								</TouchableOpacity>
							)}
							<TouchableOpacity
								onPress={isPersistingPlacement ? undefined : onExitPreview}
								activeOpacity={isPersistingPlacement ? 1 : 0.7}
								style={[
									styles.backBtn,
									isPersistingPlacement && styles.controlBtnDisabled,
								]}
							>
								<Text style={styles.backText}>Back</Text>
							</TouchableOpacity>
						</>
					) : (
						<>
							{/* Normal mode: Remove + Rotate + Cancel + Confirm */}
							{isMoving && (
								<TouchableOpacity
									onPress={isPersistingPlacement ? undefined : removeGhostItem}
									activeOpacity={isPersistingPlacement ? 1 : 0.7}
									style={[
										styles.removeBtn,
										isPersistingPlacement && styles.controlBtnDisabled,
									]}
								>
									<Text style={styles.removeText}>Remove</Text>
								</TouchableOpacity>
							)}

							{canRotate && (
								<TouchableOpacity
									onPress={isPersistingPlacement ? undefined : rotateGhost}
									activeOpacity={isPersistingPlacement ? 1 : 0.7}
									style={[
										styles.controlBtn,
										isPersistingPlacement && styles.controlBtnDisabled,
									]}
								>
									<Image
										source={HUD_ASSETS.rotate}
										style={styles.controlIcon}
										resizeMode="contain"
									/>
								</TouchableOpacity>
							)}

							<TouchableOpacity
								onPress={isPersistingPlacement ? undefined : cancelPlacement}
								activeOpacity={isPersistingPlacement ? 1 : 0.7}
								style={[
									styles.controlBtn,
									isPersistingPlacement && styles.controlBtnDisabled,
								]}
							>
								<Image
									source={HUD_ASSETS.xClose}
									style={styles.controlIconLg}
									resizeMode="contain"
								/>
							</TouchableOpacity>

							<TouchableOpacity
								onPress={
									ghostValid && !isPersistingPlacement
										? confirmPlacement
										: undefined
								}
								activeOpacity={ghostValid && !isPersistingPlacement ? 0.7 : 1}
								style={[
									styles.controlBtn,
									(!ghostValid || isPersistingPlacement) &&
										styles.controlBtnDisabled,
								]}
							>
								<Image
									source={HUD_ASSETS.checkmark}
									style={styles.controlIconLg}
									resizeMode="contain"
								/>
							</TouchableOpacity>
						</>
					)}
				</Animated.View>
			)}

			{showSurfacePreviewBack && (
				<Animated.View
					style={[styles.surfacePreviewControls, { bottom: insets.bottom + 16 }]}
					entering={FadeIn.duration(200)}
				>
					<TouchableOpacity
						onPress={isPersistingPlacement ? undefined : onExitPreview}
						activeOpacity={isPersistingPlacement ? 1 : 0.7}
						style={[styles.backBtn, isPersistingPlacement && styles.controlBtnDisabled]}
					>
						<Text style={styles.backText}>Back</Text>
					</TouchableOpacity>
				</Animated.View>
			)}
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		...StyleSheet.absoluteFillObject,
	},
	doneBtn: {
		position: "absolute",
		right: 16,
		width: 48,
		height: 48,
		alignItems: "center",
		justifyContent: "center",
	},
	doneIcon: {
		width: 40,
		height: 40,
	},
	placementControls: {
		position: "absolute",
		right: 16,
		flexDirection: "row",
		gap: 10,
		alignItems: "center",
	},
	scaleControls: {
		position: "absolute",
		right: 16,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	surfacePreviewControls: {
		position: "absolute",
		right: 16,
		flexDirection: "row",
		alignItems: "center",
	},
	controlBtn: {
		width: 48,
		height: 48,
		alignItems: "center",
		justifyContent: "center",
	},
	controlBtnDisabled: {
		opacity: 0.4,
	},
	scaleBtn: {
		width: 40,
		height: 40,
		borderRadius: 12,
		backgroundColor: "rgba(0, 0, 0, 0.48)",
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.12)",
		alignItems: "center",
		justifyContent: "center",
	},
	scaleBtnDisabled: {
		opacity: 0.4,
	},
	scaleBtnText: {
		color: "#FFFFFF",
		fontSize: 24,
		fontWeight: "700",
		lineHeight: 28,
		marginTop: -2,
	},
	scaleReadout: {
		minWidth: 74,
		height: 40,
		borderRadius: 12,
		backgroundColor: "rgba(0, 0, 0, 0.52)",
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.12)",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 10,
	},
	scaleReadoutLabel: {
		color: "rgba(255, 255, 255, 0.7)",
		fontSize: 9,
		fontWeight: "700",
		letterSpacing: 0.8,
		textTransform: "uppercase",
	},
	scaleReadoutValue: {
		color: "#FFFFFF",
		fontSize: 13,
		fontWeight: "700",
		letterSpacing: 0.2,
	},
	savingPill: {
		paddingHorizontal: 12,
		height: 36,
		borderRadius: 18,
		backgroundColor: "rgba(0, 0, 0, 0.58)",
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.12)",
		alignItems: "center",
		justifyContent: "center",
	},
	savingText: {
		color: "#FFFFFF",
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 0.2,
	},
	controlIcon: {
		width: 32,
		height: 32,
	},
	controlIconLg: {
		width: 40,
		height: 40,
	},
	iconDisabled: {
		tintColor: "rgba(200, 80, 80, 0.7)",
	},
	removeBtn: {
		backgroundColor: "rgba(200, 60, 60, 0.5)",
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 6,
	},
	removeText: {
		color: "#fff",
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 0.3,
	},
	backBtn: {
		backgroundColor: "rgba(0, 0, 0, 0.4)",
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 6,
	},
	backText: {
		color: "#fff",
		fontSize: 13,
		fontWeight: "700",
		letterSpacing: 0.3,
	},
});
