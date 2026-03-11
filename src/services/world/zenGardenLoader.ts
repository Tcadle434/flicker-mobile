import mapJson from '../../../assets/tiled/zen-garden-tilemap.json';

export interface ZenGardenMap {
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  tilesetColumns: number;
  data: number[];
}

const map = mapJson as {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: { name: string; data: number[] }[];
  tilesets: { columns: number }[];
};

const visualLayer = map.layers[0];

export const zenGardenMap: ZenGardenMap = {
  width: map.width,
  height: map.height,
  tileWidth: map.tilewidth,
  tileHeight: map.tileheight,
  tilesetColumns: map.tilesets[0].columns,
  data: visualLayer.data,
};
