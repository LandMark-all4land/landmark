// src/map/components/MapView.tsx
import React, { useEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import TileWMS from "ol/source/TileWMS";
import GeoTIFF from "ol/source/GeoTIFF";
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
  rasterStat?: RasterStat | null;
  initialCenter?: [number, number];
  initialZoom?: number;
}

const MapView: React.FC<MapViewProps> = ({
  landmarks,
  selectedLandmark,
  onMarkerClick,
  rasterStat = null,
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

  // ====== GeoTIFF 레이어 ======
  const rasterLayerRef = useRef(
    new TileLayer<GeoTIFF>({
      visible: false,
      opacity: 0.65,
    })
  );

  // ====== GeoTIFF 범위(버퍼) 표시 레이어 ======
  const rasterFootprintSourceRef = useRef(new VectorSource());
  const rasterFootprintLayerRef = useRef(
    new VectorLayer({
      source: rasterFootprintSourceRef.current,
      visible: false,
      style: new Style({
        stroke: new Stroke({
          color: "rgba(249, 115, 22, 0.9)",
          width: 2,
          lineDash: [8, 6],
        }),
        fill: new Fill({
          color: "rgba(249, 115, 22, 0.15)",
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

    // VWorld 일반지도 레이어
    const base = new TileLayer({
      source: new XYZ({
        url: 'https://api.vworld.kr/req/wmts/1.0.0/8E952DFB-FFDE-33E3-BA8A-3D78FF78B6CC/Base/{z}/{y}/{x}.png'
      })
    });

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
        rasterLayerRef.current,
        boundaryLayer,
        rasterFootprintLayerRef.current,
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
      rasterFootprintSourceRef.current.clear();
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
  // 3-1) GeoTIFF 타일 갱신
  // -----------------------------
  useEffect(() => {
    const layer = rasterLayerRef.current;
    if (!layer) return;

    const url = rasterStat?.s3Path ?? null;

    if (!url) {
      layer.setVisible(false);
      return;
    }

    const source = new GeoTIFF({
      sources: [
        {
          url,
        },
      ],
      transition: 0,
      convertToRGB: true,
    });

    layer.setSource(source);
    layer.setVisible(true);
  }, [rasterStat?.s3Path]);

  // -----------------------------
  // 3-2) GeoTIFF 버퍼(폴리곤) 갱신
  // -----------------------------
  useEffect(() => {
    const source = rasterFootprintSourceRef.current;
    const layer = rasterFootprintLayerRef.current;
    const map = mapRef.current;
    if (!source || !layer || !map) return;

    source.clear();

    if (!rasterStat?.geom) {
      layer.setVisible(false);
      return;
    }

    const geojson = new GeoJSON();
    try {
      const features = geojson.readFeatures(
        {
          type: "Feature",
          geometry: rasterStat.geom,
          properties: {},
        },
        {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
        }
      );

      if (!features.length) {
        layer.setVisible(false);
        return;
      }

      source.addFeatures(features);
      layer.setVisible(true);

      const extent = source.getExtent();
      map.getView().fit(extent, {
        padding: [80, 80, 80, 80],
        duration: 600,
        maxZoom: 16,
      });
    } catch (err) {
      console.error("❌ GeoTIFF 폴리곤 파싱 오류:", err, rasterStat.geom);
      layer.setVisible(false);
    }
  }, [rasterStat]);

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
