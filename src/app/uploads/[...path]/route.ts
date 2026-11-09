import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

const MIME_TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  mkv: 'video/x-matroska',
  avi: 'video/x-msvideo',
  webm: 'video/webm',
  mov: 'video/quicktime',
  avif: 'image/avif',
  vtt: 'text/vtt; charset=utf-8',
  srt: 'text/plain; charset=utf-8',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Range, Content-Type, Accept, Authorization, X-Requested-With',
  'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges, Content-Type',
};

function getFileDetails(params: { path: string[] }) {
  const filePathSegment = params.path.join('/');
  const safePath = path.normalize(filePathSegment).replace(/^(\.\.[\/\\])+/, '');
  const fullPath = path.join(process.cwd(), 'public', 'uploads', safePath);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const stat = fs.statSync(fullPath);
  const fileSize = stat.size;
  const ext = path.extname(fullPath).toLowerCase().replace('.', '');
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  return { fullPath, fileSize, contentType };
}

function parseRange(rangeHeader: string | null, fileSize: number) {
  if (!rangeHeader || !rangeHeader.startsWith('bytes=')) {
    return null;
  }

  const parts = rangeHeader.replace('bytes=', '').split('-');
  const startStr = parts[0]?.trim();
  const endStr = parts[1]?.trim();

  let start = 0;
  let end = fileSize - 1;

  if (startStr && endStr) {
    start = parseInt(startStr, 10);
    end = parseInt(endStr, 10);
  } else if (startStr && !endStr) {
    start = parseInt(startStr, 10);
    end = fileSize - 1;
  } else if (!startStr && endStr) {
    // Suffix range: bytes=-500 means the last 500 bytes
    const suffix = parseInt(endStr, 10);
    start = Math.max(0, fileSize - suffix);
    end = fileSize - 1;
  }

  if (isNaN(start) || isNaN(end) || start > end || start >= fileSize) {
    return { invalid: true as const };
  }

  end = Math.min(end, fileSize - 1);
  const chunkSize = end - start + 1;

  return { invalid: false as const, start, end, chunkSize };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function HEAD(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const file = getFileDetails(params);
    if (!file) {
      return new NextResponse(null, { status: 404, headers: CORS_HEADERS });
    }

    const rangeInfo = parseRange(req.headers.get('range'), file.fileSize);

    if (rangeInfo?.invalid) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          ...CORS_HEADERS,
          'Content-Range': `bytes */${file.fileSize}`,
        },
      });
    }

    if (rangeInfo) {
      return new NextResponse(null, {
        status: 206,
        headers: {
          ...CORS_HEADERS,
          'Accept-Ranges': 'bytes',
          'Content-Range': `bytes ${rangeInfo.start}-${rangeInfo.end}/${file.fileSize}`,
          'Content-Length': rangeInfo.chunkSize.toString(),
          'Content-Type': file.contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Accept-Ranges': 'bytes',
        'Content-Length': file.fileSize.toString(),
        'Content-Type': file.contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    console.error('Uploads HEAD error:', err);
    return new NextResponse(null, { status: 500, headers: CORS_HEADERS });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const file = getFileDetails(params);
    if (!file) {
      return new NextResponse('File not found', { status: 404, headers: CORS_HEADERS });
    }

    const rangeInfo = parseRange(req.headers.get('range'), file.fileSize);

    if (rangeInfo?.invalid) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          ...CORS_HEADERS,
          'Content-Range': `bytes */${file.fileSize}`,
        },
      });
    }

    // HTTP 206 Partial Content (critical for Xbox Edge / Windows Media Foundation seeking)
    if (rangeInfo) {
      const fileStream = fs.createReadStream(file.fullPath, {
        start: rangeInfo.start,
        end: rangeInfo.end,
      });

      const webStream = Readable.toWeb(fileStream);

      return new NextResponse(webStream as any, {
        status: 206,
        headers: {
          ...CORS_HEADERS,
          'Accept-Ranges': 'bytes',
          'Content-Range': `bytes ${rangeInfo.start}-${rangeInfo.end}/${file.fileSize}`,
          'Content-Length': rangeInfo.chunkSize.toString(),
          'Content-Type': file.contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Full file stream
    const fileStream = fs.createReadStream(file.fullPath);
    const webStream = Readable.toWeb(fileStream);

    return new NextResponse(webStream as any, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Accept-Ranges': 'bytes',
        'Content-Length': file.fileSize.toString(),
        'Content-Type': file.contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    console.error('Uploads route error:', err);
    return new NextResponse('Internal server error', { status: 500, headers: CORS_HEADERS });
  }
}
