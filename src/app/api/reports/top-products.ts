import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '../apiConfig';

// GET top products report
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const top = searchParams.get('top');
  const url = `${API_BASE_URL}/reports/top-products?from=${from}&to=${to}&top=${top}`;
  try {
    const beRes = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await beRes.json();
    return NextResponse.json(data, { status: beRes.status });
  } catch (err) {
    return NextResponse.json({
      status: 'error',
      message: 'Không kết nối được máy chủ backend',
      data: null,
    }, { status: 500 });
  }
}
