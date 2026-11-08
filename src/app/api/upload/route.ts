import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
import busboy from 'busboy';
import { imagekit, getImageKitUrl } from '@/lib/imagekit';
import { srtToVtt } from '@/lib/srtToVtt';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for large movie uploads

interface UploadResult {
  url: string;
  originalName: string;
  format: string;
  size: number;
  uploadMethod: string;
  imagekitUrl?: string;
}

function parseWithBusboy(req: NextRequest, contentType: string): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    try {
      const bb = busboy({
        headers: { 'content-type': contentType },
        limits: {
          fileSize: 10 * 1024 * 1024 * 1024, // 10GB limit to prevent premature cutoff
          files: 1,
        },
      });

      let fileType = 'video';
      let originalName = 'unnamed_file';
      let uploadedFilePath = '';
      let relativeUrl = '';
      let ext = 'mp4';
      let bytesWritten = 0;
      let hasFile = false;
      let fileWritePromise: Promise<void> | null = null;

      bb.on('field', (name, value) => {
        if (name === 'type') {
          fileType = value || 'video';
        }
      });

      bb.on('file', (fieldname, stream, info) => {
        hasFile = true;
        originalName = info.filename || 'unnamed_file';
        ext =
          path.extname(originalName).toLowerCase().replace('.', '') ||
          (fileType === 'video' ? 'mp4' : fileType === 'image' ? 'jpg' : 'vtt');

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', `${fileType}s`);
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filename = `cherry_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        uploadedFilePath = path.join(uploadDir, filename);
        relativeUrl = `/uploads/${fileType}s/${filename}`;

        const writeStream = fs.createWriteStream(uploadedFilePath);
        fileWritePromise = new Promise((resWrite, rejWrite) => {
          stream.on('data', (chunk) => {
            bytesWritten += chunk.length;
          });
          stream.pipe(writeStream);
          writeStream.on('finish', () => resWrite());
          writeStream.on('error', (err) => rejWrite(err));
        });
      });

      bb.on('error', (err) => {
        reject(err);
      });

      bb.on('close', async () => {
        try {
          if (!hasFile) {
            return reject(new Error('No file provided in form data'));
          }

          if (fileWritePromise) {
            await fileWritePromise;
          }

          // If subtitle is .srt, convert to WebVTT
          if (fileType === 'subtitle' && ext === 'srt' && fs.existsSync(uploadedFilePath)) {
            const srtContent = fs.readFileSync(uploadedFilePath, 'utf-8');
            const vttContent = srtToVtt(srtContent);
            const vttPath = uploadedFilePath.replace(/\.srt$/i, '.vtt');
            fs.writeFileSync(vttPath, vttContent, 'utf-8');
            uploadedFilePath = vttPath;
            relativeUrl = relativeUrl.replace(/\.srt$/i, '.vtt');
            ext = 'vtt';
          }

          let finalUrl = relativeUrl;
          let method = 'local';
          const ikCdnUrl = getImageKitUrl(relativeUrl);

          // Upload to ImageKit if keys are set and file is within ImageKit API limit (25MB)
          if (
            process.env.IMAGEKIT_PRIVATE_KEY &&
            process.env.IMAGEKIT_PUBLIC_KEY &&
            bytesWritten < 25 * 1024 * 1024
          ) {
            try {
              const fileBuffer = fs.readFileSync(uploadedFilePath);
              const ikResult: any = await imagekit.upload({
                file: fileBuffer,
                fileName: path.basename(uploadedFilePath),
                folder: `/cherry_movies/${fileType}s`,
              });

              if (ikResult && ikResult.url) {
                finalUrl = ikResult.url;
                method = 'imagekit';
              }
            } catch (ikError) {
              // fallback to local streaming URL
            }
          }

          resolve({
            url: finalUrl,
            imagekitUrl: ikCdnUrl,
            originalName,
            format: ext,
            size: bytesWritten,
            uploadMethod: method,
          });
        } catch (e) {
          reject(e);
        }
      });

      if (!req.body) {
        return reject(new Error('Request body is empty'));
      }

      const nodeStream = Readable.fromWeb(req.body as any);
      nodeStream.pipe(bb);
    } catch (err) {
      reject(err);
    }
  });
}

// Fallback direct stream parser for raw body uploads
async function parseRawStream(req: NextRequest): Promise<UploadResult> {
  const url = new URL(req.url);
  const fileType = url.searchParams.get('type') || 'video';
  const originalName = url.searchParams.get('filename') || `file_${Date.now()}`;
  const ext =
    path.extname(originalName).toLowerCase().replace('.', '') ||
    (fileType === 'video' ? 'mp4' : fileType === 'image' ? 'jpg' : 'vtt');

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', `${fileType}s`);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `cherry_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const uploadedFilePath = path.join(uploadDir, filename);
  let relativeUrl = `/uploads/${fileType}s/${filename}`;

  if (!req.body) {
    throw new Error('Request body is empty');
  }

  const nodeStream = Readable.fromWeb(req.body as any);
  const writeStream = fs.createWriteStream(uploadedFilePath);
  let bytesWritten = 0;

  await new Promise<void>((resolve, reject) => {
    nodeStream.on('data', (chunk) => {
      bytesWritten += chunk.length;
    });
    nodeStream.pipe(writeStream);
    writeStream.on('finish', () => resolve());
    writeStream.on('error', (err) => reject(err));
  });

  // If subtitle is .srt, convert to WebVTT
  if (fileType === 'subtitle' && ext === 'srt' && fs.existsSync(uploadedFilePath)) {
    const srtContent = fs.readFileSync(uploadedFilePath, 'utf-8');
    const vttContent = srtToVtt(srtContent);
    const vttPath = uploadedFilePath.replace(/\.srt$/i, '.vtt');
    fs.writeFileSync(vttPath, vttContent, 'utf-8');
    relativeUrl = relativeUrl.replace(/\.srt$/i, '.vtt');
  }

  let finalUrl = relativeUrl;
  let method = 'local';
  const ikCdnUrl = getImageKitUrl(relativeUrl);

  if (
    process.env.IMAGEKIT_PRIVATE_KEY &&
    process.env.IMAGEKIT_PUBLIC_KEY &&
    bytesWritten < 25 * 1024 * 1024
  ) {
    try {
      const fileBuffer = fs.readFileSync(uploadedFilePath);
      const ikResult: any = await imagekit.upload({
        file: fileBuffer,
        fileName: path.basename(uploadedFilePath),
        folder: `/cherry_movies/${fileType}s`,
      });

      if (ikResult && ikResult.url) {
        finalUrl = ikResult.url;
        method = 'imagekit';
      }
    } catch (ikError) {
      // fallback to local
    }
  }

  return {
    url: finalUrl,
    imagekitUrl: ikCdnUrl,
    originalName,
    format: ext,
    size: bytesWritten,
    uploadMethod: method,
  };
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // 1. If multipart/form-data, parse reliably with busboy
    if (contentType.toLowerCase().includes('multipart/form-data')) {
      const result = await parseWithBusboy(req, contentType);
      return NextResponse.json({ success: true, ...result });
    }

    // 2. Otherwise handle raw stream upload
    const rawResult = await parseRawStream(req);
    return NextResponse.json({ success: true, ...rawResult });
  } catch (error: any) {
    console.error('Upload processing error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
