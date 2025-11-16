export type IndexType = "NDVI" | "NDMI";

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
  geom: {
    type: "Polygon";
    coordinates: number[][][]; // 3km 버퍼 폴리곤
  };
}
