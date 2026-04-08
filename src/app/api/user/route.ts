import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '../apiConfig';

/**
 * GET /api/user - Lấy danh sách users
 * POST /api/user - Tạo user mới
 * PUT /api/user?id=... - Cập nhật user
 * DELETE /api/user?id=... - Xoá user
 */

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    const { searchParams } = req.nextUrl;
    const beRes = await fetchBackend(`/users?${searchParams.toString()}`, { method: 'GET' }, token);
    const data = await beRes.json();
    return NextResponse.json(data, { status: beRes.status });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Lỗi kết nối backend' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    const body = await req.json();
    const beRes = await fetchBackend('/users', { 
      method: 'POST',
      body: JSON.stringify(body)
    }, token);
    const data = await beRes.json();
    return NextResponse.json(data, { status: beRes.status });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Lỗi kết nối backend' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ status: 'error', message: 'Thiếu ID người dùng' }, { status: 400 });

    const token = req.cookies.get('token')?.value;
    const body = await req.json();
    const beRes = await fetchBackend(`/users/${id}`, { 
      method: 'PUT',
      body: JSON.stringify(body)
    }, token);
    const data = await beRes.json();
    return NextResponse.json(data, { status: beRes.status });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Lỗi kết nối backend' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ status: 'error', message: 'Thiếu ID người dùng' }, { status: 400 });

    const token = req.cookies.get('token')?.value;
    const beRes = await fetchBackend(`/users/${id}`, { method: 'DELETE' }, token);
    const data = await beRes.json();
    return NextResponse.json(data, { status: beRes.status });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Lỗi kết nối backend' }, { status: 500 });
  }
}
