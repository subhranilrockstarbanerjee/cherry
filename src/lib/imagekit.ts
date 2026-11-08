import ImageKit from 'imagekit';

export const IMAGEKIT_URL_ENDPOINT =
  process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ||
  process.env.IMAGEKIT_URL_ENDPOINT ||
  'https://ik.imagekit.io/j3mihntzd/';

export const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'default_public_key',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'default_private_key',
  urlEndpoint: IMAGEKIT_URL_ENDPOINT,
});

/**
 * Builds an ImageKit CDN URL for a given relative or uploaded path
 */
export function getImageKitUrl(filePath: string): string {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  const baseUrl = IMAGEKIT_URL_ENDPOINT.endsWith('/')
    ? IMAGEKIT_URL_ENDPOINT
    : `${IMAGEKIT_URL_ENDPOINT}/`;

  return `${baseUrl}${cleanPath}`;
}

