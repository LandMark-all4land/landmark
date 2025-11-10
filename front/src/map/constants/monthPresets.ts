export interface MonthPreset {
  label: string;
  year: number;
  month: number; // 2, 3, 4, 5
}

export const MONTH_PRESETS: MonthPreset[] = [
  { label: "24년 1월", year: 2024, month: 1 },
  { label: "24년 3월", year: 2024, month: 3 },
  { label: "24년 4월", year: 2024, month: 4 },
  { label: "24년 5월", year: 2024, month: 5 },
];
