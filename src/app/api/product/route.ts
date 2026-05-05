import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '../apiConfig';

/**
 * GET /api/product - Lấy danh sách sản phẩm (hỗ trợ phân trang, tìm kiếm, category)
 * POST /api/product - Tạo sản phẩm mới
 * PUT /api/product?id=... - Cập nhật sản phẩm
 * DELETE /api/product?id=... - Xoá sản phẩm
 */

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    const { searchParams } = req.nextUrl;
    let endpoint = `/products?${searchParams.toString()}`;
    if (searchParams.get('action') === 'all') {
      endpoint = '/products/all';
    }
    const beRes = await fetchBackend(endpoint, { method: 'GET' }, token);
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
    const beRes = await fetchBackend('/products', { 
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
    if (!id) return NextResponse.json({ status: 'error', message: 'Thiếu ID sản phẩm' }, { status: 400 });

    const token = req.cookies.get('token')?.value;
    const body = await req.json();
    const beRes = await fetchBackend(`/products/${id}`, { 
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
    if (!id) return NextResponse.json({ status: 'error', message: 'Thiếu ID sản phẩm' }, { status: 400 });

    const token = req.cookies.get('token')?.value;
    const beRes = await fetchBackend(`/products/${id}`, { method: 'DELETE' }, token);
    const data = await beRes.json();
    return NextResponse.json(data, { status: beRes.status });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Lỗi kết nối backend' }, { status: 500 });
  }
}
