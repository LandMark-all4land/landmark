import apiClient from "../../api/apiClient";
import type { AdmBoundary } from "../types/Boundary";

// /api/boundaries → ApiResponse<AdmBoundary[]>
export const fetchAdmBoundaries = async (): Promise<AdmBoundary[]> => {
  const res = await apiClient.get("/api/boundaries");

  // 백엔드 응답이 { success, data, error } 형태
  return res.data.data as AdmBoundary[];
};