export type IndexType = "NDVI" | "NDMI";

import type { GeoJSONGeometry } from "ol/format/GeoJSON";

export interface RasterStat {
  landmarkId: number;
  indexType: IndexType;
  year: number;
  month: number;
  s3Path: string | null;
  valMean: number;
  valMin: number;
  valMax: number;
  valStddev: number;
  geom: GeoJSONGeometry | null;
}
