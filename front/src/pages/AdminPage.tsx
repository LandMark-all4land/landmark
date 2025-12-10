import { useState, useEffect } from 'react';
import AdminMapView from '../map/components/AdminMapView';
import 'ol/ol.css';
import './AdminPage.css';

interface AdmBoundary {
  admCode: string;
  admName: string;
}

const AdminPage = () => {
  const [selectedCoords, setSelectedCoords] = useState<{lat: number, lon: number} | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [admCode, setAdmCode] = useState('');
  const [admBoundaries, setAdmBoundaries] = useState<AdmBoundary[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // 행정구역 목록 로드
  useEffect(() => {
    const fetchAdmBoundaries = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/boundaries/simple`);
        const result = await response.json();
        console.log('API 응답:', result);
        if (result.success && Array.isArray(result.data)) {
          console.log('행정구역 데이터:', result.data);
          setAdmBoundaries(result.data);
        }
      } catch (error) {
        console.error('행정구역 목록 로드 실패:', error);
      }
    };
    fetchAdmBoundaries();
  }, []);

  const handleMapClick = (lat: number, lon: number) => {
    setSelectedCoords({ lat, lon });
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCoords) {
      setMessage('지도에서 위치를 먼저 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/landmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          address,
          latitude: selectedCoords.lat,
          longitude: selectedCoords.lon,
          admCode
        })
      });

      if (response.ok) {
        setMessage('✅ 랜드마크가 성공적으로 생성되었습니다!');
        // 폼 초기화
        setName('');
        setAddress('');
        setAdmCode('');
        setSelectedCoords(null);
      } else {
        const error = await response.json();
        setMessage(`❌ 생성 실패: ${error.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      setMessage('❌ 네트워크 오류가 발생했습니다.');
      console.error('Error creating landmark:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>🔧 관리자 페이지</h1>
        <p>지도를 클릭하여 새로운 랜드마크를 추가하세요</p>
      </div>

      <div className="admin-content">
        <div className="admin-map">
          <AdminMapView onMapClick={handleMapClick} selectedCoords={selectedCoords} />
        </div>

        <div className="admin-form-container">
          <form onSubmit={handleSubmit} className="admin-form">
            <h2>랜드마크 정보 입력</h2>

            {selectedCoords && (
              <div className="coords-display">
                <strong>선택된 좌표:</strong>
                <p>위도: {selectedCoords.lat.toFixed(6)}</p>
                <p>경도: {selectedCoords.lon.toFixed(6)}</p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name">랜드마크 이름 *</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="예: 남산타워"
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">주소 *</label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                placeholder="예: 서울특별시 용산구..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="admCode">행정구역 선택 *</label>
              <select
                id="admCode"
                value={admCode}
                onChange={(e) => setAdmCode(e.target.value)}
                required
              >
                <option value="">-- 행정구역을 선택하세요 --</option>
                {admBoundaries.map((adm) => (
                  <option key={adm.admCode} value={adm.admCode}>
                    {adm.admName} ({adm.admCode})
                  </option>
                ))}
              </select>
            </div>

            {message && (
              <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            <button type="submit" disabled={isSubmitting || !selectedCoords}>
              {isSubmitting ? '생성 중...' : '랜드마크 생성'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
