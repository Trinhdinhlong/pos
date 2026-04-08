import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '../apiConfig';

/**
 * GET /api/order - Danh sách đơn hàng
 * GET /api/order?action=active-by-table&id=... - Đơn hàng đang hoạt động của bàn
 * POST /api/order?action=create - Tạo đơn hàng (Khách)
 * POST /api/order?action=counter - Tạo đơn hàng (Quầy)
 * PUT /api/order?id=...&action=status - Cập nhật trạng thái đơn hàng
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const token = req.cookies.get('token')?.value;

    let endpoint = `/orders?${searchParams.toString()}`;
    if (action === 'active-by-table') {
      endpoint = `/orders/active-by-table/${id}`;
    } else if (id) {
      endpoint = `/orders/${id}`;
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
    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action');
    const token = req.cookies.get('token')?.value;
    const body = await req.json();

    let endpoint = '/orders/create';
    if (action === 'counter') {
      endpoint = '/orders/counter';
    }

    const beRes = await fetchBackend(endpoint, { 
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
    if (!id) return NextResponse.json({ status: 'error', message: 'Thiếu ID đơn hàng' }, { status: 400 });

    const token = req.cookies.get('token')?.value;
    const body = await req.json();

    let endpoint = `/orders/${id}`;
    if (action === 'status') {
      endpoint = `/orders/${id}/status`;
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
