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
import { Style, Circle as CircleStyle, Fill, Stroke } from "ol/style";
import type { Landmark } from "../types/Landmark";

interface MapViewProps {
  selectedLandmark?: Landmark | null;
  /** 초기 중심([lon, lat]) 및 줌을 바꾸고 싶으면 props로 넘겨도 됨 */
  initialCenter?: [number, number];
  initialZoom?: number;
}

const MapView: React.FC<MapViewProps> = ({
  selectedLandmark,
  initialCenter = [127.7669, 35.9078], // 대한민국 대략 중심(경도, 위도)
  initialZoom = 7,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markerSourceRef = useRef(new VectorSource());
  const markerLayerRef = useRef(
    new VectorLayer({
      source: markerSourceRef.current,
      style: new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: "#1976d2" }),
          stroke: new Stroke({ color: "#fff", width: 2 }),
        }),
      }),
    })
  );

  // 최초 1회: 지도 생성
  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;

    const base = new TileLayer({ source: new OSM() }); // ✅ new OSM()

    const map = new Map({
      target: hostRef.current,
      layers: [base, markerLayerRef.current],
      view: new View({
        center: fromLonLat(initialCenter), // ✅ [lon, lat]
        zoom: initialZoom,
      }),
    });

    mapRef.current = map;

    return () => {
      // 언마운트 시 정리
      map.setTarget(undefined);
      mapRef.current = null;
      markerSourceRef.current.clear();
    };
  }, [initialCenter, initialZoom]);

  // 선택된 랜드마크 변경 시: 마커 갱신 + 애니메이션 이동
  useEffect(() => {
    if (!mapRef.current || !selectedLandmark) return;

    const { longitude, latitude } = selectedLandmark;
    const center = fromLonLat([longitude, latitude]);

    const feature = new Feature(new Point(center));
    markerSourceRef.current.clear();
    markerSourceRef.current.addFeature(feature);

    mapRef.current.getView().animate({
      center,
      zoom: 14,
      duration: 900,
    });
  }, [selectedLandmark]);

  return (
    <div
      ref={hostRef}
      style={{
        width: "100%",
        height: "100%",
        // 부모가 0px이면 지도도 안 보여. 상위에서 height를 채워줘(예: 100vh).
      }}
    />
  );
};

export default MapView;