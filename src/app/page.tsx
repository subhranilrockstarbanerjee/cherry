'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Movie } from '@/lib/types';
import MovieCard from '@/components/MovieCard';
import VideoPlayerModal from '@/components/VideoPlayerModal';
import { Search, Plus, RefreshCw, Play, Film } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [activeMovie, setActiveMovie] = useState<Movie | null>(null);
  const { isAdmin } = useAuth();

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/movies', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.movies)) {
        setMovies(data.movies);
      } else {
        setMovies([]);
      }
    } catch (err) {
      console.error('Failed to load movies:', err);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  // Formats derived dynamically only from existing uploaded movies
  const availableFormats = useMemo(() => {
    const set = new Set<string>();
    movies.forEach((m) => {
      if (m.video_format) {
        set.add(m.video_format.toLowerCase());
      }
    });
    return Array.from(set);
  }, [movies]);

  // Dynamic filter
  const filteredMovies = useMemo(() => {
    return movies.filter((m) => {
      const matchesSearch =
        !searchQuery ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.genre && m.genre.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFormat =
        selectedFormat === 'all' ||
        m.video_format?.toLowerCase() === selectedFormat.toLowerCase();

      return matchesSearch && matchesFormat;
    });
  }, [movies, searchQuery, selectedFormat]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section matching the Red & White Reference Style */}
      <section className="relative overflow-hidden bg-white border-b border-red-100/60">
        {/* Decorative Sweeping Red Curve (matching reference image) */}
        <div className="pointer-events-none absolute -top-12 -right-24 w-[420px] sm:w-[580px] md:w-[700px] h-[500px] sm:h-[650px] z-0 opacity-95">
          <svg
            viewBox="0 0 500 500"
            className="w-full h-full text-red-600 fill-current"
            preserveAspectRatio="none"
          >
            <path d="M120,0 C260,140 450,220 500,500 L500,0 Z" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 relative z-10">
          <div className="max-w-2xl">
            {/* Outline Text + Solid Title (matching "MODERN SOFTWARE SOLUTIONS" in reference) */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-slate-900 leading-none">
              <span
                className="block text-transparent mb-1"
                style={{
                  WebkitTextStroke: '2px #0f172a',
                  letterSpacing: '0.04em',
                }}
              >
                STREAMING
              </span>
              <span>CHERRY </span>
              <span className="text-red-600">MOVIES</span>
            </h1>

            {/* Red Accent Dash */}
            <div className="w-12 h-1.5 bg-red-600 my-5 rounded-full" />

            <p className="text-sm sm:text-base text-slate-600 max-w-lg font-medium leading-relaxed">
              Stream unlimited high-definition movies in all formats (.mkv, .mp4, .avi, .avif, .webm) with multi-language subtitle tracks.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#movie-catalog"
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-500/25 transition-all transform hover:-translate-y-0.5"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Watch Movies</span>
              </a>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Admin Upload</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Section matching the "SERVICES WE PROVIDE" layout */}
      <section id="movie-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-red-100">
          <div>
            <div className="text-red-600 text-xs font-black uppercase tracking-[0.2em] mb-1.5">
              OUR COLLECTION
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight">
              MOVIES WE PROVIDE
            </h2>
            {!loading && (
              <p className="text-xs text-slate-500 mt-1 font-semibold">
                {movies.length} {movies.length === 1 ? 'movie' : 'movies'} dynamically loaded
              </p>
            )}
          </div>

          {/* Dynamic Controls: Refresh, Formats, and Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search movies or genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 text-slate-800 font-medium"
              />
            </div>

            <button
              onClick={fetchMovies}
              className="p-2 text-slate-500 hover:text-red-600 rounded-xl border border-slate-200 hover:border-red-200 transition-colors flex items-center justify-center"
              title="Refresh Catalog"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dynamic Video Format Filter Chips */}
        {availableFormats.length > 1 && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-xl my-6 overflow-x-auto border border-slate-100">
            <button
              onClick={() => setSelectedFormat('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all tracking-wider ${
                selectedFormat === 'all'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Formats
            </button>
            {availableFormats.map((fmt) => (
              <button
                key={fmt}
                onClick={() => setSelectedFormat(fmt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all tracking-wider ${
                  selectedFormat === fmt
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                .{fmt}
              </button>
            ))}
          </div>
        )}

        {/* Dynamic Movie Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-slate-50 rounded-2xl h-80 animate-pulse border border-slate-200"
              />
            ))}
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-20 px-4 bg-slate-50/50 rounded-3xl border border-slate-100 mt-8">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Film className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {movies.length === 0 ? 'No movies uploaded yet' : 'No matching movies found'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {movies.length === 0
                ? 'The admin portal allows administrators to upload movies in any format (.mkv, .mp4, .avi, .avif, .webm).'
                : 'Try adjusting your search query or format filter.'}
            </p>
            {isAdmin && movies.length === 0 && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 mt-5 px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 shadow-md shadow-red-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Upload First Movie</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
            {filteredMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onWatch={(m) => setActiveMovie(m)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Video Player Modal with Subtitles & Multi-Format Playback */}
      <VideoPlayerModal
        movie={activeMovie}
        onClose={() => setActiveMovie(null)}
      />
    </div>
  );
}
