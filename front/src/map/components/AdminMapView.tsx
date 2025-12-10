import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { fromLonLat, toLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Circle as CircleStyle, Fill, Stroke } from 'ol/style';

interface AdminMapViewProps {
  onMapClick: (lat: number, lon: number) => void;
  selectedCoords: { lat: number; lon: number } | null;
}

const AdminMapView = ({ onMapClick, selectedCoords }: AdminMapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const olMapRef = useRef<Map | null>(null);
  const markerSourceRef = useRef(new VectorSource());
  const markerLayerRef = useRef(
    new VectorLayer({
      source: markerSourceRef.current,
      style: new Style({
        image: new CircleStyle({
          radius: 10,
          fill: new Fill({ color: '#ff5722' }),
          stroke: new Stroke({ color: '#ffffff', width: 3 }),
        }),
      }),
    })
  );

  useEffect(() => {
    console.log('AdminMapView useEffect 실행');
    console.log('mapRef.current:', mapRef.current);
    console.log('olMapRef.current:', olMapRef.current);

    if (!mapRef.current) {
      console.error('mapRef.current가 없습니다!');
      return;
    }

    if (olMapRef.current) {
      console.log('이미 지도가 초기화되어 있습니다.');
      return;
    }

    console.log('지도 초기화 시작...');

    const map = new Map({
      target: mapRef.current,
      layers: [
        // VWorld 베이스맵
        new TileLayer({
          source: new XYZ({
            url: 'https://api.vworld.kr/req/wmts/1.0.0/8E952DFB-FFDE-33E3-BA8A-3D78FF78B6CC/Base/{z}/{y}/{x}.png',
          }),
        }),
        markerLayerRef.current,
      ],
      view: new View({
        center: fromLonLat([127.7669, 35.9078]),
        zoom: 7,
      }),
    });

    console.log('지도 생성 완료:', map);

    // 지도 클릭 이벤트
    map.on('click', (event) => {
      const coords = toLonLat(event.coordinate);
      const [lon, lat] = coords;
      console.log('지도 클릭됨:', { lat, lon });
      onMapClick(lat, lon);
    });

    olMapRef.current = map;
    console.log('지도 초기화 완료!');

    return () => {
      console.log('지도 정리 중...');
      map.setTarget(undefined);
      olMapRef.current = null; // 중요: ref 초기화
    };
  }, []); // onMapClick 제거 - 초기화 한 번만

  // 선택된 좌표에 마커 표시
  useEffect(() => {
    if (!selectedCoords) {
      markerSourceRef.current.clear();
      return;
    }

    const feature = new Feature({
      geometry: new Point(fromLonLat([selectedCoords.lon, selectedCoords.lat])),
    });

    markerSourceRef.current.clear();
    markerSourceRef.current.addFeature(feature);

    // 지도 중심 이동
    if (olMapRef.current) {
      olMapRef.current.getView().animate({
        center: fromLonLat([selectedCoords.lon, selectedCoords.lat]),
        zoom: 12,
        duration: 500,
      });
    }
  }, [selectedCoords]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};

export default AdminMapView;
