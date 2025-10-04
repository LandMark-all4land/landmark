import React, { useEffect, useState, useMemo } from "react";
import MapView from "./components/MapView";
import LandmarkList from "./components/LandmarkList";
import ProvinceSelector from "./components/ProvinceSelector";
import type { Landmark, LandmarksByProvince } from "./types/Landmark";
import { fetchLandmarks } from "./api/landmarkApi";

const MapPage: React.FC = () => {
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  // 백엔드에서 받은 데이터를 지역별로 그룹화
  const landmarksByProvince: LandmarksByProvince = useMemo(() => {
    return landmarks.reduce((acc, landmark) => {
      const province = landmark.province;
      if (!acc[province]) {
        acc[province] = [];
      }
      acc[province].push(landmark);
      return acc;
    }, {} as LandmarksByProvince);
  }, [landmarks]);

  // 선택된 지역의 랜드마크들
  const filteredLandmarks = useMemo(() => {
    if (!selectedProvince) return [];
    return landmarksByProvince[selectedProvince] || [];
  }, [selectedProvince, landmarksByProvince]);

  useEffect(() => {
    fetchLandmarks().then(setLandmarks).catch(console.error);
  }, []);

  const handleProvinceSelect = (province: string) => {
    setSelectedProvince(province);
    setSelectedLandmark(null); // 지역 변경 시 선택된 랜드마크 초기화
  };

  const handleLandmarkSelect = (landmark: Landmark) => {
    setSelectedLandmark(landmark);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", height: "100vh" }}>
      <aside style={{ 
        borderRight: "1px solid #e5e7eb", 
        display: "flex", 
        flexDirection: "column",
        height: "100vh"
      }}>
        <ProvinceSelector
          landmarksByProvince={landmarksByProvince}
          selectedProvince={selectedProvince}
          onProvinceSelect={handleProvinceSelect}
        />
        <LandmarkList
          landmarks={filteredLandmarks}
          selectedLandmark={selectedLandmark}
          onSelect={handleLandmarkSelect}
        />
      </aside>
      <div style={{ height: "100%" }}>
        <MapView selectedLandmark={selectedLandmark} />
      </div>
    </div>
  );
};

export default MapPage;