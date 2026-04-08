import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '../apiConfig';

// Example: GET all categories
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const beRes = await fetch(`${API_BASE_URL}/catagory`, {
      method: 'GET',
      headers,
    });
    const data = await beRes.json();
    return NextResponse.json(data, { status: beRes.status });
  } catch {
    return NextResponse.json({
      status: 'error',
      message: 'Không kết nối được máy chủ backend',
      data: null,
    }, { status: 500 });
  }
}

// Example: POST create category
export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const token = req.cookies.get('token')?.value;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const beRes = await fetch(`${API_BASE_URL}/catagory`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await beRes.json();
    return NextResponse.json(data, { status: beRes.status });
  } catch {
    return NextResponse.json({
      status: 'error',
      message: 'Không kết nối được máy chủ backend',
      data: null,
    }, { status: 500 });
  }
}
