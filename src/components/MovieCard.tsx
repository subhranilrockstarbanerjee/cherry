'use client';

import React from 'react';
import { Movie } from '@/lib/types';
import { Play, Subtitles } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onWatch: (movie: Movie) => void;
}

export default function MovieCard({ movie, onWatch }: MovieCardProps) {
  const formatBadgeColors: Record<string, string> = {
    mkv: 'bg-red-600 text-white',
    mp4: 'bg-red-600 text-white',
    avi: 'bg-red-700 text-white',
    avif: 'bg-red-800 text-white',
    webm: 'bg-red-600 text-white',
    mov: 'bg-red-600 text-white',
  };

  const badgeClass =
    formatBadgeColors[movie.video_format?.toLowerCase()] || 'bg-red-600 text-white';

  return (
    <div
      onClick={() => onWatch(movie)}
      className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200/90 hover:border-red-500 shadow-sm hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 flex flex-col cursor-pointer transform hover:-translate-y-1.5"
    >
      {/* Top Poster Image */}
      <div className="relative aspect-[16/10] w-full bg-slate-900 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={movie.thumbnail_url}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Video Format Badge */}
        {movie.video_format && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            <span
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider shadow-sm ${badgeClass}`}
            >
              .{movie.video_format}
            </span>
            {movie.rating && (
              <span className="bg-black/70 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/20">
                {movie.rating}
              </span>
            )}
          </div>
        )}

        {/* Subtitle Badge */}
        {movie.subtitle_url && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-950/80 backdrop-blur-md text-red-200 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-red-500/30 shadow-sm z-10">
            <Subtitles className="w-3.5 h-3.5 text-red-400" />
            <span>{movie.subtitle_label || 'CC'}</span>
          </div>
        )}
      </div>

      {/* Red Circular Icon Badge Overlapping Image & Body (matching reference image) */}
      <div className="relative -mt-6 flex justify-center z-20">
        <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30 ring-4 ring-white group-hover:scale-110 group-hover:bg-red-700 transition-all duration-300">
          <Play className="w-5 h-5 fill-white text-white ml-0.5" />
        </div>
      </div>

      {/* Card Content (matching reference layout with red chevron bullet points) */}
      <div className="p-5 pt-2 flex-1 flex flex-col justify-between bg-white text-center">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-900 group-hover:text-red-600 transition-colors line-clamp-1 mt-1">
            {movie.title}
          </h3>

          {/* Dynamic details as red bullet list */}
          <div className="mt-4 space-y-2 text-left text-xs border-t border-slate-100 pt-3">
            {movie.video_format && (
              <div className="flex items-center gap-2">
                <span className="text-red-600 font-black text-sm leading-none">&gt;</span>
                <span className="font-semibold text-slate-700">Format:</span>
                <span className="font-bold text-red-600 uppercase">.{movie.video_format}</span>
              </div>
            )}

            {movie.subtitle_url && (
              <div className="flex items-center gap-2">
                <span className="text-red-600 font-black text-sm leading-none">&gt;</span>
                <span className="font-semibold text-slate-700">Subtitles:</span>
                <span className="text-slate-600 truncate">{movie.subtitle_label || 'Embedded / CC'}</span>
              </div>
            )}

            {movie.genre && (
              <div className="flex items-center gap-2">
                <span className="text-red-600 font-black text-sm leading-none">&gt;</span>
                <span className="font-semibold text-slate-700">Genre:</span>
                <span className="text-slate-600 truncate">{movie.genre}</span>
              </div>
            )}

            {movie.duration && (
              <div className="flex items-center gap-2">
                <span className="text-red-600 font-black text-sm leading-none">&gt;</span>
                <span className="font-semibold text-slate-700">Duration:</span>
                <span className="text-slate-600">{movie.duration}</span>
              </div>
            )}

            {movie.release_year && (
              <div className="flex items-center gap-2">
                <span className="text-red-600 font-black text-sm leading-none">&gt;</span>
                <span className="font-semibold text-slate-700">Year:</span>
                <span className="text-slate-600">{movie.release_year}</span>
              </div>
            )}

            {movie.description && (
              <div className="flex items-start gap-2 pt-1">
                <span className="text-red-600 font-black text-sm leading-none mt-0.5">&gt;</span>
                <p className="text-slate-500 line-clamp-2 text-[11px] leading-relaxed">
                  {movie.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Watch Now Button */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-center">
          <button
            type="button"
            className="w-full py-2 px-3 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Watch Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
