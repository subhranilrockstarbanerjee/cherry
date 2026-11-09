'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
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
  Film,
  Tv,
  Gamepad2,
  ExternalLink,
  RotateCcw as RefreshIcon,
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

  // Xbox & Console Mode Support
  const [isXbox, setIsXbox] = useState(false);
  const [useNativeControls, setUseNativeControls] = useState(false);

  // Controls auto-hide timer
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Detect Xbox Edge environment
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      const detectedXbox =
        /Xbox/i.test(ua) || (navigator as any).userAgentData?.platform === 'Xbox';

      if (detectedXbox) {
        setIsXbox(true);
        // Default to native controls on Xbox so console controllers and remotes work automatically
        setUseNativeControls(true);
      }
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          console.warn('Play was prevented or delayed:', e);
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const skipTime = useCallback((seconds: number) => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 100;
      videoRef.current.currentTime = Math.max(0, Math.min(cur + seconds, dur));
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const adjustVolume = useCallback((delta: number) => {
    if (videoRef.current) {
      const newVol = Math.max(0, Math.min(1, videoRef.current.volume + delta));
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
      setVolume(newVol);
      setIsMuted(newVol === 0);
    }
  }, []);

  const toggleSubtitles = useCallback(() => {
    setSubtitlesEnabled((prev) => {
      const newState = !prev;
      if (videoRef.current && videoRef.current.textTracks.length > 0) {
        videoRef.current.textTracks[0].mode = newState ? 'showing' : 'hidden';
      }
      return newState;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Keyboard & Xbox Controller Key Mapping
  useEffect(() => {
    if (!movie) return;

    // Reset player state
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setVideoError(null);
    setActiveCueText('');

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
        case 'Back':
          onClose();
          break;
        case ' ':
        case 'Enter':
        case 'k':
        case 'MediaPlayPause':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
        case 'MediaTrackPrevious':
          e.preventDefault();
          skipTime(-10);
          break;
        case 'ArrowRight':
        case 'MediaTrackNext':
          e.preventDefault();
          skipTime(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case 'm':
        case 'M':
          if (videoRef.current) {
            const next = !videoRef.current.muted;
            videoRef.current.muted = next;
            setIsMuted(next);
          }
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'c':
        case 'C':
          toggleSubtitles();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Xbox Controller Gamepad API Polling
    let animId: number;
    let lastPressTime = 0;

    const pollGamepad = () => {
      if (typeof navigator !== 'undefined' && navigator.getGamepads) {
        const gamepads = navigator.getGamepads();
        const gp = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];

        if (gp && gp.buttons) {
          const now = Date.now();
          if (now - lastPressTime > 280) {
            // Button A (0): Play / Pause
            if (gp.buttons[0]?.pressed) {
              lastPressTime = now;
              togglePlay();
            }
            // Button B (1): Close
            else if (gp.buttons[1]?.pressed) {
              lastPressTime = now;
              onClose();
            }
            // Button X (2): Subtitles
            else if (gp.buttons[2]?.pressed) {
              lastPressTime = now;
              toggleSubtitles();
            }
            // Button Y (3): Fullscreen
            else if (gp.buttons[3]?.pressed) {
              lastPressTime = now;
              toggleFullscreen();
            }
            // D-pad Left (14) or LB (4): Skip backward
            else if (gp.buttons[14]?.pressed || gp.buttons[4]?.pressed) {
              lastPressTime = now;
              skipTime(-10);
            }
            // D-pad Right (15) or RB (5): Skip forward
            else if (gp.buttons[15]?.pressed || gp.buttons[5]?.pressed) {
              lastPressTime = now;
              skipTime(10);
            }
            // D-pad Up (12): Volume Up
            else if (gp.buttons[12]?.pressed) {
              lastPressTime = now;
              adjustVolume(0.1);
            }
            // D-pad Down (13): Volume Down
            else if (gp.buttons[13]?.pressed) {
              lastPressTime = now;
              adjustVolume(-0.1);
            }
          }
        }
      }
      animId = requestAnimationFrame(pollGamepad);
    };

    animId = requestAnimationFrame(pollGamepad);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animId);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [movie, onClose, togglePlay, skipTime, adjustVolume, toggleFullscreen, toggleSubtitles]);

  if (!movie) return null;

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

      // Attempt initial play
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {
        // Autoplay may be blocked on Xbox Edge until user presses A / Play
        setIsPlaying(false);
      });

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
      if (isPlaying && !useNativeControls) {
        setShowControls(false);
      }
    }, 3500);
  };

  const getMimeType = (format?: string) => {
    const f = format?.toLowerCase().replace('.', '') || 'mp4';
    switch (f) {
      case 'mp4':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      case 'mkv':
        return 'video/x-matroska';
      case 'avi':
        return 'video/x-msvideo';
      case 'mov':
        return 'video/quicktime';
      case 'avif':
        return 'video/avif';
      default:
        return 'video/mp4';
    }
  };

  const retryPlayback = () => {
    setVideoError(null);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
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
            showControls || useNativeControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-red-600 text-white text-xs font-black uppercase tracking-wider">
              .{movie.video_format || 'MP4'}
            </span>
            <h2 className="text-white font-bold text-sm sm:text-base line-clamp-1 drop-shadow-md">
              {movie.title}
            </h2>
            {isXbox && (
              <span className="inline-flex items-center gap-1 bg-green-950 text-green-300 border border-green-500/40 text-[10px] font-bold px-2 py-0.5 rounded">
                <Gamepad2 className="w-3 h-3 text-green-400" />
                <span>Xbox Optimized</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Xbox / Native Controls vs Custom Player */}
            <button
              onClick={() => setUseNativeControls((prev) => !prev)}
              className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-white/20 transition-all flex items-center gap-1.5"
              title="Toggle Native / Custom Controls"
            >
              <Tv className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">
                {useNativeControls ? 'Custom Controls' : 'Xbox Native Player'}
              </span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors border border-white/20"
              title="Close (B on Xbox / Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center select-none">
          {videoError ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-white max-w-md">
              <Film className="w-12 h-12 text-red-500 mb-3" />
              <p className="text-base font-bold text-red-400">Video Playback Notice</p>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{videoError}</p>
              <p className="text-[11px] text-slate-400 mt-2">
                Xbox Edge uses the system Media Foundation engine. If your file is encoded with an unsupported codec, you can stream it directly or switch to native mode.
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={retryPlayback}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-600"
                >
                  <RefreshIcon className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>

                <button
                  onClick={() => {
                    setVideoError(null);
                    setUseNativeControls(true);
                  }}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-500/25"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Use Xbox Native Player</span>
                </button>

                <a
                  href={movie.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-slate-900 hover:bg-black text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Direct Stream</span>
                </a>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                key={movie.id}
                controls={useNativeControls}
                preload="auto"
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onError={(e) => {
                  const mediaError = (e.currentTarget as HTMLVideoElement).error;
                  // If aborted by user/browser seek, ignore
                  if (mediaError && mediaError.code === 1) {
                    return;
                  }
                  setVideoError(
                    `Could not decode .${movie.video_format} file. Xbox Edge requires standard H.264/AVC or VP9 codecs with AAC audio.`
                  );
                }}
                className="w-full h-full object-contain"
              >
                {/* Fallback sources with explicit MIME types */}
                <source src={movie.video_url} type={getMimeType(movie.video_format)} />
                <source src={movie.video_url} type="video/mp4" />
                <source src={movie.video_url} />

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

              {/* Focusable Interactive Center Play Button when paused & not using native controls */}
              {!isPlaying && !videoError && !useNativeControls && (
                <button
                  type="button"
                  tabIndex={0}
                  onClick={togglePlay}
                  aria-label="Play Video (Press A on Xbox)"
                  className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl shadow-red-600/60 ring-4 ring-white/20 hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-red-400 z-10"
                >
                  <Play className="w-8 h-8 fill-white ml-1" />
                </button>
              )}
            </>
          )}

          {/* Subtitle Cue Overlay (guarantees visible subtitles across all video formats) */}
          {subtitlesEnabled && activeCueText && !videoError && !useNativeControls && (
            <div className="absolute bottom-16 left-4 right-4 text-center pointer-events-none z-20">
              <span className="inline-block bg-black/85 text-white font-sans text-sm sm:text-base md:text-lg font-medium px-4 py-1.5 rounded-md shadow-lg border border-white/10">
                {activeCueText}
              </span>
            </div>
          )}
        </div>

        {/* Video Control Bar (only when custom controls are active) */}
        {!useNativeControls && (
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
                  type="button"
                  tabIndex={0}
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors shadow-sm focus:ring-2 focus:ring-white"
                  title="Play / Pause (A on Xbox or Space)"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  )}
                </button>

                {/* Rewind 10s */}
                <button
                  type="button"
                  tabIndex={0}
                  onClick={() => skipTime(-10)}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Rewind 10s (D-pad Left or LB)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Forward 10s */}
                <button
                  type="button"
                  tabIndex={0}
                  onClick={() => skipTime(10)}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Forward 10s (D-pad Right or RB)"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                {/* Volume */}
                <div className="flex items-center gap-1.5 ml-1">
                  <button
                    type="button"
                    tabIndex={0}
                    onClick={toggleMute}
                    className="text-slate-400 hover:text-white transition-colors"
                    title="Mute / Unmute"
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
                    type="button"
                    tabIndex={0}
                    onClick={toggleSubtitles}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-bold transition-all border ${
                      subtitlesEnabled
                        ? 'bg-red-600 text-white border-red-500 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                    title="Toggle Subtitles (X on Xbox)"
                  >
                    <Subtitles className="w-3.5 h-3.5" />
                    <span>CC {subtitlesEnabled ? 'ON' : 'OFF'}</span>
                  </button>
                )}

                {/* Speed rate */}
                <button
                  type="button"
                  tabIndex={0}
                  onClick={cycleSpeed}
                  className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 transition-colors"
                  title="Playback Speed"
                >
                  {playbackRate}x
                </button>

                {/* Fullscreen */}
                <button
                  type="button"
                  tabIndex={0}
                  onClick={toggleFullscreen}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Toggle Fullscreen (Y on Xbox)"
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

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

          {/* Helpful Xbox Controller Guide Tip */}
          {isXbox && (
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-4 text-[11px] text-slate-500 font-medium">
              <span>🎮 <strong>A:</strong> Play/Pause</span>
              <span>🎮 <strong>B:</strong> Close</span>
              <span>🎮 <strong>X:</strong> Subtitles</span>
              <span>🎮 <strong>Y:</strong> Fullscreen</span>
              <span>🎮 <strong>D-Pad:</strong> Seek & Volume</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
