// src/map/components/MapView.tsx
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import TileWMS from "ol/source/TileWMS";
import { fromLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Overlay from "ol/Overlay";
import { defaults as defaultControls } from "ol/control";
import { Style, Circle as CircleStyle, Fill, Stroke } from "ol/style";
import type { Landmark } from "../types/Landmark";
import type { RasterStat } from "../types/RasterStat";

interface MapViewProps {
  landmarks: Landmark[];
  selectedLandmark?: Landmark | null;
  onMarkerClick?: (landmark: Landmark | null) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  rasterData?: RasterStat[];
  selectedIndexType?: string | null;
  onIndexTypeSelect?: (indexType: string | null) => void;
  rasterLoading?: boolean;
}

const MapView: React.FC<MapViewProps> = ({
  landmarks,
  selectedLandmark,
  onMarkerClick,
  initialCenter = [127.7669, 35.9078],
  initialZoom = 7,
  rasterData = [],
  selectedIndexType = null,
  onIndexTypeSelect,
  rasterLoading = false,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);

  // 베이스맵 타입 상태 (일반지도 / 위성지도)
  const [baseMapType, setBaseMapType] = React.useState<'base' | 'satellite'>('base');

  // ====== 마커 레이어 ======
  const markerSourceRef = useRef(new VectorSource());
  const markerLayerRef = useRef(
    new VectorLayer({
      source: markerSourceRef.current,
    })
  );

  // ====== 래스터 레이어 (GeoServer WMS 타일) ======
  const rasterLayerRef = useRef(
    new TileLayer({
      source: new TileWMS({
        url: "https://landmark-map.store/geoserver/raster/wms",
        params: {
          LAYERS: "",
          VERSION: "1.1.0",
          FORMAT: "image/png",
          TRANSPARENT: true,
        },
        serverType: "geoserver",
      }),
      visible: false,
      opacity: 0.7,
    })
  );

  // ====== 팝업 ======
  const popupRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<Overlay | null>(null);

  // 베이스맵 레이어 refs
  const baseLayerRef = useRef<TileLayer<XYZ> | null>(null);
  const satelliteLayerRef = useRef<TileLayer<XYZ> | null>(null);
  const hybridLayerRef = useRef<TileLayer<XYZ> | null>(null);

  // -----------------------------
  // 1) 지도 생성
  // -----------------------------
  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;

    // VWorld 일반지도 레이어
    const base = new TileLayer({
      source: new XYZ({
        url: 'https://api.vworld.kr/req/wmts/1.0.0/8E952DFB-FFDE-33E3-BA8A-3D78FF78B6CC/Base/{z}/{y}/{x}.png'
      }),
      visible: true,
    });
    baseLayerRef.current = base;

    // VWorld 위성지도 레이어
    const satellite = new TileLayer({
      source: new XYZ({
        url: 'https://api.vworld.kr/req/wmts/1.0.0/8E952DFB-FFDE-33E3-BA8A-3D78FF78B6CC/Satellite/{z}/{y}/{x}.jpeg'
      }),
      visible: false,
    });
    satelliteLayerRef.current = satellite;

    // VWorld 하이브리드 레이어 (라벨)
    const hybrid = new TileLayer({
      source: new XYZ({
        url: 'https://api.vworld.kr/req/wmts/1.0.0/8E952DFB-FFDE-33E3-BA8A-3D78FF78B6CC/Hybrid/{z}/{y}/{x}.png'
      }),
      visible: false,
    });
    hybridLayerRef.current = hybrid;

    // VWorld WMS - 광역시도 경계
    const boundaryLayer = new TileLayer({
      source: new TileWMS({
        url: 'https://api.vworld.kr/req/wms',
        params: {
          'LAYERS': 'lt_c_adsido',
          'STYLES': 'lt_c_adsido',
          'FORMAT': 'image/png',
          'TRANSPARENT': true,
          'VERSION': '1.3.0',
          'CRS': 'EPSG:3857',
          'KEY': '8E952DFB-FFDE-33E3-BA8A-3D78FF78B6CC'
        },
        serverType: 'geoserver'
      })
    });

    const map = new Map({
      target: hostRef.current,
      layers: [
        base,
        satellite,
        hybrid,
        rasterLayerRef.current,
        boundaryLayer,
        markerLayerRef.current,
      ],
      view: new View({
        center: fromLonLat(initialCenter),
        zoom: initialZoom,
      }),
      controls: defaultControls({ attribution: false }),
    });

    mapRef.current = map;

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
      markerSourceRef.current.clear();
    };
  }, []);

  // -----------------------------
  // 2) 베이스맵 타입 전환
  // -----------------------------
  useEffect(() => {
    if (!baseLayerRef.current || !satelliteLayerRef.current || !hybridLayerRef.current) return;

    if (baseMapType === 'base') {
      baseLayerRef.current.setVisible(true);
      satelliteLayerRef.current.setVisible(false);
      hybridLayerRef.current.setVisible(false);
    } else {
      baseLayerRef.current.setVisible(false);
      satelliteLayerRef.current.setVisible(true);
      hybridLayerRef.current.setVisible(true);
    }
  }, [baseMapType]);

  // -----------------------------
  // 3) 팝업 Overlay
  // -----------------------------
  useEffect(() => {
    if (!mapRef.current) return;

    // 팝업 엘리먼트가 아직 없다면 생성
    if (!popupRef.current) {
      popupRef.current = document.createElement("div");
    }

    const overlay = new Overlay({
      element: popupRef.current,
      positioning: "bottom-center",
      offset: [0, -14],
      stopEvent: false,
    });

    mapRef.current.addOverlay(overlay);
    overlayRef.current = overlay;

    return () => {
      mapRef.current?.removeOverlay(overlay);
      overlay.setElement(undefined);
    };
  }, []);

  // -----------------------------
  // 4) 마커 Feature 생성
  // -----------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const source = markerSourceRef.current;
    source.clear();

    landmarks.forEach((lm) => {
      const { longitude, latitude } = lm;
      if (longitude == null || latitude == null) return;

      const coord = fromLonLat([longitude, latitude]);
      const feature = new Feature({
        geometry: new Point(coord),
        landmarkId: lm.id,
      });

      source.addFeature(feature);
    });
  }, [landmarks]);

  // -----------------------------
  // 5) 선택된 마커 스타일 강조
  // -----------------------------
  useEffect(() => {
    const layer = markerLayerRef.current;
    layer.setStyle((feature) => {
      const id = feature.get("landmarkId");
      const isSelected = selectedLandmark && id === selectedLandmark.id;

      return new Style({
        image: new CircleStyle({
          radius: isSelected ? 9 : 6,
          fill: new Fill({
            color: isSelected ? "#ea580c" : "#f97316",
          }),
          stroke: new Stroke({
            color: "#ffffff",
            width: isSelected ? 2 : 1,
          }),
        }),
      });
    });

    layer.changed();
  }, [selectedLandmark]);

  // -----------------------------
  // 6) 선택된 랜드마크 → 줌 + 팝업 이동
  // -----------------------------
  useEffect(() => {
    const map = mapRef.current;
    const overlay = overlayRef.current;
    if (!map || !overlay) return;

    const lm = selectedLandmark;
    if (!lm) {
      overlay.setPosition(undefined);
      return;
    }

    const center = fromLonLat([lm.longitude, lm.latitude]);
    map.getView().animate({ center, zoom: 14, duration: 800 });
    overlay.setPosition(center);
  }, [selectedLandmark]);

  // -----------------------------
  // 7) 마커 클릭 이벤트
  // -----------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !onMarkerClick) return;

    const handleClick = (evt: any) => {
      let clickedId: number | null = null;

      map.forEachFeatureAtPixel(evt.pixel, (feature) => {
        const id = feature.get("landmarkId");
        if (id != null) {
          clickedId = id;
          return true;
        }
        return false;
      });

      if (clickedId == null) {
        onMarkerClick(null);
        return;
      }

      if (selectedLandmark && selectedLandmark.id === clickedId) {
        onMarkerClick(null);
      } else {
        const lm = landmarks.find((l) => l.id === clickedId) || null;
        onMarkerClick(lm);
      }
    };

    map.on("singleclick", handleClick);
    return () => {
      map.un("singleclick", handleClick);
    };
  }, [onMarkerClick, landmarks, selectedLandmark]);

  // -----------------------------
  // 8) 선택된 래스터 WMS 레이어 표시
  // -----------------------------
  useEffect(() => {
    const source = rasterLayerRef.current.getSource() as TileWMS | null;
    const layer = rasterLayerRef.current;

    if (!source) return;

    // 선택된 인덱스 타입, 데이터, 랜드마크가 없으면 레이어 숨김
    if (!selectedIndexType || !rasterData.length || !selectedLandmark) {
      layer.setVisible(false);
      return;
    }

    // 현재 선택된 인덱스 타입에 맞는 데이터 찾기
    const selectedRaster = rasterData.find(
      (r) => r.indexType === selectedIndexType
    );

    if (!selectedRaster) {
      layer.setVisible(false);
      return;
    }

    // ▼▼▼▼▼ 수정된 부분 ▼▼▼▼▼
    // 요청하신 패턴: raster:{indexType}_{year}_{landmarkName}_{month}
    // 예시: raster:NDMI_2024_DDP동대문디자인플라자_02
    
    const indexType = selectedRaster.indexType;
    const year = selectedRaster.year;
    const month = String(selectedRaster.month).padStart(2, "0");

    // WMS 레이어명 생성 시 괄호/쉼표 제거 + 공백 제거
    const landmarkName = (selectedLandmark.name || "")
      .replace(/[(),]/g, "")
      .replace(/\s+/g, "");

    const layerName = `raster:${indexType}_${year}_${landmarkName}_${month}`;

    source.updateParams({
      LAYERS: layerName,
    });

    layer.setVisible(true);
  }, [selectedIndexType, rasterData, selectedLandmark]);

  // -----------------------------
  // 9) 렌더링
  // -----------------------------

  // 사용 가능한 indexType 목록
  const availableIndexTypes = Array.from(
    new Set(rasterData.map((r) => r.indexType))
  );

  return (
    <div
      ref={hostRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      {/* 베이스맵 전환 토글 버튼 */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 1000,
          display: "flex",
          borderRadius: 8,
          backgroundColor: "#ffffff",
          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          onClick={() => setBaseMapType('base')}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            backgroundColor: baseMapType === 'base' ? "#2563eb" : "#ffffff",
            color: baseMapType === 'base' ? "#ffffff" : "#4b5563",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          일반지도
        </button>
        <button
          type="button"
          onClick={() => setBaseMapType('satellite')}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            borderLeft: "1px solid #e5e7eb",
            backgroundColor: baseMapType === 'satellite' ? "#2563eb" : "#ffffff",
            color: baseMapType === 'satellite' ? "#ffffff" : "#4b5563",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          위성지도
        </button>
      </div>

      {/* 래스터 로딩 상태 표시 */}
      {rasterLoading && (
        <div
          style={{
            position: "absolute",
            top: 64,
            right: 16,
            zIndex: 1100,
            padding: "8px 12px",
            borderRadius: 8,
            backgroundColor: "rgba(255,255,255,0.9)",
            boxShadow: "0 6px 18px rgba(15,23,42,0.18)",
            border: "1px solid rgba(229,231,235,0.9)",
            color: "#111827",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          래스터 불러오는 중...
        </div>
      )}

      {/* 팝업 포털 렌더 */}
      {popupRef.current &&
        createPortal(
          <div
            style={{
              pointerEvents: "none",
              minWidth: 160,
              maxWidth: 240,
              transform: "translateY(-6px)",
              zIndex: 1000,
            }}
          >
            {selectedLandmark && (
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 12,
                  padding: "8px 10px",
                  boxShadow: "0 10px 25px rgba(15,23,42,0.35)",
                  border: "1px solid rgba(209,213,219,0.9)",
                  color: "#111827",
                  fontSize: 12,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                  {selectedLandmark.name || "이름 없음"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#4b5563",
                    marginBottom: 2,
                  }}
                >
                  #{selectedLandmark.id}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                  }}
                >
                  {selectedLandmark.address ? ` · ${selectedLandmark.address}` : ""}
                </div>
              </div>
            )}
          </div>,
          popupRef.current
        )}

      {/* 오른쪽 하단 indexType 버튼 */}
      {availableIndexTypes.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            zIndex: 1000,
          }}
        >
          {availableIndexTypes.map((indexType) => {
            const isSelected = selectedIndexType === indexType;
            return (
              <button
                key={indexType}
                type="button"
                onClick={() => {
                  if (onIndexTypeSelect) {
                    // 같은 버튼 다시 클릭 시 토글
                    if (isSelected) {
                      onIndexTypeSelect(null);
                    } else {
                      onIndexTypeSelect(indexType);
                    }
                  }
                }}
                style={{
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: isSelected
                    ? "2px solid #2563eb"
                    : "1px solid #e5e7eb",
                  backgroundColor: isSelected ? "#eff6ff" : "#ffffff",
                  color: isSelected ? "#1d4ed8" : "#4b5563",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                  }
                }}
              >
                {indexType}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MapView;
