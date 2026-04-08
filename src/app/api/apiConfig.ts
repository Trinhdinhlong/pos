export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : 'http://localhost:5298/api';
export const SIGNALR_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/paymentHub` : 'http://127.0.0.1:5298/paymentHub';
export const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/images` : 'http://127.0.0.1:5298/api/images';

// Header để bỏ qua trang cảnh báo của ngrok (Free tier)
export const NGROK_HEADERS = {
  "ngrok-skip-browser-warning": "true",
};

// Cấu hình ngân hàng SePay nhận tiền
export const SEPAY_CONFIG = {
  acc: "VQRQAFIPP3004", // Số tài khoản/Alias của bạn
  bank: "MBBank"       // Tên ngân hàng (Vd: MBBank, Vietcombank...)
};

// Hàm lấy token từ cookie phía client
export function getTokenFromCookie() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Helper fetch phía server dùng cho API Routes
export async function fetchBackend(endpoint: string, options: RequestInit = {}, token?: string) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
    const headers = new Headers(options.headers);
    // Chèn ngrok bypass
    Object.entries(NGROK_HEADERS).forEach(([k, v]) => headers.set(k, v));
    
    // Chèn token nếu có
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // Chỉ set application/json cho các request có body và không phải GET/HEAD
    const method = options.method?.toUpperCase() || 'GET';
    if (!headers.has('Content-Type') && !(options.body instanceof FormData) && method !== 'GET' && method !== 'HEAD') {
        headers.set('Content-Type', 'application/json');
    }

    return fetch(url, {
        ...options,
        headers,
    });
}
