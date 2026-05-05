// import { NextRequest, NextResponse } from 'next/server';
// import { fetchBackend } from '../apiConfig';

// /**
//  * GET /api/images?file=... - Proxy lấy ảnh từ backend
//  */

// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = req.nextUrl;
//     const filename = searchParams.get('file');

//     if (!filename) {
//       return new NextResponse('Missing filename', { status: 400 });
//     }

//     // Endpoint cho backend là /images/filename
//     const endpoint = `http://localhost:5298/api/images/${filename}`;

//     const beRes = await fetchBackend(endpoint, {
//       method: 'GET',
//     });
    
//     if (!beRes.ok) {
//         return new NextResponse(null, { status: beRes.status });
//     }

//     const contentType = beRes.headers.get('content-type') || 'image/jpeg';
//     const buffer = await beRes.arrayBuffer();

//     return new NextResponse(buffer, {
//       headers: {
//         'Content-Type': contentType,
//         'Cache-Control': 'public, max-age=31536000, immutable',
//       },
//     });
//   } catch (err) {
//     return new NextResponse(null, { status: 500 });
//   }
// }

// Thêm dòng này để fix lỗi TypeScript "is not a module" do comment toàn bộ code
export {};
