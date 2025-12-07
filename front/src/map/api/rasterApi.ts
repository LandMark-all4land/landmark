// src/map/api/rasterApi.ts
import apiClient from "../../api/apiClient";
import type { RasterStat } from "../types/RasterStat";

export interface RasterResponse {
  success: boolean;
  data: RasterStat[];
  error: string | null;
}

export async function fetchLandmarkRasters(
  landmarkId: number,
  year: number,
  month: number
): Promise<RasterStat[]> {
  const res = await apiClient.get<RasterResponse>(
    `/api/landmarks/${landmarkId}/rasters`,
    {
      params: { year, month },
    }
  );

  if (!res.data.success) {
    throw new Error(res.data.error ?? "래스터 API 실패");
  }

  return res.data.data;
}
