'use client';

import React from 'react';
import { Movie } from '@/lib/types';
import { Play, Subtitles, Clock, Calendar } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onWatch: (movie: Movie) => void;
}

export default function MovieCard({ movie, onWatch }: MovieCardProps) {
  const formatBadgeColors: Record<string, string> = {
    mkv: 'bg-red-600 text-white',
    mp4: 'bg-rose-500 text-white',
    avi: 'bg-amber-600 text-white',
    avif: 'bg-purple-600 text-white',
    webm: 'bg-blue-600 text-white',
    mov: 'bg-emerald-600 text-white',
  };

  const badgeClass =
    formatBadgeColors[movie.video_format?.toLowerCase()] || 'bg-red-600 text-white';

  return (
    <div
      onClick={() => onWatch(movie)}
      className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200/80 hover:border-red-500 shadow-sm hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 flex flex-col cursor-pointer transform hover:-translate-y-1"
    >
      {/* Poster Image */}
      <div className="relative aspect-[16/10] w-full bg-slate-950 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={movie.thumbnail_url}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

        {/* Video Format Badge */}
        {movie.video_format && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider shadow-sm ${badgeClass}`}
            >
              .{movie.video_format}
            </span>
            {movie.rating && (
              <span className="bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/20">
                {movie.rating}
              </span>
            )}
          </div>
        )}

        {/* Subtitle Badge */}
        {movie.subtitle_url && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-950/80 backdrop-blur-md text-red-200 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-red-500/30 shadow-sm">
            <Subtitles className="w-3.5 h-3.5 text-red-400" />
            <span>{movie.subtitle_label || 'CC'}</span>
          </div>
        )}

        {/* Play Icon on hover */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/40 transform scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
            <Play className="w-7 h-7 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Bottom meta */}
        {(movie.duration || movie.release_year) && (
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs">
            {movie.duration ? (
              <span className="flex items-center gap-1 font-medium text-slate-200">
                <Clock className="w-3.5 h-3.5 text-red-400" />
                {movie.duration}
              </span>
            ) : <span />}
            {movie.release_year ? (
              <span className="flex items-center gap-1 font-medium text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-red-400" />
                {movie.release_year}
              </span>
            ) : <span />}
          </div>
        )}
      </div>

      {/* Card Content - purely dynamic values */}
      <div className="p-4 flex-1 flex flex-col justify-between bg-white">
        <div>
          {movie.genre && (
            <span className="text-[11px] font-semibold tracking-wide uppercase text-red-600">
              {movie.genre}
            </span>
          )}
          <h3 className="text-base font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-1 mt-0.5">
            {movie.title}
          </h3>
          {movie.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
              {movie.description}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWatch(movie);
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-red-600 group-hover:text-red-700 hover:underline"
          >
            <Play className="w-3.5 h-3.5 fill-red-600" />
            <span>Play</span>
          </button>
        </div>
      </div>
    </div>
  );
}
