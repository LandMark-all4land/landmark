const TOKEN_KEY = 'auth_token';

export const authUtils = {
  // 토큰 저장
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  // 토큰 조회
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  // 토큰 삭제
  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  // 로그인 여부 확인
  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
