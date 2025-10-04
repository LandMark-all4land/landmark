import React from "react";
import type { LandmarksByProvince } from "../types/Landmark";

interface ProvinceSelectorProps {
  landmarksByProvince: LandmarksByProvince;
  selectedProvince: string | null;
  onProvinceSelect: (province: string) => void;
}

const ProvinceSelector: React.FC<ProvinceSelectorProps> = ({
  landmarksByProvince,
  selectedProvince,
  onProvinceSelect,
}) => {
  const provinces = Object.keys(landmarksByProvince);

  return (
    <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
      <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600" }}>
        지역 선택
      </h3>
      <select
        value={selectedProvince || ""}
        onChange={(e) => onProvinceSelect(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "6px",
          border: "1px solid #d1d5db",
          backgroundColor: "#ffffff",
          color: "#374151",
          fontSize: "14px",
          fontWeight: "500",
          cursor: "pointer",
          outline: "none",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#3b82f6";
          e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#d1d5db";
          e.target.style.boxShadow = "none";
        }}
      >
        <option value="" disabled>
          지역을 선택하세요
        </option>
        {provinces.map((province) => {
          const landmarkCount = landmarksByProvince[province].length;
          return (
            <option key={province} value={province}>
              {province} ({landmarkCount}개)
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default ProvinceSelector;
