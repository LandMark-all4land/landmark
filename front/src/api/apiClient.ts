import axios from 'axios';
import { authUtils } from '../auth/authUtils';

const apiClient = axios.create({
  // baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
});

// 요청 인터셉터: 모든 요청에 Authorization 헤더 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = authUtils.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 401 에러 시 토큰 삭제 및 로그인 페이지로 리다이렉트
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authUtils.removeToken();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
