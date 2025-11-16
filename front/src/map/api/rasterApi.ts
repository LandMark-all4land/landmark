// src/map/api/rasterApi.ts
import axios from "axios";
import type { RasterStat } from "../types/RasterStat";

export interface RasterResponse {
  success: boolean;
  data: RasterStat[];
  error: string | null;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
});

export async function fetchLandmarkRasters(
  landmarkId: number,
  year: number,
  month: number
): Promise<RasterStat[]> {
  const res = await api.get<RasterResponse>(
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
