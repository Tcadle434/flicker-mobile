import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useCurrencyStore } from "../../stores/currencyStore";
import { HUD_ASSETS } from "./hudAssets";
import PixelPanel from "./PixelPanel";

export default function LightBalanceDisplay() {
	const balance = useCurrencyStore((s) => s.balance);

	return (
		<PixelPanel scale={1} style={styles.panel}>
			<View style={styles.row}>
				{HUD_ASSETS.lightCrystal ? (
					<Image
						source={HUD_ASSETS.lightCrystal}
						style={styles.icon}
						resizeMode="contain"
					/>
				) : (
					<View style={styles.fallbackIcon} />
				)}
				<Text style={styles.text}>{balance.toLocaleString()}</Text>
			</View>
		</PixelPanel>
	);
}

const styles = StyleSheet.create({
	panel: {
		width: 110,
		height: 42,
	},
	row: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		paddingHorizontal: 4,
	},
	icon: {
		width: 30,
		height: 30,
		marginTop: -10,
	},
	fallbackIcon: {
		width: 14,
		height: 14,
		borderRadius: 7,
		backgroundColor: "#5EEAD4",
	},
	text: {
		color: "#432925",
		fontFamily: "Toriko",
		fontSize: 20,
		marginTop: 6,
		letterSpacing: 0.5,
	},
});
