import React from "react";
import type { Landmark } from "../types/Landmark";
import type { RasterStat } from "../types/RasterStat";
import type { MonthPreset } from "../constants/monthPresets";

import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Props {
  landmark: Landmark | null;
  selectedMonth: MonthPreset | null;
  ndvi: RasterStat | null;
  ndmi: RasterStat | null;
  loading: boolean;
  error: string | null;
}

interface FireRiskResult {
  percentage: number; // 0 ~ 100
  isSafe: boolean;
  diffMaxMin: number;
  diffMean: number;
}

// NDVI / NDMI 기반 산불 위험도 계산
function computeFireRisk(
  ndvi: RasterStat | null,
  ndmi: RasterStat | null
): FireRiskResult | null {
  if (!ndvi || !ndmi) return null;

  const diffMaxMin = ndvi.valMax - ndmi.valMin;
  const diffMean = ndvi.valMean - ndmi.valMean;

  // ndvi/ndmi 범위 -1~+1 → diff -2~+2 라고 보고 0~1로 매핑
  const normalized = Math.max(0, Math.min(1, (diffMaxMin + 2) / 4));
  const percentage = Math.round(normalized * 100);

  // 조건: diffMaxMin < diffMean 이면 안전
  const isSafe = diffMaxMin < diffMean;

  return {
    percentage,
    isSafe,
    diffMaxMin,
    diffMean,
  };
}

const RasterDashboard: React.FC<Props> = ({
  landmark,
  selectedMonth,
  ndvi,
  ndmi,
  loading,
  error,
}) => {
  const fireRisk = computeFireRisk(ndvi, ndmi);
  const hasNdvi = !!ndvi;
  const hasNdmi = !!ndmi;

  // 아직 아무것도 안 골랐을 때
  if (!landmark) {
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
        조회 월을 선택하면 이 영역에 산불 위험도와
        <br />
        NDVI / NDMI 차트가 표시됩니다. 📊
      </div>
    );
  }

  if (loading) {
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

  if (error) {
    return (
      <div
        style={{
          fontSize: 13,
          color: "#b91c1c",
          textAlign: "center",
          padding: "16px 8px",
        }}
      >
        에러: {error}
      </div>
    );
  }

  // ✅ 진짜로 둘 다 없을 때만 "없습니다" 문구 띄움
  if (!hasNdvi && !hasNdmi) {
    return (
      <div
        style={{
          fontSize: 13,
          color: "#6b7280",
          textAlign: "center",
          padding: "16px 8px",
        }}
      >
        선택한 월의 NDVI / NDMI 데이터가 없습니다. 😢
      </div>
    );
  }

  const monthLabel = selectedMonth.label;

  // fireRisk는 ndvi+ndmi 둘 다 있을 때만 존재
  const statusText = fireRisk
    ? fireRisk.isSafe
      ? "산불 안전 지역"
      : "산불 위험 지역"
    : "산불 위험도 계산 불가";
  const statusEmoji = fireRisk ? (fireRisk.isSafe ? "🟢" : "🔥") : "ℹ️";
  const statusDetail = fireRisk
    ? fireRisk.isSafe
      ? "NDVI와 NDMI 지수 차이가 평균보다 작아 비교적 안전한 상태입니다."
      : "NDVI는 높고 NDMI는 낮아 산불에 취약할 수 있는 상태입니다. 모니터링이 필요합니다."
    : "NDMI 데이터가 없어 산불 위험도를 계산할 수 없습니다. NDVI 지수만 참고 가능합니다.";

  const chartData = [
    {
      name: "최대",
      NDVI: ndvi?.valMax ?? null,
      NDMI: ndmi?.valMax ?? null,
    },
    {
      name: "최소",
      NDVI: ndvi?.valMin ?? null,
      NDMI: ndmi?.valMin ?? null,
    },
    {
      name: "평균",
      NDVI: ndvi?.valMean ?? null,
      NDMI: ndmi?.valMean ?? null,
    },
    {
      name: "표준편차",
      NDVI: ndvi?.valStddev ?? null,
      NDMI: ndmi?.valStddev ?? null,
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        height: "100%",
      }}
    >
      {/* 1) 산불 위험도 카드 */}
      <div
        style={{
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          padding: "14px 16px",
          marginBottom: 4,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#111827",
            marginBottom: 8,
          }}
        >
          산불 위험도
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              minWidth: 80,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: fireRisk
                  ? fireRisk.isSafe
                    ? "#16a34a"
                    : "#dc2626"
                  : "#6b7280",
                lineHeight: 1.1,
              }}
            >
              {fireRisk ? `${fireRisk.percentage}%` : "-"}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                fontWeight: 600,
                color: "#111827",
              }}
            >
              {statusEmoji} {statusText}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              fontSize: 12,
              color: "#4b5563",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div>
              <span
                style={{
                  display: "inline-block",
                  width: 60,
                  color: "#9ca3af",
                }}
              >
                랜드마크
              </span>
              <span>{landmark.name}</span>
            </div>
            <div>
              <span
                style={{
                  display: "inline-block",
                  width: 60,
                  color: "#9ca3af",
                }}
              >
                기간
              </span>
              <span>{monthLabel}</span>
            </div>

            {fireRisk && (
              <>
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      width: 60,
                      color: "#9ca3af",
                    }}
                  >
                    지수 차이
                  </span>
                  <span>
                    max(NDVI) - min(NDMI) = {fireRisk.diffMaxMin.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      width: 60,
                      color: "#9ca3af",
                    }}
                  >
                    평균 차이
                  </span>
                  <span>
                    mean(NDVI) - mean(NDMI) = {fireRisk.diffMean.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div
          style={{
            fontSize: 11,
            color: "#6b7280",
            marginTop: 4,
          }}
        >
          {statusDetail}
        </div>
      </div>

      {/* 2) NDVI / NDMI 바 차트 */}
      <div
        style={{
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          padding: "12px 12px 4px",
          flex: 1,
          minHeight: 200,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#111827",
            marginBottom: 8,
          }}
        >
          NDVI / NDMI 지수
        </div>

        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[-1, 1]} />
              <Tooltip />
              <Legend />
              {/* NDVI는 항상 있을 때만 값 들어감 */}
              {hasNdvi && <Bar dataKey="NDVI" radius={[4, 4, 0, 0]} />}
              {/* NDMI 있으면 같이 그림 */}
              {hasNdmi && <Bar dataKey="NDMI" radius={[4, 4, 0, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default RasterDashboard;
