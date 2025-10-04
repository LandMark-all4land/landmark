import axios from "axios";
import type { Landmark, LandmarksByProvince } from "../types/Landmark";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
});

// 백엔드에서 받은 데이터 구조에 맞춰 수정
export const fetchLandmarks = async (): Promise<Landmark[]> => {
  try {
    const res = await api.get("/api/landmarks");
    // 백엔드에서 지역별로 그룹화된 데이터를 받는 경우
    if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
      const landmarksByProvince: LandmarksByProvince = res.data;
      // 모든 지역의 랜드마크를 하나의 배열로 변환
      return Object.values(landmarksByProvince).flat();
    }
    // 이미 배열 형태로 받는 경우
    return res.data;
  } catch (error) {
    console.error("API 호출 실패, mock 데이터 사용:", error);
    // API 호출 실패 시 제공된 mock 데이터 사용
    return getMockLandmarks();
  }
};

// 제공된 mock 데이터
const getMockLandmarks = (): Landmark[] => {
  const mockData = {
    "강원도": [
      {
        "id": 34,
        "province": "강원도",
        "name": "강릉 경포대",
        "address": "강원특별자치도 강릉시 경포로 365",
        "latitude": 37.795,
        "longitude": 128.896667
      },
      {
        "id": 33,
        "province": "강원도",
        "name": "춘천 남이섬",
        "address": "강원특별자치도 춘천시 남산면 남이섬길 1",
        "latitude": 37.79,
        "longitude": 127.52
      },
      {
        "id": 35,
        "province": "강원도",
        "name": "원주 소금산 출렁다리",
        "address": "강원특별자치도 원주시 지정면 소금산길 12",
        "latitude": 37.36837,
        "longitude": 127.82474
      },
      {
        "id": 32,
        "province": "강원도",
        "name": "평창 대관령 양떼목장",
        "address": "강원특별자치도 평창군 대관령면 대관령마루길 483-32",
        "latitude": 37.685,
        "longitude": 128.753
      },
      {
        "id": 31,
        "province": "강원도",
        "name": "설악산 국립공원",
        "address": "강원특별자치도 양양군 서면 설악로 801",
        "latitude": 37.75,
        "longitude": 128.483333
      }
    ],
    "경기": [
      {
        "id": 77,
        "province": "경기",
        "name": "에버랜드",
        "address": "경기 용인시 처인구 포곡읍 에버랜드로 199",
        "latitude": 37.2946,
        "longitude": 127.2022
      },
      {
        "id": 78,
        "province": "경기",
        "name": "스타필드 하남",
        "address": "경기 하남시 미사대로 750",
        "latitude": 37.545425,
        "longitude": 127.223665
      }
    ]
  };
  
  return Object.values(mockData).flat();
};