/**
 * Item Tray
 *
 * Bottom panel shown in Place sub-mode.
 * Displays owned items as a scrollable grid.
 * If no items owned, shows a prompt to visit the shop.
 */

import React, { useState } from "react";
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	Image,
	StyleSheet,
	Dimensions,
} from "react-native";
import Animated, { SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTentStore } from "../../stores/tentStore";
import { useDecorateStore } from "../../stores/decorateStore";
import {
	getCatalogItem,
	getItemThumbnail,
	getItemDimensions,
} from "../../services/tent/tentCatalog";
import PixelPanel from "./PixelPanel";
import TentDecorateModeToggle from "./TentDecorateModeToggle";
import type { ItemCategory } from "../../types/tent";

const THUMB_MAX = 48;

/** Scale sprite to fit container — 1x for everything, keeps natural size differences */
function getThumbSize(itemId: string): { width: number; height: number } {
	const dims = getItemDimensions(itemId, "down");
	if (!dims) return { width: THUMB_MAX, height: THUMB_MAX };
	return { width: dims.w, height: dims.h };
}

const CATEGORY_TABS: { key: "all" | ItemCategory; label: string }[] = [
	{ key: "all", label: "All" },
	{ key: "furniture", label: "Furniture" },
	{ key: "lighting", label: "Lighting" },
	{ key: "plants", label: "Plants" },
	{ key: "rugs", label: "Rugs" },
	{ key: "wall_art", label: "Wall Art" },
	{ key: "ambient", label: "Decor" },
	{ key: "music", label: "Music" },
];

const { width: SCREEN_W } = Dimensions.get("window");
const PANEL_HEIGHT = 196;

interface Props {
	onOpenShop: () => void;
}

export default function ItemTray({ onOpenShop }: Props) {
	const insets = useSafeAreaInsets();
	const ownedItemIds = useTentStore((s) => s.ownedItemIds);
	const placements = useTentStore((s) => s.placements);
	const startPlacing = useDecorateStore((s) => s.startPlacing);
	const switchToEditMode = useDecorateStore((s) => s.switchToEditMode);
	const ghostItemId = useDecorateStore((s) => s.ghostItemId);
	const [activeCategory, setActiveCategory] = useState<"all" | ItemCategory>("all");

	// Don't show tray when ghost is active
	if (ghostItemId) return null;

	// Deduplicate owned IDs and compute available count (owned - placed)
	const uniqueOwnedIds = [...new Set(ownedItemIds)];
	const availableCounts = new Map<string, number>();
	for (const id of uniqueOwnedIds) {
		const owned = ownedItemIds.filter((oid) => oid === id).length;
		const placed = placements.filter((p) => p.itemId === id).length;
		const available = owned - placed;
		if (available > 0) {
			const item = getCatalogItem(id);
			if (item && (activeCategory === "all" || item.category === activeCategory)) {
				availableCounts.set(id, available);
			}
		}
	}

	const panelWidth = SCREEN_W - 24;

	return (
		<Animated.View
			style={[styles.wrapper, { paddingBottom: insets.bottom + 8 }]}
			entering={SlideInDown.duration(300)}
		>
			<PixelPanel style={{ width: panelWidth, height: PANEL_HEIGHT }} inset={8}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.headerText}>Owned Items</Text>
					<TentDecorateModeToggle
						activeMode="place"
						onSelectItems={() => undefined}
						onSelectRoom={switchToEditMode}
					/>
				</View>

				{/* Category tabs */}
				<ScrollView
					horizontal
					style={styles.categoryScroller}
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.categoryRow}
				>
					{CATEGORY_TABS.map((tab) => (
						<TouchableOpacity
							key={tab.key}
							onPress={() => setActiveCategory(tab.key)}
							activeOpacity={0.7}
							style={[
								styles.categoryTab,
								activeCategory === tab.key && styles.categoryTabActive,
							]}
						>
							<Text
								style={[
									styles.categoryTabText,
									activeCategory === tab.key && styles.categoryTabTextActive,
								]}
							>
								{tab.label}
							</Text>
						</TouchableOpacity>
					))}
				</ScrollView>

				{ownedItemIds.length === 0 ? (
					// Empty state — nothing purchased yet
					<View style={styles.emptyState}>
						<Text style={styles.emptyText}>
							You need to buy items from the shop first!
						</Text>
						<TouchableOpacity
							onPress={onOpenShop}
							activeOpacity={0.7}
							style={styles.shopLink}
						>
							<Text style={styles.shopLinkText}>Open Shop</Text>
						</TouchableOpacity>
					</View>
				) : availableCounts.size === 0 ? (
					// All owned items are placed
					<View style={styles.emptyState}>
						<Text style={styles.emptyText}>
							All items placed! Buy more from the shop.
						</Text>
						<TouchableOpacity
							onPress={onOpenShop}
							activeOpacity={0.7}
							style={styles.shopLink}
						>
							<Text style={styles.shopLinkText}>Open Shop</Text>
						</TouchableOpacity>
					</View>
				) : (
					// Item grid — only items with available (unplaced) copies
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.grid}
					>
						{[...availableCounts.entries()].map(([itemId, count]) => {
							const item = getCatalogItem(itemId);
							const thumbnail = getItemThumbnail(itemId);
							if (!item || !thumbnail) return null;

							const thumbSize = getThumbSize(itemId);

							return (
								<TouchableOpacity
									key={itemId}
									onPress={() => startPlacing(itemId)}
									activeOpacity={0.7}
									style={styles.itemSlot}
								>
									<View style={styles.thumbWrap}>
										<Image
											source={thumbnail}
											style={{
												width: thumbSize.width,
												height: thumbSize.height,
											}}
											resizeMode="contain"
										/>
										{count > 1 && (
											<View style={styles.countBadge}>
												<Text style={styles.countText}>x{count}</Text>
											</View>
										)}
									</View>
									<Text style={styles.itemName} numberOfLines={1}>
										{item.name}
									</Text>
								</TouchableOpacity>
							);
						})}
					</ScrollView>
				)}
			</PixelPanel>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		position: "absolute",
		bottom: 0,
		left: 12,
		right: 12,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 10,
	},
	headerText: {
		color: "#3B2A1A",
		fontSize: 16,
		fontWeight: "700",
		letterSpacing: 0.3,
	},
	emptyState: {
		alignItems: "center",
		paddingVertical: 16,
		gap: 10,
	},
	emptyText: {
		color: "#5C4A3A",
		fontSize: 14,
		fontWeight: "500",
		textAlign: "center",
	},
	shopLink: {
		backgroundColor: "rgba(59, 42, 26, 0.15)",
		paddingHorizontal: 20,
		paddingVertical: 8,
		borderRadius: 8,
	},
	shopLinkText: {
		color: "#3B2A1A",
		fontSize: 14,
		fontWeight: "700",
	},
	categoryRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 2,
		paddingVertical: 1,
	},
	categoryScroller: {
		flexGrow: 0,
		marginBottom: 8,
		maxHeight: 30,
	},
	categoryTab: {
		minHeight: 22,
		justifyContent: "center",
		paddingHorizontal: 10,
		paddingVertical: 2,
		borderRadius: 6,
		backgroundColor: "rgba(59, 42, 26, 0.08)",
	},
	categoryTabActive: {
		backgroundColor: "rgba(59, 42, 26, 0.2)",
	},
	categoryTabText: {
		color: "#8B7A6A",
		fontSize: 10,
		fontWeight: "600",
		lineHeight: 12,
	},
	categoryTabTextActive: {
		color: "#3B2A1A",
	},
	grid: {
		gap: 12,
		paddingVertical: 4,
	},
	itemSlot: {
		width: 64,
		alignItems: "center",
		gap: 5,
	},
	thumbWrap: {
		width: 48,
		height: 48,
		alignItems: "center",
		justifyContent: "center",
	},
	itemName: {
		color: "#5C4A3A",
		fontSize: 10,
		fontWeight: "600",
		textAlign: "center",
	},
	countBadge: {
		position: "absolute",
		top: -2,
		right: -2,
		backgroundColor: "rgba(59, 42, 26, 0.7)",
		borderRadius: 8,
		paddingHorizontal: 5,
		paddingVertical: 1,
	},
	countText: {
		color: "#fff",
		fontSize: 9,
		fontWeight: "700",
	},
});
