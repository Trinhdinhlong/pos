import { API_BASE_URL } from '../../apiConfig';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  // Dummy decode: nếu token là 'dummy-jwt-token' thì trả về user admin, nếu 'staff-token' thì trả về staff
  if (token === 'dummy-jwt-token') {
    return NextResponse.json({ success: true, user: { username: 'admin', fullName: 'Quản trị viên', role: 'admin' } });
  }
  if (token === 'staff-token') {
    return NextResponse.json({ success: true, user: { username: 'staff', fullName: 'Nhân viên', role: 'staff' } });
  }
  return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
}
