'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Movie } from '@/lib/types';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Subtitles,
  Info,
  Film,
} from 'lucide-react';

interface VideoPlayerModalProps {
  movie: Movie | null;
  onClose: () => void;
}

export default function VideoPlayerModal({ movie, onClose }: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [activeCueText, setActiveCueText] = useState<string>('');
  const [videoError, setVideoError] = useState<string | null>(null);

  // Controls auto-hide timer
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!movie) return;

    // Reset state on open
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setVideoError(null);
    setActiveCueText('');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [movie]);

  if (!movie) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch((e) => {
        console.error('Play error:', e);
      });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (!duration && videoRef.current.duration) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});

      // Setup text tracks for subtitles
      if (videoRef.current.textTracks && videoRef.current.textTracks.length > 0) {
        const track = videoRef.current.textTracks[0];
        track.mode = subtitlesEnabled ? 'showing' : 'hidden';

        track.oncuechange = () => {
          if (track.activeCues && track.activeCues.length > 0) {
            const cue = track.activeCues[0] as VTTCue;
            setActiveCueText(cue?.text || '');
          } else {
            setActiveCueText('');
          }
        };
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
  };

  const toggleSubtitles = () => {
    const newState = !subtitlesEnabled;
    setSubtitlesEnabled(newState);
    if (videoRef.current && videoRef.current.textTracks.length > 0) {
      videoRef.current.textTracks[0].mode = newState ? 'showing' : 'hidden';
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
    }
  };

  const cycleSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const nextIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextRate = speeds[nextIndex];
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 lg:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="relative w-full max-w-5xl bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-red-900/40 flex flex-col my-auto"
      >
        {/* Top Header Bar */}
        <div
          className={`absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-md bg-red-600 text-white text-xs font-black uppercase tracking-wider">
              .{movie.video_format || 'MP4'}
            </span>
            <h2 className="text-white font-bold text-base sm:text-lg line-clamp-1 drop-shadow-md">
              {movie.title}
            </h2>
            {movie.subtitle_url && (
              <span className="hidden sm:inline-flex items-center gap-1 bg-red-950/80 text-red-300 border border-red-500/40 text-[11px] font-semibold px-2 py-0.5 rounded">
                <Subtitles className="w-3 h-3 text-red-400" />
                {movie.subtitle_label || 'Subtitles Active'}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors border border-white/20"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Container */}
        <div
          onClick={togglePlay}
          className="relative aspect-video w-full bg-black flex items-center justify-center cursor-pointer select-none"
        >
          {videoError ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-white">
              <Film className="w-12 h-12 text-red-500 mb-3" />
              <p className="text-base font-semibold text-red-400">Stream Playback Notice</p>
              <p className="text-xs text-slate-400 max-w-md mt-1">{videoError}</p>
              <a
                href={movie.video_url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
              >
                Open Direct Stream URL
              </a>
            </div>
          ) : (
            <video
              ref={videoRef}
              src={movie.video_url}
              crossOrigin="anonymous"
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              onError={() => {
                setVideoError(
                  `Could not play format .${movie.video_format} natively in this browser codec container. You can open or stream it directly via ImageKit or local link.`
                );
              }}
              className="w-full h-full object-contain"
            >
              {movie.subtitle_url && (
                <track
                  kind="subtitles"
                  src={movie.subtitle_url}
                  srcLang="en"
                  label={movie.subtitle_label || 'English'}
                  default={subtitlesEnabled}
                />
              )}
            </video>
          )}

          {/* Subtitle Cue Overlay (guarantees visible subtitles across all video formats) */}
          {subtitlesEnabled && activeCueText && (
            <div className="absolute bottom-16 left-4 right-4 text-center pointer-events-none z-20">
              <span className="inline-block bg-black/85 text-white font-sans text-sm sm:text-base md:text-lg font-medium px-4 py-1.5 rounded-md shadow-lg border border-white/10">
                {activeCueText}
              </span>
            </div>
          )}

          {/* Center Play/Pause Indicator when paused */}
          {!isPlaying && !videoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/50">
                <Play className="w-8 h-8 fill-white ml-1" />
              </div>
            </div>
          )}
        </div>

        {/* Video Control Bar */}
        <div
          className={`p-3 sm:p-4 bg-gradient-to-t from-black via-slate-950 to-slate-950 border-t border-slate-800 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress / Seek bar */}
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[11px] font-mono text-slate-300 min-w-[42px] text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-600 hover:accent-red-500"
            />
            <span className="text-[11px] font-mono text-slate-300 min-w-[42px]">
              {formatTime(duration)}
            </span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between text-white flex-wrap gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors shadow-sm"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                )}
              </button>

              {/* Rewind 10s */}
              <button
                onClick={() => skipTime(-10)}
                className="text-slate-400 hover:text-white transition-colors"
                title="Rewind 10s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Forward 10s */}
              <button
                onClick={() => skipTime(10)}
                className="text-slate-400 hover:text-white transition-colors"
                title="Forward 10s"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1.5 ml-1">
                <button
                  onClick={toggleMute}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-500" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-red-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Subtitles Toggle */}
              {movie.subtitle_url && (
                <button
                  onClick={toggleSubtitles}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-bold transition-all border ${
                    subtitlesEnabled
                      ? 'bg-red-600 text-white border-red-500 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title="Toggle Subtitles"
                >
                  <Subtitles className="w-3.5 h-3.5" />
                  <span>CC {subtitlesEnabled ? 'ON' : 'OFF'}</span>
                </button>
              )}

              {/* Speed rate */}
              <button
                onClick={cycleSpeed}
                className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 transition-colors"
                title="Playback Speed"
              >
                {playbackRate}x
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="text-slate-400 hover:text-white transition-colors"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Movie Info Details Footer */}
        <div className="p-4 sm:p-5 bg-white text-slate-900 border-t border-red-100 flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900">{movie.title}</h3>
              <span className="px-2 py-0.5 rounded text-xs font-black uppercase bg-red-100 text-red-700 border border-red-200">
                .{movie.video_format}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              {movie.genre && <span className="text-red-600 font-bold">{movie.genre}</span>}
              {movie.release_year && <span>• {movie.release_year}</span>}
              {movie.duration && <span>• {movie.duration}</span>}
              {movie.rating && (
                <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-bold text-slate-700">
                  {movie.rating}
                </span>
              )}
            </div>
          </div>
          {movie.description && (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
              {movie.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

