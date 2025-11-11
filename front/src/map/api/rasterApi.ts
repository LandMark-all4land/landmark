// src/map/api/rasterApi.ts
import apiClient from "../../api/apiClient";
import type { RasterStat, IndexType } from "../types/RasterStat";
import type { GeoJSONGeometry } from "ol/format/GeoJSON";

export interface RasterResponse {
  success: boolean;
  data: RasterStat[];
  error: string | null;
}

type NumericLike = number | string | null | undefined;

interface RasterApiRow {
  landmarkId: number;
  indexType: IndexType | string;
  year: number;
  month: number;
  s3Path: string | null;
  valMean: NumericLike;
  valMin: NumericLike;
  valMax: NumericLike;
  valStddev: NumericLike;
  geomJson: string | null;
}

const rasterCdnBase = import.meta.env.VITE_RASTER_BASE_URL;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
});

function parseNumber(value: NumericLike): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (value == null) return 0;
  const fallback = Number(value);
  return Number.isNaN(fallback) ? 0 : fallback;
}

function normalizeGeometry(geomJson: string | null): GeoJSONGeometry | null {
  if (!geomJson) return null;
  try {
    const parsed = JSON.parse(geomJson) as GeoJSONGeometry;
    if (parsed && typeof parsed === "object" && "type" in parsed) {
      return parsed;
    }
  } catch (error) {
    console.error("GeoJSON 파싱 실패", error, geomJson);
  }
  return null;
}

function resolveRasterUrl(path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  if (rasterCdnBase) {
    const base = rasterCdnBase.replace(/\/$/, "");
    const cleaned = path
      .replace(/^s3:\/\/[^/]+/i, "")
      .replace(/^\/*/, "");
    return `${base}/${cleaned}`;
  }

  if (path.startsWith("s3://")) {
    console.warn(
      "S3 경로를 직접 렌더링할 수 없습니다. VITE_RASTER_BASE_URL 환경 변수를 설정하세요.",
      path
    );
    return null;
  }

  console.warn(
    "절대 URL이 아닌 래스터 경로입니다. VITE_RASTER_BASE_URL 환경 변수를 설정하세요.",
    path
  );
  return null;
}

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
