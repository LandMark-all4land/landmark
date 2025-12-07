import apiClient from "../../api/apiClient";
import type { Landmark } from "../types/Landmark";

// 전체 랜드마크 조회
export const fetchLandmarks = async (): Promise<Landmark[]> => {
  try {
    const res = await apiClient.get("/api/landmarks");

    // 응답 구조: { success: true, data: [...] }
    const arr = res.data?.data;

    if (Array.isArray(arr)) return arr;

    console.error("⚠️ 예상치 못한 응답:", res.data);
    return [];
  } catch (error) {
    console.error("API 호출 실패 (랜드마크 전체 조회):", error);
    return [];
  }
};
