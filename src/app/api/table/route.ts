import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '../apiConfig';

/**
 * GET /api/table - Lấy danh sách bàn
 * GET /api/table?token=... - Lấy thông tin bàn bằng token
 * POST /api/table - Tạo bàn mới
 * PUT /api/table?id=... - Cập nhật thông tin bàn
 * PUT /api/table?id=...&action=status - Cập nhật trạng thái bàn
 * DELETE /api/table?id=... - Xoá bàn
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const tokenParam = searchParams.get('token');
    const cookieToken = req.cookies.get('token')?.value;

    if (tokenParam) {
      // Tìm bàn bằng token (Cho khách hàng)
      const beRes = await fetchBackend(`/tables/token?token=${tokenParam}`, { method: 'GET' });
      const data = await beRes.json();
      return NextResponse.json(data, { status: beRes.status });
    }

    // Lấy tất cả bàn (Cho admin)
    const beRes = await fetchBackend('/tables', { method: 'GET' }, cookieToken);
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
    const beRes = await fetchBackend('/tables', { 
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
    const action = searchParams.get('action');
    if (!id) return NextResponse.json({ status: 'error', message: 'Thiếu ID bàn' }, { status: 400 });

    const token = req.cookies.get('token')?.value;
    const body = await req.json();

    let endpoint = `/tables/${id}`;
    if (action === 'status') {
      endpoint = `/tables/${id}/status`;
    }

    const beRes = await fetchBackend(endpoint, { 
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
    if (!id) return NextResponse.json({ status: 'error', message: 'Thiếu ID bàn' }, { status: 400 });

    const token = req.cookies.get('token')?.value;
    const beRes = await fetchBackend(`/tables/${id}`, { method: 'DELETE' }, token);
    const data = await beRes.json();
    return NextResponse.json(data, { status: beRes.status });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Lỗi kết nối backend' }, { status: 500 });
  }
}
