// src/map/components/MapView.tsx
import React, { useEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import GeoJSON from "ol/format/GeoJSON";
import Overlay from "ol/Overlay";
import { defaults as defaultControls } from "ol/control";
import { Style, Circle as CircleStyle, Fill, Stroke } from "ol/style";
import type { AdmBoundary } from "../types/Boundary";
import type { Landmark } from "../types/Landmark";

interface MapViewProps {
  landmarks: Landmark[];
  selectedLandmark?: Landmark | null;
  onMarkerClick?: (landmark: Landmark | null) => void;
  boundaries?: AdmBoundary[];
  initialCenter?: [number, number];
  initialZoom?: number;
}

const MapView: React.FC<MapViewProps> = ({
  landmarks,
  selectedLandmark,
  onMarkerClick,
  boundaries = [],
  initialCenter = [127.7669, 35.9078],
  initialZoom = 7,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);

  // ====== 마커 레이어 ======
  const markerSourceRef = useRef(new VectorSource());
  const markerLayerRef = useRef(
    new VectorLayer({
      source: markerSourceRef.current,
    })
  );

  // ====== 행정경계 레이어 ======
  const boundarySourceRef = useRef(new VectorSource());
  const boundaryLayerRef = useRef(
    new VectorLayer({
      source: boundarySourceRef.current,
      style: new Style({
        stroke: new Stroke({
          color: "rgba(37, 99, 235, 0.9)",
          width: 2,
          lineJoin: "round",
          lineCap: "round",
        }),
        fill: new Fill({
          color: "rgba(37, 99, 235, 0.05)",
        }),
      }),
    })
  );

  // ====== 팝업 ======
  const popupRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<Overlay | null>(null);

  // -----------------------------
  // 1) 지도 생성
  // -----------------------------
  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;

    const base = new TileLayer({ source: new OSM() });

    const map = new Map({
      target: hostRef.current,
      layers: [base, boundaryLayerRef.current, markerLayerRef.current],
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
      boundarySourceRef.current.clear();
    };
  }, []);

  // -----------------------------
  // 2) 팝업 Overlay
  // -----------------------------
  useEffect(() => {
    if (!mapRef.current || !popupRef.current) return;

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
    };
  }, []);

  // -----------------------------
  // 3) 행정경계 Feature 생성
  // -----------------------------

useEffect(() => {
  const map = mapRef.current;
  if (!map || !boundaries?.length) return;

  const source = boundarySourceRef.current;
  source.clear();

  const geojson = new GeoJSON();

  boundaries.forEach((b) => {
    if (!b.geoJson) return;

    try {
      // ✅ 문자열일 수도 있으니 파싱
      const geom =
        typeof b.geoJson === "string" ? JSON.parse(b.geoJson) : b.geoJson;

      // ✅ 단일 Feature든 MultiPolygon이든 배열로 통일
      const features = geojson.readFeatures(geom, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      });

      // ✅ 각각 Feature에 속성 추가
      features.forEach((f) => {
        f.setProperties({
          admCode: b.admCode,
          admName: b.admName,
          level: b.level,
        });
      });

      // ✅ 배열 단위로 추가
      source.addFeatures(features);
    } catch (err) {
      console.error("❌ 경계 파싱 오류:", err, b);
    }
  });
}, [boundaries]);

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
  // 8) 렌더링
  // -----------------------------
  return (
    <div
      ref={hostRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      {/* 팝업 DOM */}
      <div
        ref={popupRef}
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
              {
                (selectedLandmark.address
                  ? ` · ${selectedLandmark.address}`
                  : "")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
