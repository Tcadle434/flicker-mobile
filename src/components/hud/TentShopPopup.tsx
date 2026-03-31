/**
 * Tent Shop Popup
 *
 * Modal for purchasing decoration items.
 * Each item has a pixel-art background tile behind its icon.
 */

import React, { useMemo, useState } from "react";
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	Image,
	StyleSheet,
	Modal,
	Dimensions,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useTentStore } from "../../stores/tentStore";
import { getAllItems, getItemThumbnail, getItemDimensions } from "../../services/tent/tentCatalog";
import PixelPanel from "./PixelPanel";
import type { CatalogItem, ItemCategory } from "../../types/tent";

const THUMB_MAX = 44;

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

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface Props {
	visible: boolean;
	onClose: () => void;
	onSelectItem: (item: CatalogItem) => void;
}

function ShopItem({
	item,
	ownedCount,
	onSelect,
}: {
	item: CatalogItem;
	ownedCount: number;
	onSelect: () => void;
}) {
	const thumbnail = getItemThumbnail(item.id);
	const thumbSize = getThumbSize(item.id);

	return (
		<TouchableOpacity onPress={onSelect} activeOpacity={0.7} style={styles.shopItem}>
			<PixelPanel scale={1} style={styles.itemImageWrap}>
				{thumbnail && (
					<Image
						source={thumbnail}
						style={{ width: thumbSize.width, height: thumbSize.height, alignSelf: 'center' }}
						resizeMode="contain"
					/>
				)}
			</PixelPanel>
			<Text style={styles.itemName} numberOfLines={2}>
				{item.name}
			</Text>
			{ownedCount > 0 && (
				<Text style={styles.ownedText}>Owned{ownedCount > 1 ? ` x${ownedCount}` : ""}</Text>
			)}
			<View style={styles.buyBtn}>
				<Text style={styles.buyText}>{item.price}</Text>
			</View>
		</TouchableOpacity>
	);
}

export default function TentShopPopup({ visible, onClose, onSelectItem }: Props) {
	const ownedItemIds = useTentStore((s) => s.ownedItemIds);

	const [activeCategory, setActiveCategory] = useState<"all" | ItemCategory>("all");
	const [dropdownOpen, setDropdownOpen] = useState(false);

	const activeLabel = CATEGORY_TABS.find((t) => t.key === activeCategory)?.label ?? "All";

	const allItems = useMemo(() => getAllItems(), []);
	const filteredItems = useMemo(
		() =>
			activeCategory === "all"
				? allItems
				: allItems.filter((i) => i.category === activeCategory),
		[allItems, activeCategory]
	);
	const ownedCounts = useMemo(() => {
		const counts = new Map<string, number>();
		for (const id of ownedItemIds) {
			counts.set(id, (counts.get(id) ?? 0) + 1);
		}
		return counts;
	}, [ownedItemIds]);

	const panelWidth = SCREEN_W - 80;
	const panelHeight = SCREEN_H * 0.5;

	return (
		<Modal visible={visible} transparent animationType="none">
			<Animated.View style={styles.overlay} entering={FadeIn.duration(200)}>
				<TouchableOpacity
					style={StyleSheet.absoluteFill}
					activeOpacity={1}
					onPress={onClose}
				/>

				<Animated.View style={styles.center} entering={FadeInDown.duration(300)}>
					{/* Shop label hanging above panel */}
					<View style={styles.shopLabelWrap}>
						<Image
							source={require("../../../assets/ui/shop_label.png")}
							style={styles.shopLabel}
							resizeMode="stretch"
						/>
						<Text style={styles.shopLabelText}>Shop</Text>
					</View>
					<PixelPanel style={{ width: panelWidth, height: panelHeight }} inset={8}>
						{/* Category dropdown trigger */}
						<View style={styles.dropdownWrap}>
							<TouchableOpacity
								onPress={() => setDropdownOpen(!dropdownOpen)}
								activeOpacity={0.7}
								style={styles.dropdownTrigger}
							>
								<Text style={styles.dropdownTriggerText}>{activeLabel}</Text>
								<Text style={styles.dropdownCaret}>
									{dropdownOpen ? "\u25B2" : "\u25BC"}
								</Text>
							</TouchableOpacity>

							{dropdownOpen && (
								<View style={styles.dropdownMenu}>
									{CATEGORY_TABS.map((tab) => (
										<TouchableOpacity
											key={tab.key}
											onPress={() => {
												setActiveCategory(tab.key);
												setDropdownOpen(false);
											}}
											activeOpacity={0.7}
											style={[
												styles.dropdownOption,
												activeCategory === tab.key &&
													styles.dropdownOptionActive,
											]}
										>
											<Text
												style={[
													styles.dropdownOptionText,
													activeCategory === tab.key &&
														styles.dropdownOptionTextActive,
												]}
											>
												{tab.label}
											</Text>
										</TouchableOpacity>
									))}
								</View>
							)}
						</View>

						{/* Item grid */}
						<ScrollView
							showsVerticalScrollIndicator={false}
							contentContainerStyle={styles.grid}
						>
							{filteredItems.map((item) => (
								<ShopItem
									key={item.id}
									item={item}
									ownedCount={ownedCounts.get(item.id) ?? 0}
									onSelect={() => onSelectItem(item)}
								/>
							))}
						</ScrollView>
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
	shopLabelWrap: {
		width: SCREEN_W - 80,
		height: (SCREEN_W - 80) * (128 / 320),
		marginBottom: -20,
		zIndex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	shopLabel: {
		...StyleSheet.absoluteFillObject,
		width: "100%",
		height: "100%",
	},
	shopLabelText: {
		color: "#3B2A1A",
		fontFamily: "Toriko",
		fontSize: 42,
		letterSpacing: 1,
		marginTop: -16,
		textShadowColor: "rgba(255, 220, 160, 0.5)",
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 0,
	},
	dropdownWrap: {
		zIndex: 10,
		marginBottom: 8,
		alignItems: "center",
	},
	dropdownTrigger: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(59, 42, 26, 0.12)",
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 6,
		gap: 6,
	},
	dropdownTriggerText: {
		color: "#3B2A1A",
		fontSize: 12,
		fontWeight: "600",
	},
	dropdownCaret: {
		color: "#3B2A1A",
		fontSize: 8,
	},
	dropdownMenu: {
		position: "absolute",
		top: "100%",
		alignSelf: "center",
		marginTop: 4,
		backgroundColor: "#F5E6D3",
		borderRadius: 6,
		paddingVertical: 4,
		minWidth: 120,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
		elevation: 5,
	},
	dropdownOption: {
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	dropdownOptionActive: {
		backgroundColor: "rgba(59, 42, 26, 0.15)",
	},
	dropdownOptionText: {
		color: "#8B7A6A",
		fontSize: 11,
		fontWeight: "600",
	},
	dropdownOptionTextActive: {
		color: "#3B2A1A",
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 4,
		paddingBottom: 4,
		justifyContent: "center",
	},
	shopItem: {
		width: 85,
		alignItems: "center",
		gap: 3,
	},
	itemImageWrap: {
		width: 50,
		height: 50,
		alignItems: "center",
		justifyContent: "center",
	},
	itemName: {
		color: "#3B2A1A",
		fontSize: 10,
		fontWeight: "600",
		textAlign: "center",
	},
	buyBtn: {
		backgroundColor: "rgba(59, 42, 26, 0.15)",
		paddingHorizontal: 14,
		paddingVertical: 5,
		borderRadius: 6,
	},
	buyBtnDisabled: {
		opacity: 0.4,
	},
	buyText: {
		color: "#3B2A1A",
		fontSize: 12,
		fontWeight: "700",
	},
	buyTextDisabled: {
		color: "#8B7A6A",
	},
	ownedText: {
		color: "#8B7A6A",
		fontSize: 10,
		fontWeight: "500",
	},
});
