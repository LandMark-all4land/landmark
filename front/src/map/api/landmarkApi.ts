import apiClient from "../../api/apiClient";
import type { Landmark } from "../types/Landmark";

// 전체 랜드마크 조회
export const fetchLandmarks = async (): Promise<Landmark[]> => {
  try {
    // ⚠️ 주의: 백엔드 컨트롤러 주소가 "/api/landmark" (단수형)인지 확인하세요!
    const res = await apiClient.get("/api/landmarks"); 

    // 백엔드 응답 구조: { success: true, data: { type: "FeatureCollection", features: [...] } }
    const featureCollection = res.data?.data;
    const features = featureCollection?.features;

    // features가 배열인지 확인 후 변환 (GeoJSON -> Landmark 객체)
    if (Array.isArray(features)) {
      return features.map((feature: any) => {
        const props = feature.properties;
        const coords = feature.geometry?.coordinates; // [경도(lon), 위도(lat)] 순서임

        // ⚡️ 핵심 수정: "landmark.2" -> "2" -> 숫자 2로 변환
        // 만약 feature.id가 없으면 props.id 등을 확인
        const rawId = feature.id || ""; 
        const numericId = parseInt(rawId.split(".")[1], 10);
        // GeoServer 데이터(properties)와 좌표(geometry)를 합쳐서 반환
        return {
          id: isNaN(numericId) ? 0 : numericId, // 숫자가 아니면 0 또는 rawId 그대로 사용          name: props.name,         // GeoServer 컬럼명 확인
          // properties에 이미 lat/lon이 있다면 props.lat 쓰면 됨. 
          // 없다면 geometry에서 꺼내야 함:
          longitude: coords ? coords[0] : 0, 
          latitude: coords ? coords[1] : 0,
          ...props,                 // 나머지 속성들도 다 넣음
        } as Landmark;
      });
    }

    console.error("⚠️ 예상치 못한 응답 구조:", res.data);
    return [];
  } catch (error) {
    console.error("API 호출 실패 (랜드마크 전체 조회):", error);
    return [];
  }
};