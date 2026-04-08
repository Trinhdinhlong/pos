import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '../apiConfig';

/**
 * GET /api/category - Lấy danh sách categories
 * POST /api/category - Tạo mới category
 * PUT /api/category?id=... - Cập nhật category
 * DELETE /api/category?id=... - Xoá category
 */

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    const beRes = await fetchBackend('/categories', { method: 'GET' }, token);
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
    const beRes = await fetchBackend('/categories', { 
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
    if (!id) return NextResponse.json({ status: 'error', message: 'Thiếu ID' }, { status: 400 });

    const token = req.cookies.get('token')?.value;
    const body = await req.json();
    const beRes = await fetchBackend(`/categories/${id}`, { 
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
    if (!id) return NextResponse.json({ status: 'error', message: 'Thiếu ID' }, { status: 400 });

    const token = req.cookies.get('token')?.value;
    const beRes = await fetchBackend(`/categories/${id}`, { method: 'DELETE' }, token);
    const data = await beRes.json();
    return NextResponse.json(data, { status: beRes.status });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Lỗi kết nối backend' }, { status: 500 });
  }
}
