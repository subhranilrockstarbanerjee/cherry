export interface Movie {
  id: string;
  title: string;
  description: string;
  video_url: string;
  video_format: string; // 'mkv' | 'mp4' | 'avi' | 'webm' | 'avif' | 'mov'
  thumbnail_url: string;
  subtitle_url?: string;
  subtitle_label?: string; // e.g. "English", "Spanish"
  genre?: string;
  duration?: string;
  release_year?: number;
  rating?: string;
  created_at: string;
}

export interface UserSession {
  email: string;
  id: string;
  role?: string;
  isAdmin: boolean;
}

