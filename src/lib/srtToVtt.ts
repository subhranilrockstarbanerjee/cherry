/**
 * Convert SubRip (.srt) subtitle string to WebVTT (.vtt) format
 */
export function srtToVtt(srtContent: string): string {
  // If already WebVTT, return as is
  if (srtContent.trim().startsWith('WEBVTT')) {
    return srtContent;
  }

  // Replace comma with dot in timestamp: 00:01:20,000 --> 00:01:20.000
  let vtt = srtContent.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');

  // Strip Windows carriage returns
  vtt = vtt.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  return 'WEBVTT\n\n' + vtt.trim() + '\n';
}

