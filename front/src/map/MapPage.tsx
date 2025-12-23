// src/map/MapPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import MapView from "./components/MapView";

// === 타입 ===
import type { Landmark } from "./types/Landmark";
import type { RasterStat } from "./types/RasterStat";
import type { RiskData } from "./api/riskApi";

// === API ===
import { fetchLandmarks } from "./api/landmarkApi";
import { fetchLandmarkRasters } from "./api/rasterApi";
import { fetchLandmarkRisk } from "./api/riskApi";
import { authUtils } from "../auth/authUtils";

// === 상수 / 컴포넌트 ===
import { MONTH_PRESETS, type MonthPreset } from "./constants/monthPresets";
import RasterDashboard from "./components/RasterDashboard";
import NotesPanel from "./components/NotesPanel";

// =============================
//  MapPage
// =============================
const MapPage: React.FC = () => {
  // ===== 랜드마크 / 선택 상태 =====
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

  // ===== 월 선택 & 래스터 데이터 상태 (바 차트용) =====
  const [selectedMonth, setSelectedMonth] = useState<MonthPreset | null>(null);
  const [rasterLoading, setRasterLoading] = useState(false);
  const [rasterError, setRasterError] = useState<string | null>(null);
  const [rasterData, setRasterData] = useState<RasterStat[]>([]);
  const [selectedIndexType, setSelectedIndexType] = useState<string | null>(
    null
  );

  // 바차트용 NDVI / NDMI 추출 (바 차트 로직은 유지)
  const ndvi = rasterData.find((r) => r.indexType === "NDVI") ?? null;
  const ndmi = rasterData.find((r) => r.indexType === "NDMI") ?? null;

  // ===== 산불 위험도 (risk API 전용 상태) =====
  const [riskData, setRiskData] = useState<RiskData | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);

  // -----------------------------
  //  랜드마크 조회
  // -----------------------------
  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        setError(null);

        const landmarkData = await fetchLandmarks();
        setLandmarks(landmarkData);
      } catch (e) {
        console.error("데이터 조회 실패:", e);
        setError("랜드마크 데이터를 불러오지 못했습니다.");
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
      setRasterData([]);
      setSelectedIndexType(null);
      setRasterError(null);
      setRiskData(null);
      setRiskError(null);
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
      setRasterData([]);
      setSelectedIndexType(null);
      setRasterError(null);
      setRiskData(null);
      setRiskError(null);
    }
  };

  const handleLogout = () => {
    authUtils.removeToken();
    window.location.href = "/";
  };

  // -----------------------------
  //  월 버튼 클릭
  // -----------------------------
  const handleMonthClick = (preset: MonthPreset) => {
    if (
      selectedMonth?.year === preset.year &&
      selectedMonth?.month === preset.month
    ) {
      setSelectedMonth(null);
      setRasterData([]);
      setSelectedIndexType(null);
      setRasterError(null);
      setRiskData(null);
      setRiskError(null);
      return;
    }
    setSelectedMonth(preset);
  };

  // -----------------------------
  //  래스터 데이터 조회 (바 차트용)
  // -----------------------------
  useEffect(() => {
    if (!selectedLandmark || !selectedMonth) {
      setRasterData([]);
      setSelectedIndexType(null);
      setRasterError(null);
      return;
    }

    const loadRasters = async () => {
      try {
        setRasterLoading(true);
        setRasterError(null);

        const { year, month } = selectedMonth;
        const rows = await fetchLandmarkRasters(
          selectedLandmark.id!,
          year,
          month
        );

        setRasterData(rows);

        // 이전에 선택한 인덱스 타입이 있으면 유지, 없으면 첫 번째 선택
        if (rows.length > 0) {
          const keep =
            rows.find((r) => r.indexType === selectedIndexType)?.indexType ??
            rows[0].indexType;
          setSelectedIndexType(keep);
        } else {
          setSelectedIndexType(null);
        }
      } catch (e: any) {
        console.error("래스터 데이터 조회 실패:", e);
        setRasterError(e.message ?? "래스터 데이터를 불러오지 못했습니다.");
        setRasterData([]);
        setSelectedIndexType(null);
      } finally {
        setRasterLoading(false);
      }
    };

    loadRasters();
  }, [selectedLandmark, selectedMonth]);

  // -----------------------------
  //  산불 위험도 조회 (risk API용)
  // -----------------------------
  useEffect(() => {
    if (!selectedLandmark || !selectedMonth) {
      setRiskData(null);
      setRiskError(null);
      return;
    }

    const loadRisk = async () => {
      try {
        setRiskLoading(true);
        setRiskError(null);

        const { year, month } = selectedMonth;
        const data = await fetchLandmarkRisk(selectedLandmark.id!, year, month);

        if (!data) {
          setRiskData(null);
          setRiskError("산불 위험도 데이터를 불러오지 못했습니다.");
          return;
        }

        setRiskData(data);
      } catch (e: any) {
        console.error("산불 위험도 조회 실패:", e);
        setRiskError(e.message ?? "산불 위험도 데이터를 불러오지 못했습니다.");
        setRiskData(null);
      } finally {
        setRiskLoading(false);
      }
    };

    loadRisk();
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
  //  산불 위험도 카드 렌더링
  //  (risk API + 텍스트 블록)
  // -----------------------------
  const renderFireRiskCard = () => {
    // 월 필터 이전 안내 문구들은 그대로 유지
    if (!selectedLandmark) {
      return (
        <div
          style={{
            fontSize: 13,
            color: "#6b7280",
            textAlign: "center",
            padding: "16px 8px",
          }}
        >
          랜드마크를 먼저 선택하세요.
        </div>
      );
    }

    if (!selectedMonth) {
      return (
        <div
          style={{
            fontSize: 13,
            color: "#6b7280",
            textAlign: "center",
            padding: "16px 8px",
          }}
        >
          조회 월을 선택하면 이 영역에 산불 위험도가 표시됩니다. 🔥
        </div>
      );
    }

    if (riskLoading) {
      return (
        <div
          style={{
            fontSize: 13,
            color: "#6b7280",
            textAlign: "center",
            padding: "16px 8px",
          }}
        >
          산불 위험도 데이터를 불러오는 중입니다...
        </div>
      );
    }

    if (riskError) {
      return (
        <div
          style={{
            fontSize: 13,
            color: "#b91c1c",
            textAlign: "center",
            padding: "16px 8px",
          }}
        >
          에러: {riskError}
        </div>
      );
    }

    if (!riskData) {
      return (
        <div
          style={{
            fontSize: 13,
            color: "#6b7280",
            textAlign: "center",
            padding: "16px 8px",
          }}
        >
          선택한 월의 산불 위험도 데이터가 없습니다.
        </div>
      );
    }

    // --- 위험 단계 매핑 ---
    const rawLevel = (riskData.riskLevelDescription || "").toLowerCase();
    let levelKey: "low" | "alert" | "critical";

    if (rawLevel.includes("critical")) levelKey = "critical";
    else if (rawLevel.includes("alert")) levelKey = "alert";
    else if (rawLevel.includes("low")) levelKey = "low";
    else {
      // 혹시 모를 예외 대비: riskScore 기준으로 분류
      if (riskData.riskScore >= 0.7) levelKey = "critical";
      else if (riskData.riskScore > 0.5) levelKey = "alert";
      else levelKey = "low";
    }

    const levelConfig = {
      low: {
        label: "1단계 - 낮음",
        color: "#16a34a",
        bg: "#dcfce7",
        title: "🟢 산불 안전 지역 ( 위험도 1단계 )",
        lines: [
          "현재 산불 위험 수준이 낮은 상태입니다.",
          "정기적인 모니터링만으로도 충분합니다.",
        ],
      },
      alert: {
        label: "2단계 - 주의",
        color: "#f97316",
        bg: "#ffedd5",
        title: "🟠 산불 주의 지역",
        lines: [
          "산불 가능성이 서서히 높아지고 있습니다.",
          "상황 변화를 자주 확인해 주세요.",
        ],
      },
      critical: {
        label: "3단계 - 위험",
        color: "#dc2626",
        bg: "#fee2e2",
        title: "🔥 산불 위험 지역",
        lines: [
          "산불에 취약할 수 있는 상태입니다.",
          "해당지역의 집중 모니터링이 필요합니다.",
        ],
      },
    }[levelKey];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            fontSize: 19,
            fontWeight: 600,
            color: "#111827",
          }}
        >
          산불 위험도
        </div>
        
       {/* === [산불 위험도] 범례 (항상 표시) === */}
      <div
        style={{
          fontSize: 11,
          color: "#6b7280",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div>
          <strong>기준 범례(건조 연료 지수 DFI) - NDVI/NDMI 가중치로 건조도 계산</strong>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            whiteSpace: "nowrap",
          }}
        >
          {/* 1단계: 0.5 이하 */}
           <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: "#16a34a",
              }}
            />
            <span>1단계 (0.5 이하)</span>
          </div>

          {/* 2단계: 0.5 초과 */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: "#f97316",
              }}
            />
            <span>2단계 (0.5 초과)</span>
          </div>

          {/* 3단계: 0.7 이상 ~ 1.0 이하 */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span style={{ fontSize: 13 }}>🔥</span>
            <span>3단계 (0.7 이상 ~ 1.0)</span>
          </div>
        </div>
      </div>


        {/* === [산불 위험도] 위험 단계 블록 (도넛 제거, 중앙 텍스트 강조) === */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 6,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              minWidth: 150,
              maxWidth: "100%",
            padding: "12px 24px",
            borderRadius: 12,
            backgroundColor: levelConfig.bg,
            border: `1px solid ${levelConfig.color}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: levelConfig.color,
              }}
            >
              {levelConfig.label}
            </span>
          </div>
        </div>

        {/* 설명 텍스트 */}
        <div
          style={{
            fontSize: 13,
            color: "#4b5563",
            lineHeight: 1.6,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {levelConfig.title}
          </div>
          <div>{levelConfig.lines[0]}</div>
          <div>{levelConfig.lines[1]}</div>
        </div>
      </div>
    );
  };

  // -----------------------------
  //  렌더링
  // -----------------------------
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "400px 1fr", // 왼쪽 살짝 넓힘
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
        {/* 헤더: 로그아웃 버튼 */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            paddingBottom: "8px",
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              borderRadius: 8,
              border: "1px solid #dc2626",
              backgroundColor: "#ffffff",
              color: "#dc2626",
              cursor: "pointer",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#dc2626";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.color = "#dc2626";
            }}
          >
            로그아웃
          </button>
        </div>

        {/* 1) 산불 위험도 카드 (risk API 기반 텍스트 블록) */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "16px 20px",
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
            display: "flex",
            flexDirection: "column",
            minHeight: 250,
          }}
        >
          {renderFireRiskCard()}
        </section>

        {/* 2) NDVI / NDMI 차트 카드 (바 차트 - 기존 로직 유지) */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
            minHeight: "300px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* === [NDVI / NDMI] 바 차트 === */}
          <RasterDashboard
            landmark={selectedLandmark}
            selectedMonth={selectedMonth}
            ndvi={ndvi}
            ndmi={ndmi}
            loading={rasterLoading}
            error={rasterError}
          />
        </section>

        {/* 3) 메모 카드 */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
            minHeight: "250px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <NotesPanel landmark={selectedLandmark} />
        </section>
      </aside>

      {/* ===== 지도 영역 ===== */}
      <main style={{ position: "relative" }}>
        <MapView
          landmarks={landmarks}
          selectedLandmark={selectedLandmark}
          onMarkerClick={handleMarkerClick}
          rasterData={rasterData}
          selectedIndexType={selectedIndexType}
          onIndexTypeSelect={setSelectedIndexType}
          rasterLoading={rasterLoading}
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
