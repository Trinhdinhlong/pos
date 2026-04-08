import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '../apiConfig';

/**
 * GET /api/shift?action=history - Lấy lịch sử ca làm việc
 * GET /api/shift?action=current - Lấy ca hiện tại
 * POST /api/shift?action=open - Mở ca mới
 * POST /api/shift?id=...&action=close - Đóng ca
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action');
    const token = req.cookies.get('token')?.value;

    const backendParams = new URLSearchParams(searchParams.toString());
    backendParams.delete('action');

    let endpoint = `/shifts?${backendParams.toString()}`;
    if (action === 'current') {
      endpoint = `/shifts?status=Open&pageSize=1`;
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
    const id = searchParams.get('id');
    const token = req.cookies.get('token')?.value;
    const body = await req.json();

    let endpoint = '/shifts/open';
    if (action === 'close') {
      endpoint = `/shifts/${id}/close`;
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
