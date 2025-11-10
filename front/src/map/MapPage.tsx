// src/map/MapPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import MapView from "./components/MapView";

// === 타입 ===
import type { Landmark } from "./types/Landmark";
import type { AdmBoundary } from "./types/Boundary";
import type { RasterStat } from "./types/RasterStat";

// === API ===
import { fetchLandmarks } from "./api/landmarkApi";
import { fetchLandmarkRasters } from "./api/rasterApi";
import { fetchAdmBoundaries } from "./api/boundaryApi";

// === 상수 / 컴포넌트 ===
import { MONTH_PRESETS, type MonthPreset } from "./constants/monthPresets";
import RasterDashboard from "./components/RasterDashboard";

const MapPage: React.FC = () => {
  // ===== 행정경계 / 랜드마크 / 선택 상태 =====
  const [boundaries, setBoundaries] = useState<AdmBoundary[]>([]);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(
    null
  );

  // ===== 로딩 / 에러 =====
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===== 검색창 상태 =====
  const [searchText, setSearchText] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // ===== 월 선택 & 래스터 데이터 상태 =====
  const [selectedMonth, setSelectedMonth] = useState<MonthPreset | null>(null);
  const [rasterLoading, setRasterLoading] = useState(false);
  const [rasterError, setRasterError] = useState<string | null>(null);
  const [ndvi, setNdvi] = useState<RasterStat | null>(null);
  const [ndmi, setNdmi] = useState<RasterStat | null>(null);

  // -----------------------------
  //  행정경계 + 랜드마크 동시 조회
  // -----------------------------
  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        setError(null);

        const [boundaryData, landmarkData] = await Promise.all([
          fetchAdmBoundaries(),
          fetchLandmarks(),
        ]);

        setBoundaries(boundaryData);
        setLandmarks(landmarkData);
      } catch (e) {
        console.error("데이터 조회 실패:", e);
        setError("행정경계 또는 랜드마크 데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  // -----------------------------
  //  검색 결과 (id 오름차순 + 자동완성 / 지역검색)
  // -----------------------------
  const filteredLandmarks = useMemo(() => {
    const base = Array.isArray(landmarks)
      ? [...landmarks].sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
      : [];
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return base;

    return base.filter((lm) => {
      const idStr = String(lm.id ?? "");
      const name = (lm.name ?? "").toLowerCase();
      const address = (lm.address ?? "").toLowerCase();
      const province = (lm.province ?? "").toLowerCase();
      return (
        idStr.includes(keyword) ||
        name.includes(keyword) ||
        address.includes(keyword) ||
        province.includes(keyword)
      );
    });
  }, [landmarks, searchText]);

  // -----------------------------
  //  검색 / 선택 / 마커 클릭
  // -----------------------------
  const handleSearchChange = (value: string) => {
    setSearchText(value);
    setIsDropdownOpen(true);

    if (!value.trim()) {
      setSelectedLandmark(null);
      setSelectedMonth(null);
      setNdvi(null);
      setNdmi(null);
      setRasterError(null);
    }
  };

  const handleSelectLandmark = (lm: Landmark) => {
    setSelectedLandmark(lm);
    setSearchText(lm.name || String(lm.id));
    setIsDropdownOpen(false);
  };

  const handleMarkerClick = (lm: Landmark | null) => {
    setSelectedLandmark(lm);
    if (lm) {
      setSearchText(lm.name || String(lm.id));
    } else {
      setSelectedMonth(null);
      setNdvi(null);
      setNdmi(null);
      setRasterError(null);
    }
  };

  // -----------------------------
  //  월 버튼 클릭 / 래스터 조회
  // -----------------------------
  const handleMonthClick = (preset: MonthPreset) => {
    // 같은 월 다시 클릭 → 토글 해제
    if (
      selectedMonth?.year === preset.year &&
      selectedMonth?.month === preset.month
    ) {
      setSelectedMonth(null);
      setNdvi(null);
      setNdmi(null);
      setRasterError(null);
      return;
    }
    setSelectedMonth(preset);
  };

  // 래스터 데이터 조회 (selectedLandmark + selectedMonth 바뀔 때마다)
  useEffect(() => {
    if (!selectedLandmark || !selectedMonth) {
      setNdvi(null);
      setNdmi(null);
      setRasterError(null);
      return;
    }

    const loadRasters = async () => {
      try {
        setRasterLoading(true);
        setRasterError(null);

        const { year, month } = selectedMonth;

        // ✅ year + month 둘 다 넘김 (백엔드 시그니처와 맞춤)
        const rows = await fetchLandmarkRasters(
          selectedLandmark.id!,
          year,
          month
        );

        // 백엔드에서 이미 해당 연도/월로 필터링해서 줌
        const ndviRow = rows.find((r) => r.indexType === "NDVI") ?? null;
        const ndmiRow = rows.find((r) => r.indexType === "NDMI") ?? null;

        setNdvi(ndviRow);
        setNdmi(ndmiRow);
      } catch (e: any) {
        console.error("래스터 데이터 조회 실패:", e);
        setRasterError(e.message ?? "래스터 데이터를 불러오지 못했습니다.");
        setNdvi(null);
        setNdmi(null);
      } finally {
        setRasterLoading(false);
      }
    };

    loadRasters();
  }, [selectedLandmark, selectedMonth]);

  // -----------------------------
  //  월 버튼 렌더링
  // -----------------------------
  const renderMonthButtons = () => (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {MONTH_PRESETS.map((m) => {
        const isActive =
          selectedMonth?.year === m.year && selectedMonth?.month === m.month;
        return (
          <button
            key={`${m.year}-${m.month}`}
            type="button"
            onClick={() => handleMonthClick(m)}
            style={{
              padding: "6px 10px",
              fontSize: 11,
              borderRadius: 999,
              border: isActive ? "1px solid #2563eb" : "1px solid #e5e7eb",
              backgroundColor: isActive ? "#eff6ff" : "#ffffff",
              color: isActive ? "#1d4ed8" : "#4b5563",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );

  // -----------------------------
  //  렌더링
  // -----------------------------
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "360px 1fr",
        height: "100vh",
        backgroundColor: "#f3f4f6",
        overflow: "hidden",
      }}
    >
      {/* ===== 왼쪽 대시보드 ===== */}
      <aside
        style={{
          borderRight: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          overflowY: "auto",
        }}
      >
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "16px 20px",
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 600,
              fontSize: "15px",
              color: "#111827",
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: "999px",
                background:
                  "linear-gradient(135deg, rgba(248,113,113,1), rgba(239,68,68,1))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "14px",
              }}
            >
              🔥
            </span>
            <span>TOP 3 산불 위험성</span>
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
            나중에 실제 지표 / 리스트 들어갈 자리.
          </p>
        </section>

        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
            minHeight: "260px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <RasterDashboard
            landmark={selectedLandmark}
            selectedMonth={selectedMonth}
            ndvi={ndvi}
            ndmi={ndmi}
            loading={rasterLoading}
            error={rasterError}
          />
        </section>
      </aside>

      {/* ===== 지도 영역 ===== */}
      <main style={{ position: "relative" }}>
        <MapView
          boundaries={boundaries}
          landmarks={landmarks}
          selectedLandmark={selectedLandmark}
          onMarkerClick={handleMarkerClick}
        />

        {/* 검색창 + 월 버튼 */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            width: 420,
            maxWidth: "calc(100% - 32px)",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#ffffff",
                  borderRadius: 999,
                  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
                  padding: "8px 14px",
                  gap: 8,
                  border: "1px solid #e5e7eb",
                }}
              >
                <span style={{ fontSize: 16, color: "#9ca3af" }}>🔍</span>
                <input
                  type="text"
                  placeholder="지역 or 랜드마크 검색"
                  value={searchText}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setIsDropdownOpen(true)}
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    fontSize: 14,
                    color: "#111827",
                  }}
                />
              </div>
            </div>
            {renderMonthButtons()}
          </div>

          {/* 자동완성 */}
          {isDropdownOpen && filteredLandmarks.length > 0 && (
            <div
              style={{
                marginTop: 6,
                backgroundColor: "#ffffff",
                borderRadius: 12,
                boxShadow: "0 12px 30px rgba(15, 23, 42, 0.18)",
                maxHeight: 260,
                overflowY: "auto",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  fontSize: 12,
                  color: "#6b7280",
                  borderBottom: "1px solid #f3f4f6",
                  position: "sticky",
                  top: 0,
                  backgroundColor: "#ffffff",
                  zIndex: 1,
                }}
              >
                검색 결과 {filteredLandmarks.length}개
              </div>

              {filteredLandmarks.map((lm) => (
                <button
                  key={lm.id}
                  type="button"
                  onClick={() => handleSelectLandmark(lm)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    border: "none",
                    backgroundColor:
                      selectedLandmark?.id === lm.id ? "#eff6ff" : "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}
                  >
                    #{lm.id} · {lm.name}
                  </span>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>
                    {(lm.province || "지역 미지정") +
                      (lm.address ? ` · ${lm.address}` : "")}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 로딩 / 에러 */}
          {loading && (
            <div
              style={{
                marginTop: 8,
                padding: "4px 8px",
                fontSize: 11,
                borderRadius: 999,
                backgroundColor: "rgba(55,65,81,0.85)",
                color: "#f9fafb",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "999px",
                  backgroundColor: "#34d399",
                }}
              />
              데이터 불러오는 중...
            </div>
          )}
          {error && !loading && (
            <div
              style={{
                marginTop: 8,
                padding: "4px 10px",
                fontSize: 11,
                borderRadius: 999,
                backgroundColor: "rgba(220,38,38,0.9)",
                color: "#fef2f2",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ⚠️ {error}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MapPage;
