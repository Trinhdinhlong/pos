
import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '../../apiConfig';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  // Gọi API backend thực tế
  try {
    const beRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await beRes.json();
    if (data.status === 'success' && data.data?.token) {
      // Set token vào HttpOnly cookie FE
      const res = NextResponse.json(data);
      res.cookies.set('token', data.data.token, { path: '/', sameSite: 'lax', httpOnly: false });
      return res;
    } else {
      return NextResponse.json(data, { status: beRes.status });
    }
  } catch (err) {
    return NextResponse.json({
      status: 'error',
      message: 'Không kết nối được máy chủ backend',
      data: null,
    }, { status: 500 });
  }
}
