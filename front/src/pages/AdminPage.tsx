import { useState, useEffect } from 'react';
import AdminMapView from '../map/components/AdminMapView';
import 'ol/ol.css';
import './AdminPage.css';

interface AdmBoundary {
  admCode: string;
  admName: string;
}

interface MonthlyRiskData {
  riskScore: number;
  riskLevel: string;
}

interface LandmarkWithMonthlyData {
  id: number;
  name: string;
  address: string;
  admCode: string;
  admName: string;
  latitude: number;
  longitude: number;
  monthlyData: Record<number, MonthlyRiskData | null>;
}

const AdminPage = () => {
  const [selectedCoords, setSelectedCoords] = useState<{lat: number, lon: number} | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [admCode, setAdmCode] = useState('');
  const [admBoundaries, setAdmBoundaries] = useState<AdmBoundary[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // 랜드마크 목록 관련 상태
  const [landmarks, setLandmarks] = useState<LandmarkWithMonthlyData[]>([]);
  const [showLandmarks, setShowLandmarks] = useState(false);
  const [isLoadingLandmarks, setIsLoadingLandmarks] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2024);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

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

  // 랜드마크 목록 조회 (페이지네이션)
  const fetchLandmarks = async (page: number = 0) => {
    setIsLoadingLandmarks(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/landmarks/admin/monthly?year=${selectedYear}&page=${page}&size=${pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const pageData = result.data;
          setLandmarks(pageData.content);
          setCurrentPage(pageData.currentPage);
          setTotalPages(pageData.totalPages);
          setTotalElements(pageData.totalElements);
          setShowLandmarks(true);
        }
      } else {
        console.error('랜드마크 조회 실패');
      }
    } catch (error) {
      console.error('랜드마크 조회 오류:', error);
    } finally {
      setIsLoadingLandmarks(false);
    }
  };

  // 랜드마크 삭제
  const handleDelete = async (landmarkId: number) => {
    if (!confirm('정말로 이 랜드마크를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/landmarks/${landmarkId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        alert('랜드마크가 삭제되었습니다.');
        // 목록 새로고침
        fetchLandmarks();
      } else {
        alert('삭제 실패');
      }
    } catch (error) {
      console.error('랜드마크 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
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

            <div className="landmark-list-controls">
              <div className="year-selector">
                <label htmlFor="year">조회 연도:</label>
                <input
                  type="number"
                  id="year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  min="2000"
                  max="2030"
                />
              </div>
              <button
                type="button"
                onClick={() => fetchLandmarks(0)}
                disabled={isLoadingLandmarks}
                className="fetch-landmarks-btn"
              >
                {isLoadingLandmarks ? '조회 중...' : '전체 랜드마크 조회'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showLandmarks && (
        <div className="landmarks-section">
          <div className="landmarks-header">
            <h2>랜드마크 목록</h2>
            <div className="pagination-info">
              총 {totalElements}개 | {currentPage + 1} / {totalPages} 페이지
            </div>
          </div>
          <div className="landmarks-table-container">
            <table className="landmarks-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>이름</th>
                  <th>주소</th>
                  <th>행정구역</th>
                  <th>1월</th>
                  <th>2월</th>
                  <th>3월</th>
                  <th>4월</th>
                  <th>5월</th>
                  <th>삭제</th>
                </tr>
              </thead>
              <tbody>
                {landmarks.map((landmark) => (
                  <tr key={landmark.id}>
                    <td>{landmark.id}</td>
                    <td>{landmark.name}</td>
                    <td className="address-cell">{landmark.address}</td>
                    <td>{landmark.admName}</td>
                    {[1, 2, 3, 4, 5].map((month) => {
                      const data = landmark.monthlyData[month];
                      return (
                        <td key={month} className={`risk-cell ${data?.riskLevel.toLowerCase()}`}>
                          {data ? (
                            <>
                              <div className="risk-score">{data.riskScore.toFixed(2)}</div>
                              <div className="risk-level">{data.riskLevel}</div>
                            </>
                          ) : (
                            <span className="no-data">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td>
                      <button
                        onClick={() => handleDelete(landmark.id)}
                        className="delete-btn"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-controls">
            <button
              onClick={() => fetchLandmarks(0)}
              disabled={currentPage === 0 || isLoadingLandmarks}
              className="pagination-btn"
            >
              처음
            </button>
            <button
              onClick={() => fetchLandmarks(currentPage - 1)}
              disabled={currentPage === 0 || isLoadingLandmarks}
              className="pagination-btn"
            >
              이전
            </button>
            <span className="page-number">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => fetchLandmarks(currentPage + 1)}
              disabled={currentPage >= totalPages - 1 || isLoadingLandmarks}
              className="pagination-btn"
            >
              다음
            </button>
            <button
              onClick={() => fetchLandmarks(totalPages - 1)}
              disabled={currentPage >= totalPages - 1 || isLoadingLandmarks}
              className="pagination-btn"
            >
              마지막
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
