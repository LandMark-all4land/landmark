// src/map/components/RasterDashboard.tsx
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

// NDVI가 왼쪽, NDMI가 오른쪽
const ORDER_BY_NAME: Record<string, number> = {
  NDVI: 0,
  NDMI: 1,
};

// 커스텀 툴팁: NDVI 위, NDMI 아래
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  const sorted = [...payload].sort(
    (a, b) =>
      (ORDER_BY_NAME[a.name as string] ?? 99) -
      (ORDER_BY_NAME[b.name as string] ?? 99)
  );

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 6,
        padding: "8px 10px",
        fontSize: 12,
        color: "#111827",
      }}
    >
      <div style={{ marginBottom: 4, fontWeight: 600 }}>{label}</div>
      {sorted.map((item) => {
        // 도넛에서 쓰는 값은 +1 된 값(NDVI_BAR / NDMI_BAR) 이라
        // 실제 값은 payload.NDVI / payload.NDMI 에서 뽑는다.
        const key = item.name as "NDVI" | "NDMI";
        const raw = item.payload?.[key];
        const value =
          typeof raw === "number" && raw.toFixed
            ? raw.toFixed(4)
            : raw ?? "-";
        return (
          <div key={item.dataKey} style={{ color: item.color, marginTop: 2 }}>
            {item.name} : {value}
          </div>
        );
      })}
    </div>
  );
};

// 커스텀 범례: NDVI 왼쪽, NDMI 오른쪽
const CustomLegend = ({ payload }: any) => {
  if (!payload || payload.length === 0) return null;

  const sorted = [...payload].sort(
    (a, b) =>
      (ORDER_BY_NAME[a.value as string] ?? 99) -
      (ORDER_BY_NAME[b.value as string] ?? 99)
  );

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 16,
        marginTop: 8,
        fontSize: 12,
      }}
    >
      {sorted.map((entry) => (
        <div
          key={entry.dataKey}
          style={{ display: "flex", alignItems: "center", gap: 4 }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              backgroundColor: entry.color,
            }}
          />
          <span style={{ color: "#111827" }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const SHIFT = 1; // -1을 0 높이로 만들기 위해 +1

const RasterDashboard: React.FC<Props> = ({
  landmark,
  selectedMonth,
  ndvi,
  ndmi,
  loading,
  error,
}) => {
  const hasNdvi = !!ndvi;
  const hasNdmi = !!ndmi;

  // 상태별 안내
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
          color: "#6b7Aa280",
          textAlign: "center",
          padding: "16px 8px",
        }}
      >
        조회 월을 선택하면 이 영역에 NDVI / NDMI 차트가 표시됩니다. 📊
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

  const chartData = [
    {
      name: "최대",
      NDVI: ndvi?.valMax ?? null,
      NDMI: ndmi?.valMax ?? null,
      NDVI_BAR:
        ndvi?.valMax != null ? ndvi.valMax + SHIFT : null,
      NDMI_BAR:
        ndmi?.valMax != null ? ndmi.valMax + SHIFT : null,
    },
    {
      name: "최소",
      NDVI: ndvi?.valMin ?? null,
      NDMI: ndmi?.valMin ?? null,
      NDVI_BAR:
        ndvi?.valMin != null ? ndvi.valMin + SHIFT : null,
      NDMI_BAR:
        ndmi?.valMin != null ? ndmi.valMin + SHIFT : null,
    },
    {
      name: "평균",
      NDVI: ndvi?.valMean ?? null,
      NDMI: ndmi?.valMean ?? null,
      NDVI_BAR:
        ndvi?.valMean != null ? ndvi.valMean + SHIFT : null,
      NDMI_BAR:
        ndmi?.valMean != null ? ndmi.valMean + SHIFT : null,
    },
    {
      name: "표준편차",
      NDVI: ndvi?.valStddev ?? null,
      NDMI: ndmi?.valStddev ?? null,
      NDVI_BAR:
        ndvi?.valStddev != null ? ndvi.valStddev + SHIFT : null,
      NDMI_BAR:
        ndmi?.valStddev != null ? ndmi.valStddev + SHIFT : null,
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        height: "100%",
      }}
    >
      <div
        style={{
          fontSize: 19,
          fontWeight: 600,
          color: "#111827",
          marginBottom: 4,
        }}
      >
        NDVI / NDMI 지수
      </div>

      <div style={{ width: "100%", flex: 1, minHeight: 200 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, left: -30, bottom: 0 }}
          >
            <CartesianGrid
              stroke="#e5e7eb"
              strokeDasharray="2 2"
              vertical={false}
            />
            <XAxis dataKey="name" />
            {/* 실제 값은 0~2, 라벨은 -1~1 로 보여주기 */}
            <YAxis
              domain={[0, 2]}
              tickFormatter={(v) => (v - 1).toString()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            {/* ✅ NDVI 막대 왼쪽, NDMI 막대 오른쪽 (값은 +1 된 BAR 필드 사용) */}
            <Bar
              dataKey="NDVI_BAR"
              name="NDVI"
              barSize={14}
              radius={[0, 0, 0, 0]}
              fill="#22c55e"
            />
            <Bar
              dataKey="NDMI_BAR"
              name="NDMI"
              barSize={14}
              radius={[0, 0, 0, 0]}
              fill="#68DEED"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RasterDashboard;
