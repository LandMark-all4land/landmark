import React from "react";
import type { Landmark } from "../types/Landmark";

interface LandmarkListProps {
  landmarks: Landmark[];
  selectedLandmark: Landmark | null;
  onSelect: (landmark: Landmark) => void;
}

const LandmarkList: React.FC<LandmarkListProps> = ({ 
  landmarks, 
  selectedLandmark, 
  onSelect 
}) => {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "0",
      }}
    >
      <div style={{ padding: "16px 16px 8px 16px" }}>
        <h3 style={{ 
          margin: "0 0 8px 0", 
          fontSize: "16px", 
          fontWeight: "600",
          color: "#374151"
        }}>
          랜드마크 목록
        </h3>
        <div style={{ 
          fontSize: "14px", 
          color: "#6b7280",
          marginBottom: "12px"
        }}>
          총 {landmarks.length}개
        </div>
      </div>
      
      {landmarks.length === 0 ? (
        <div style={{
          padding: "32px 16px",
          textAlign: "center",
          color: "#9ca3af",
          fontSize: "14px"
        }}>
          선택된 지역에 랜드마크가 없습니다.
        </div>
      ) : (
        <div style={{ padding: "0 8px 8px 8px" }}>
          {landmarks.map((lm) => {
            const isSelected = selectedLandmark?.id === lm.id;
            
            return (
              <div
                key={lm.id}
                onClick={() => onSelect(lm)}
                style={{
                  padding: "12px",
                  marginBottom: "6px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor: isSelected ? "#dbeafe" : "#f9fafb",
                  border: isSelected ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                    e.currentTarget.style.borderColor = "#d1d5db";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  }
                }}
              >
                <div style={{ 
                  fontWeight: "600", 
                  fontSize: "14px",
                  color: isSelected ? "#1e40af" : "#111827",
                  marginBottom: "4px"
                }}>
                  {lm.name}
                </div>
                <div style={{ 
                  fontSize: "12px", 
                  color: isSelected ? "#1e40af" : "#6b7280",
                  lineHeight: "1.4"
                }}>
                  {lm.address}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LandmarkList;