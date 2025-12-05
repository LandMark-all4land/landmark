export type IndexType = "NDVI" | "NDMI";

export interface RasterStat {
  id?: number;
  landmarkId: number;
  indexType: IndexType;
  year: number;
  month: number;
  s3Path: string | null;
  valMean: number;
  valMin: number;
  valMax: number;
  valStddev: number;
  geomJson?: string | null;
  geom?: {
    type: "Polygon";
    coordinates: number[][][]; // 3km 버퍼 폴리곤
  } | null;
}
