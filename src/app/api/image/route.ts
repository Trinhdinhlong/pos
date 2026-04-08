import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '../apiConfig';

/**
 * POST /api/image - Upload ảnh mới
 */

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = req.cookies.get('token')?.value;

    const beRes = await fetchBackend('/images/upload', {
      method: 'POST',
      body: formData,
    }, token);

    const data = await beRes.json();
    return NextResponse.json(data, { status: beRes.status });
  } catch (err) {
    console.error('Image upload error:', err);
    return NextResponse.json({ status: 'error', message: 'Lỗi upload ảnh' }, { status: 500 });
  }
}
