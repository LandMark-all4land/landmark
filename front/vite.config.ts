import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // ✅ 프론트 포트 변경
    open: true, // (선택) 자동으로 브라우저 열기
  },
})
