import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '../apiConfig';

// GET summary report
export async function GET(req: NextRequest) {
  try {
    const beRes = await fetch(`${API_BASE_URL}/reports/summary`, {
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
