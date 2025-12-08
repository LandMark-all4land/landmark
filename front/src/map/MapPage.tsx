// src/map/MapPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import MapView from "./components/MapView";

// === 타입 ===
import type { Landmark } from "./types/Landmark";
import type { RasterStat } from "./types/RasterStat";

// === API ===
import { fetchLandmarks } from "./api/landmarkApi";
import { fetchLandmarkRasters } from "./api/rasterApi";
import { authUtils } from "../auth/authUtils";

// === 상수 / 컴포넌트 ===
import { MONTH_PRESETS, type MonthPreset } from "./constants/monthPresets";
import RasterDashboard from "./components/RasterDashboard";
import NotesPanel from "./components/NotesPanel";

// 도넛 차트용 recharts
import { PieChart, Pie, Cell } from "recharts";

// ---- 산불 위험도 계산 함수 (원래 Dashboard 로직 그대로) ----
interface FireRiskResult {
  percentage: number; // 0 ~ 100
  isSafe: boolean;
  diffMaxMin: number;
  diffMean: number;
}

function computeFireRisk(
  ndvi: RasterStat | null,
  ndmi: RasterStat | null
): FireRiskResult | null {
  if (!ndvi || !ndmi) return null;

  const diffMaxMin = ndvi.valMax - ndmi.valMin;
  const diffMean = ndvi.valMean - ndmi.valMean;

  const normalized = Math.max(0, Math.min(1, (diffMaxMin + 2) / 4));
  const percentage = Math.round(normalized * 100);
  const isSafe = diffMaxMin < diffMean;

  return {
    percentage,
    isSafe,
    diffMaxMin,
    diffMean,
  };
}

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

  // ===== 월 선택 & 래스터 데이터 상태 =====
  const [selectedMonth, setSelectedMonth] = useState<MonthPreset | null>(null);
  const [rasterLoading, setRasterLoading] = useState(false);
  const [rasterError, setRasterError] = useState<string | null>(null);
  const [rasterData, setRasterData] = useState<RasterStat[]>([]);
  const [selectedIndexType, setSelectedIndexType] = useState<string | null>(null);
  
  // 기존 호환성을 위한 ndvi, ndmi 계산
  const ndvi = rasterData.find((r) => r.indexType === "NDVI") ?? null;
  const ndmi = rasterData.find((r) => r.indexType === "NDMI") ?? null;
  const hasNdvi = !!ndvi;
  const hasNdmi = !!ndmi;
  const fireRisk = computeFireRisk(ndvi, ndmi);
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
    }
  };

  const handleLogout = () => {
    authUtils.removeToken();
    window.location.href = '/';
  };

  // -----------------------------
  //  월 버튼 클릭 / 래스터 조회
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
      return;
    }
    setSelectedMonth(preset);
  };

  // 래스터 데이터 조회
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
  //  산불 위험도 카드 렌더링 (도넛 차트)
  // -----------------------------
  const renderFireRiskCard = () => {
    // 상태별 안내 문구
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

    if (rasterLoading) {
      return (
        <div
          style={{
            fontSize: 13,
            color: "#6b7280",
            textAlign: "center",
            padding: "16px 8px",
          }}
        >
          래스터 데이터를 불러오는 중입니다...
        </div>
      );
    }

    if (rasterError) {
      return (
        <div
          style={{
            fontSize: 13,
            color: "#b91c1c",
            textAlign: "center",
            padding: "16px 8px",
          }}
        >
          에러: {rasterError}
        </div>
      );
    }

    if (!hasNdvi || !hasNdmi || !fireRisk) {
      return (
        <div
          style={{
            fontSize: 13,
            color: "#6b7280",
            textAlign: "center",
            padding: "16px 8px",
          }}
        >
          NDMI 데이터가 없어 산불 위험도를 계산할 수 없습니다.
          <br />
          NDVI 지수만 참고 가능합니다.
        </div>
      );
    }

    const statusText = fireRisk.isSafe ? "산불 안전 지역" : "산불 위험 지역";
    const statusEmoji = fireRisk.isSafe ? "🟢" : "🔥";

    const detailLines = fireRisk.isSafe
      ? [
          "비교적 안전한 상태입니다.",
          "지속적인 모니터링을 통해 변화를 관찰하세요.",
        ]
      : [
          "산불에 취약할 수 있는 상태입니다.",
          "해당지역의 집중 모니터링이 필요합니다."
      
        ];

    const percentage = fireRisk.percentage;

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

        {/* 도넛 차트 영역: 가운데 정렬 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              width: 310,
              height: 120,
              flexShrink: 0,
            }}
          >
            <PieChart width={310} height={120}>
              <Pie
                data={[
                  { name: "위험도", value: percentage },
                  { name: "나머지", value: 100 - percentage },
                ]}
                startAngle={90}
                endAngle={-270}
                innerRadius={42} // 조금 더 얇은 안쪽 반지름
                outerRadius={59} // 더 큰 바깥 반지름 → 전체 좀 더 크고 두꺼워짐
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={fireRisk.isSafe ? "#22c55e" : "#ef4444"} />
                <Cell fill="#e5e7eb" />
              </Pie>
            </PieChart>

            {/* 가운데 퍼센트 텍스트만 (차트 안 가리도록) */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  color: fireRisk.isSafe ? "#16a34a" : "#dc2626",
                  lineHeight: 1.1,
                }}
              >
                {percentage}%
              </div>
            </div>
          </div>
        </div>

        {/* 설명 텍스트: 아이콘/타이틀 + 두 줄 설명 (마지막 줄에 '모니터링이 필요합니다.' 개행) */}
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
            {statusEmoji} {statusText}
          </div>
          <div>{detailLines[0]}</div>
          <div>{detailLines[1]}</div>
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

        {/* 1) 산불 위험도 카드 (도넛) */}
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

        {/* 2) NDVI / NDMI 차트 카드 */}
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
