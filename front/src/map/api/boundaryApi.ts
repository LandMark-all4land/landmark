import axios from "axios";
import type { AdmBoundary } from "../types/Boundary";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
});

// /api/boundaries → ApiResponse<AdmBoundary[]>
export const fetchAdmBoundaries = async (): Promise<AdmBoundary[]> => {
  const res = await api.get("/api/boundaries");

  // 백엔드 응답이 { success, data, error } 형태
  return res.data.data as AdmBoundary[];
};