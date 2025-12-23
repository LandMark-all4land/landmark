// src/map/api/riskApi.ts
import apiClient from "../../api/apiClient";

export interface RiskData {
  landmarkId: number;
  year: number;
  month: number;
  riskScore: number;
  riskLevelDescription: string;
}

export interface ApiError {
  message: string;
  code: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
}

export const fetchLandmarkRisk = async (
  landmarkId: number,
  year: number,
  month: number
): Promise<RiskData | null> => {
  try {
    const res = await apiClient.get<ApiResponse<RiskData>>(
      `/api/landmarks/${landmarkId}/risk`,
      {
        // year, month → @RequestParam 으로 전달됨
        params: { year, month },
      }
    );

    if (!res.data?.success || !res.data.data) {
      console.error(
        res.data?.error?.message || "risk api 실패",
        res.data?.error?.code
      );
      return null;
    }

    return res.data.data;
  } catch (err) {
    console.error("risk api 호출 실패:", err);
    return null;
  }
};
