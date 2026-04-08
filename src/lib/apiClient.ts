import { API_BASE_URL, getTokenFromCookie } from "@/app/api/apiConfig";

interface ApiOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function apiClient(endpoint: string, options: ApiOptions = {}) {
  const token = getTokenFromCookie();

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Merge headers
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  // Prepend API_BASE_URL if endpoint doesn't start with http
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const res = await fetch(url, config);
  
  if (res.status === 401) {
    console.error("401 Unauthorized: Bạn cần đăng nhập lại!");
    // Tùy chọn: Chuyển hướng về trang login nếu cần
    // window.location.href = "/login";
    return res;
  }

  if (!res.ok) {
    const errorRes = res.clone(); // Clone để log lỗi mà không đóng stream
    const errorText = await errorRes.text();
    console.error(`API Error ${res.status}:`, errorText);
    return res;
  }

  return res;
}
