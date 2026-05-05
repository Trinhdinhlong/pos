import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '../apiConfig';

/**
 * POST /api/auth?action=login - Đăng nhập
 * POST /api/auth?action=logout - Đăng xuất
 * POST /api/auth?action=register - Đăng ký
 * GET /api/auth?action=me - Lấy thông tin tài khoản hiện tại
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action');
    const token = req.cookies.get('token')?.value;

    if (action === 'me') {
      const beRes = await fetchBackend('/auth/me', { method: 'GET' }, token);
      const data = await beRes.json();
      return NextResponse.json(data, { status: beRes.status });
    }

    return NextResponse.json({ status: 'error', message: 'Action không hợp lệ' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Lỗi kết nối backend' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action');

    if (action === 'login') {
      const body = await req.json();
      const beRes = await fetchBackend('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await beRes.json();
      const res = NextResponse.json(data, { status: beRes.status });
      if (data.status === true || data.status === 'success' || data.status === 200) {
        res.cookies.set('token', data.data.token, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24, // 1 day
          path: '/',
        });
        res.cookies.set('user', JSON.stringify(data.data.user), {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24,
          path: '/',
        });
      }
      return res;
    }

    if (action === 'logout') {
      const res = NextResponse.json({ status: 'success', message: 'Đã đăng xuất' });
      res.cookies.delete('token');
      res.cookies.delete('user');
      return res;
    }

    if (action === 'register') {
      const body = await req.json();
      const beRes = await fetchBackend('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await beRes.json();
      return NextResponse.json(data, { status: beRes.status });
    }

    return NextResponse.json({ status: 'error', message: 'Action không hợp lệ' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Lỗi kết nối backend' }, { status: 500 });
  }
}
