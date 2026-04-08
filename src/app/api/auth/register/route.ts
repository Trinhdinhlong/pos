import { API_BASE_URL } from '../../apiConfig';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { username, password, fullName } = await req.json();
  // Dummy logic, replace with real DB/API
  if (!username || !password || !fullName) {
    return NextResponse.json({ success: false, message: 'Thiếu thông tin' }, { status: 400 });
  }
  // Giả lập đăng ký thành công
  return NextResponse.json({ success: true, message: 'Đăng ký thành công' });
}
