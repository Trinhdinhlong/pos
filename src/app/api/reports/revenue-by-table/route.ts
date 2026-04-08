import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '../../apiConfig';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const token = req.cookies.get('token')?.value;
    const beRes = await fetchBackend(`/reports/revenue-by-table?${searchParams.toString()}`, { method: 'GET' }, token);
    const data = await beRes.json();
    return NextResponse.json(data, { status: beRes.status });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Lỗi kết nối backend' }, { status: 500 });
  }
}
