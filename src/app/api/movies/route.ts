import { NextRequest, NextResponse } from 'next/server';
import { getMovies, addMovie, deleteMovie } from '@/lib/movieStore';
import { Movie } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const movies = await getMovies();
    return NextResponse.json({ success: true, movies });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch movies' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      video_url,
      video_format,
      thumbnail_url,
      subtitle_url,
      subtitle_label,
      genre,
      duration,
      release_year,
      rating,
    } = body;

    if (!title || !video_url || !thumbnail_url) {
      return NextResponse.json(
        { success: false, error: 'Title, video URL, and thumbnail URL are required' },
        { status: 400 }
      );
    }

    const newMovie: Movie = {
      id: 'cherry-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: title.trim(),
      description: description?.trim() || '',
      video_url: video_url.trim(),
      video_format: (video_format || 'mp4').toLowerCase().replace('.', ''),
      thumbnail_url: thumbnail_url.trim(),
      subtitle_url: subtitle_url?.trim() || undefined,
      subtitle_label: subtitle_label?.trim() || undefined,
      genre: genre?.trim() || undefined,
      duration: duration?.trim() || undefined,
      release_year: release_year ? Number(release_year) : undefined,
      rating: rating?.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    const saved = await addMovie(newMovie);
    return NextResponse.json({ success: true, movie: saved });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create movie' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Movie ID is required for deletion' },
        { status: 400 }
      );
    }

    const deleted = await deleteMovie(id);
    return NextResponse.json({ success: true, deleted, id });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete movie' },
      { status: 500 }
    );
  }
}

