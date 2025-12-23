export interface AdmBoundary {
  admCode: string;
  admName: string;
  geoJson: any;   // 백엔드에서 주는 GeoJSON 
  level: number;  // 1 = 시도
}