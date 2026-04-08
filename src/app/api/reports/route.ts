import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '../apiConfig';

/**
 * GET /api/reports?action=summary - Báo cáo tổng quan
 * GET /api/reports?action=top-products - Top sản phẩm bán chạy
 * GET /api/reports?action=revenue-by-table - Doanh thu theo bàn
 * GET /api/reports?action=revenue-trend - Xu hướng doanh thu
 * GET /api/reports?action=orders - Báo cáo đơn hàng
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action');
    const token = req.cookies.get('token')?.value;

    let endpoint = `/reports/summary`;
    if (action === 'top-products') {
      endpoint = `/reports/top-products?${searchParams.toString()}`;
    } else if (action === 'revenue-by-table') {
      endpoint = `/reports/revenue-by-table?${searchParams.toString()}`;
    } else if (action === 'revenue-trend') {
      endpoint = `/reports/revenue-trend?${searchParams.toString()}`;
    } else if (action === 'orders') {
      endpoint = `/reports/orders?${searchParams.toString()}`;
    }

    const beRes = await fetchBackend(endpoint, { method: 'GET' }, token);
    const data = await beRes.json();
    return NextResponse.json(data, { status: beRes.status });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Lỗi kết nối backend' }, { status: 500 });
  }
}
