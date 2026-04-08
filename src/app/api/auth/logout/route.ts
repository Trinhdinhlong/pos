import { NextResponse } from 'next/server';
import { API_BASE_URL } from '../../apiConfig';

export async function POST() {
  // Xóa cookie token
  const res = NextResponse.json({ success: true });
  res.cookies.set('token', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
