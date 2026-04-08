export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : 'https://filamentous-unexplicitly-ignacio.ngrok-free.dev/api';
export const SIGNALR_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/paymentHub` : 'http://https://filamentous-unexplicitly-ignacio.ngrok-free.dev/paymentHub';

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
