import React, { useEffect, useMemo, useRef } from "react";
import { Dimensions, StyleSheet } from "react-native";
import { Canvas, Fill, Rect, LinearGradient, vec, useImage } from "@shopify/react-native-skia";
import { useSharedValue } from "react-native-reanimated";
import TilemapRenderer from "./TilemapRenderer";
import AnimatedSprite from "./AnimatedSprite";
import { useSceneClock } from "../../hooks/useSceneClock";
import { useRenderDiagnostics } from "../../lib/perfDiagnostics";
import zenGardenMapJson from "../../../assets/tiled/zen-garden-tilemap.json";
import focusNookMapJson from "../../../assets/tiled/focus_nook.json";
import type { SceneQualityProfile } from "../../types";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

type SceneVariant = "relax" | "focus";

interface SceneMap {
	width: number;
	height: number;
	tileWidth: number;
	tileHeight: number;
	tilesetColumns: number;
	data: number[];
}

interface SceneVariantConfig {
	map: SceneMap;
	tilesetSource: number;
	spriteSource: number;
	frameWidth: number;
	frameHeight: number;
	frameCount: number;
	columns: number;
	fps: number;
	flickerTileX: number;
	flickerTileY: number;
	flickerDisplayTiles: number;
	flickerOffsetXPx: number;
	overlayColor: string;
	backgroundColor: string;
	topGradientColors: string[];
	bottomGradientColors: string[];
}

interface Props {
	onReady?: () => void;
	variant?: SceneVariant;
	active?: boolean;
	qualityProfile?: SceneQualityProfile;
}

const normalizeSceneMap = (mapJson: {
	width: number;
	height: number;
	tilewidth: number;
	tileheight: number;
	layers: { name?: string; data?: number[] }[];
	tilesets: { columns: number }[];
}): SceneMap => {
	const visualLayer = mapJson.layers[0];

	return {
		width: mapJson.width,
		height: mapJson.height,
		tileWidth: mapJson.tilewidth,
		tileHeight: mapJson.tileheight,
		tilesetColumns: mapJson.tilesets[0]?.columns ?? 1,
		data: visualLayer?.data ?? [],
	};
};

const zenGardenMap = normalizeSceneMap(zenGardenMapJson as Parameters<typeof normalizeSceneMap>[0]);
const focusNookMap = normalizeSceneMap(focusNookMapJson as Parameters<typeof normalizeSceneMap>[0]);

const SCENE_VARIANTS: Record<SceneVariant, SceneVariantConfig> = {
	relax: {
		map: zenGardenMap,
		tilesetSource: require("../../../assets/tiled/zen-garden-tileset.png"),
		spriteSource: require("../../../assets/sprites/flicker_calm_meditate.png"),
		frameWidth: 512,
		frameHeight: 293,
		frameCount: 61,
		columns: 8,
		fps: 12,
		flickerTileX: 24,
		flickerTileY: 62,
		flickerDisplayTiles: 14,
		flickerOffsetXPx: 0,
		overlayColor: "rgba(0,0,0,0.7)",
		backgroundColor: "#0A0A0B",
		topGradientColors: ["#0A0A0B", "#0A0A0B", "#0A0A0B00"],
		bottomGradientColors: ["#0A0A0B00", "#0A0A0B"],
	},
	focus: {
		map: focusNookMap,
		tilesetSource: require("../../../assets/tiled/focus_nook.png"),
		spriteSource: require("../../../assets/sprites/flicker_neutral_focus_trimmed.png"),
		frameWidth: 128,
		frameHeight: 144,
		frameCount: 61,
		columns: 8,
		fps: 10.5,
		flickerTileX: 38,
		flickerTileY: 69,
		flickerDisplayTiles: 12,
		flickerOffsetXPx: -6,
		overlayColor: "rgba(8,10,12,0.46)",
		backgroundColor: "#0B0C10",
		topGradientColors: ["#08090B", "#08090B", "#08090B00"],
		bottomGradientColors: ["#08090B00", "#08090B"],
	},
};

export default function ZenGardenScene({
	onReady,
	variant = "relax",
	active = true,
	qualityProfile = "full",
}: Props) {
	useRenderDiagnostics("ZenGardenScene");
	const sceneConfig = SCENE_VARIANTS[variant];
	const tileset = useImage(sceneConfig.tilesetSource);
	const spriteSheet = useImage(sceneConfig.spriteSource);
	const animationActive = active && qualityProfile !== "paused";
	const sceneMaxFps = qualityProfile === "reduced" ? 24 : 30;
	const sceneClock = useSceneClock({
		active: animationActive,
		label: `zen-garden:${variant}`,
		maxFps: sceneMaxFps,
	});

	const {
		width: mapWidth,
		height: mapHeight,
		tileWidth,
		tileHeight,
		tilesetColumns,
		data,
	} = sceneConfig.map;

	const { scale, offsetY, mapPixelH } = useMemo(() => {
		const s = SCREEN_W / (mapWidth * tileWidth);
		const mph = mapHeight * tileHeight * s;
		const oY = (SCREEN_H - mph) / 2;
		return { scale: s, offsetY: oY, mapPixelH: mph };
	}, [mapHeight, mapWidth, tileHeight, tileWidth]);

	const flickerHeight = sceneConfig.flickerDisplayTiles * tileWidth * scale;
	const flickerWidth = flickerHeight * (sceneConfig.frameWidth / sceneConfig.frameHeight);
	const flickerTargetX =
		sceneConfig.flickerTileX * tileWidth * scale -
		flickerWidth / 2 +
		sceneConfig.flickerOffsetXPx;
	const flickerTargetY =
		offsetY + sceneConfig.flickerTileY * tileWidth * scale - flickerHeight / 2;

	const flickerX = useSharedValue(flickerTargetX);
	const flickerY = useSharedValue(flickerTargetY);

	const allLoaded = !!tileset && !!spriteSheet;
	const firedRef = useRef(false);

	useEffect(() => {
		if (allLoaded && !firedRef.current) {
			firedRef.current = true;
			onReady?.();
		}
	}, [allLoaded, onReady]);

	useEffect(() => {
		flickerX.value = flickerTargetX;
		flickerY.value = flickerTargetY;
	}, [flickerTargetX, flickerTargetY, flickerX, flickerY]);

	if (!allLoaded) return null;

	return (
		<Canvas style={styles.canvas}>
			<Fill color={sceneConfig.backgroundColor} />

			<TilemapRenderer
				tileset={tileset}
				tilesetColumns={tilesetColumns}
				tileWidth={tileWidth}
				tileHeight={tileHeight}
				mapWidth={mapWidth}
				mapHeight={mapHeight}
				data={data}
				scale={scale}
				offsetY={offsetY}
				screenHeight={SCREEN_H}
			/>

			<Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H} color={sceneConfig.overlayColor} />

			<AnimatedSprite
				image={spriteSheet}
				frameWidth={sceneConfig.frameWidth}
				frameHeight={sceneConfig.frameHeight}
				frameCount={sceneConfig.frameCount}
				columns={sceneConfig.columns}
				fps={sceneConfig.fps}
				x={flickerX}
				y={flickerY}
				width={flickerWidth}
				height={flickerHeight}
				nearestFilter={false}
				active={animationActive}
				clock={sceneClock}
			/>

			<Rect x={0} y={0} width={SCREEN_W} height={offsetY + 80}>
				<LinearGradient
					start={vec(0, 0)}
					end={vec(0, offsetY + 80)}
					colors={sceneConfig.topGradientColors}
				/>
			</Rect>

			<Rect x={0} y={offsetY + mapPixelH - 100} width={SCREEN_W} height={100}>
				<LinearGradient
					start={vec(0, offsetY + mapPixelH - 100)}
					end={vec(0, offsetY + mapPixelH)}
					colors={sceneConfig.bottomGradientColors}
				/>
			</Rect>
		</Canvas>
	);
}

const styles = StyleSheet.create({
	canvas: {
		flex: 1,
		width: SCREEN_W,
		height: SCREEN_H,
	},
});
