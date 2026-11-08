'use client';

import React, { useState, useEffect } from 'react';
import { Movie } from '@/lib/types';
import MovieCard from '@/components/MovieCard';
import VideoPlayerModal from '@/components/VideoPlayerModal';
import { Search, Plus, RefreshCw } from 'lucide-react';
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
  const availableFormats = React.useMemo(() => {
    const set = new Set<string>();
    movies.forEach((m) => {
      if (m.video_format) {
        set.add(m.video_format.toLowerCase());
      }
    });
    return Array.from(set);
  }, [movies]);

  // Dynamic filter
  const filteredMovies = movies.filter((m) => {
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Landing Page Title with dynamic controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-red-100">
          <div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Cherry <span className="text-red-600">movies</span>
            </h1>
            {!loading && (
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {movies.length} {movies.length === 1 ? 'movie' : 'movies'} uploaded
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMovies}
              className="p-2 text-slate-500 hover:text-red-600 rounded-xl border border-slate-200 hover:border-red-200 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md shadow-red-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Movie</span>
              </Link>
            )}
          </div>
        </div>

        {/* Dynamic Search & Dynamic Format Filter (only when movies exist) */}
        {movies.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 my-6">
            {availableFormats.length > 1 && (
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
                <button
                  onClick={() => setSelectedFormat('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all tracking-wider ${
                    selectedFormat === 'all'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
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

            <div className="relative w-full sm:w-72 sm:ml-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 text-slate-800"
              />
            </div>
          </div>
        )}

        {/* Dynamic Movie Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-slate-100 rounded-2xl h-72 animate-pulse border border-slate-200"
              />
            ))}
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-20 px-4">
            <h3 className="text-base font-bold text-slate-700">
              {movies.length === 0 ? 'No movies uploaded yet' : 'No matching movies found'}
            </h3>
            {isAdmin && movies.length === 0 && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Upload First Movie</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
            {filteredMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onWatch={(m) => setActiveMovie(m)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      <VideoPlayerModal
        movie={activeMovie}
        onClose={() => setActiveMovie(null)}
      />
    </div>
  );
}
