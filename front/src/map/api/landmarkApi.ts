import axios from "axios";
import type { Landmark } from "../types/Landmark";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
});

// 전체 랜드마크 조회
export const fetchLandmarks = async (): Promise<Landmark[]> => {
  try {
    const res = await api.get("/api/landmarks");

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
