'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { Movie } from '@/lib/types';
import VideoPlayerModal from '@/components/VideoPlayerModal';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '@/lib/supabase';
import {
  Upload,
  Trash2,
  Play,
  Subtitles,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  ArrowUpRight,
  RefreshCw,
  PlusCircle,
  FileVideo,
} from 'lucide-react';

export default function AdminPage() {
  const { user, isAdmin, isLoading, refreshSession } = useAuth();

  // Movie upload form state - purely dynamic
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [duration, setDuration] = useState('');
  const [releaseYear, setReleaseYear] = useState(new Date().getFullYear());
  const [rating, setRating] = useState('PG-13');

  // Video file or URL
  const [videoMode, setVideoMode] = useState<'file' | 'url'>('file');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFormat, setVideoFormat] = useState('mp4');

  // Thumbnail file or URL
  const [thumbMode, setThumbMode] = useState<'file' | 'url'>('file');
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbUrl, setThumbUrl] = useState('');

  // Subtitle file or URL
  const [subtitleMode, setSubtitleMode] = useState<'file' | 'url'>('file');
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [subtitleUrl, setSubtitleUrl] = useState('');
  const [subtitleLabel, setSubtitleLabel] = useState('English');

  // Operation states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Movie list state
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [previewMovie, setPreviewMovie] = useState<Movie | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Direct login state for admin gate
  const [gateEmail, setGateEmail] = useState('');
  const [gatePassword, setGatePassword] = useState('');
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);

  const fetchMovies = async () => {
    try {
      setLoadingMovies(true);
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
      setLoadingMovies(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleAdminGateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateLoading(true);
    setGateError(null);

    try {
      if (
        gateEmail.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
        gatePassword === ADMIN_PASSWORD
      ) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('cherry_admin_session', 'true');
        }
        await refreshSession();
        return;
      }
      setGateError('Incorrect admin credentials.');
    } catch (err: any) {
      setGateError(err.message || 'Login failed');
    } finally {
      setGateLoading(false);
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
      setVideoFormat(ext);
    }
  };

  const handleThumbFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbFile(e.target.files[0]);
    }
  };

  const handleSubtitleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSubtitleFile(e.target.files[0]);
    }
  };

  const uploadFileToServer = async (
    file: File,
    type: 'video' | 'image' | 'subtitle'
  ): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        return data.url;
      }
      throw new Error(data.error || 'FormData parse failed');
    } catch (err: any) {
      // Fallback: direct streaming upload
      const rawRes = await fetch(
        `/api/upload?type=${type}&filename=${encodeURIComponent(file.name)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: file,
        }
      );

      const rawData = await rawRes.json();
      if (!rawData.success || !rawData.url) {
        throw new Error(rawData.error || `Failed to upload ${type}`);
      }
      return rawData.url;
    }
  };

  const handlePublishMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setUploading(true);
    setUploadProgress('Uploading...');

    try {
      let finalVideoUrl = videoUrl;
      let finalThumbUrl = thumbUrl;
      let finalSubtitleUrl = subtitleUrl;

      // 1. Upload Video if file mode
      if (videoMode === 'file') {
        if (!videoFile) {
          throw new Error('Please select a video file (.mkv, .mp4, .avi, .avif)');
        }
        setUploadProgress(`Uploading ${videoFormat.toUpperCase()} video...`);
        finalVideoUrl = await uploadFileToServer(videoFile, 'video');
      } else if (!videoUrl) {
        throw new Error('Please provide a video URL');
      }

      // 2. Upload Thumbnail if file mode
      if (thumbMode === 'file') {
        if (!thumbFile) {
          throw new Error('Please select a thumbnail image');
        }
        setUploadProgress('Uploading thumbnail...');
        finalThumbUrl = await uploadFileToServer(thumbFile, 'image');
      } else if (!thumbUrl) {
        throw new Error('Please provide a thumbnail URL');
      }

      // 3. Upload Subtitles if file mode
      if (subtitleMode === 'file' && subtitleFile) {
        setUploadProgress('Processing subtitles...');
        finalSubtitleUrl = await uploadFileToServer(subtitleFile, 'subtitle');
      }

      // 4. Save Movie to Database
      setUploadProgress('Saving...');
      const moviePayload = {
        title: title.trim(),
        description: description.trim(),
        video_url: finalVideoUrl,
        video_format: videoFormat.toLowerCase().replace('.', ''),
        thumbnail_url: finalThumbUrl,
        subtitle_url: finalSubtitleUrl || undefined,
        subtitle_label: subtitleLabel || 'English',
        genre: genre.trim(),
        duration: duration.trim(),
        release_year: Number(releaseYear),
        rating,
      };

      const res = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moviePayload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save movie');
      }

      setStatusMessage({
        type: 'success',
        text: `Uploaded "${title}" successfully.`,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setGenre('');
      setDuration('');
      setVideoFile(null);
      setThumbFile(null);
      setSubtitleFile(null);
      setVideoUrl('');
      setThumbUrl('');
      setSubtitleUrl('');

      // Refresh list
      await fetchMovies();
    } catch (err: any) {
      console.error('Publish error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Upload failed',
      });
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleDeleteMovie = async (id: string, movieTitle: string) => {
    if (!confirm(`Delete "${movieTitle}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`/api/movies?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        setMovies((prev) => prev.filter((m) => m.id !== id));
        setStatusMessage({
          type: 'success',
          text: `Deleted "${movieTitle}".`,
        });
      } else {
        throw new Error(data.error || 'Failed to delete movie');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(`Delete error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // If not admin, show Admin Gate
  if (!isAdmin && !isLoading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 bg-slate-50">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-red-200 shadow-xl shadow-red-500/10 text-center">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Admin Portal</h1>

          {gateError && (
            <div className="my-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{gateError}</span>
            </div>
          )}

          <form onSubmit={handleAdminGateLogin} className="space-y-4 text-left mt-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={gateEmail}
                onChange={(e) => setGateEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={gatePassword}
                onChange={(e) => setGatePassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500"
              />
            </div>
            <button
              type="submit"
              disabled={gateLoading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2"
            >
              {gateLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Enter Admin Portal</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link href="/" className="text-xs text-slate-500 hover:text-red-600">
              ← Return to Movies
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Admin Banner */}
      <div className="bg-white border-b border-red-100 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Admin Portal
              </h1>
              <p className="text-xs text-slate-500">
                {user?.email || 'Admin'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-red-600">{movies.length}</span> Uploaded
            </div>
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl border border-red-200 transition-colors"
            >
              <span>Landing Page</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`mb-6 p-4 rounded-2xl border flex items-start gap-3 shadow-sm ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs font-semibold">{statusMessage.text}</div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-xs font-bold opacity-60 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Upload Movie Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-red-100 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Upload Movie</h2>
              </div>
            </div>

            <form onSubmit={handlePublishMovie} className="space-y-5">
              {/* Title & Genre */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Genre
                  </label>
                  <input
                    type="text"
                    placeholder="Genre"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-900"
                />
              </div>

              {/* Year, Duration, Rating */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Year
                  </label>
                  <input
                    type="number"
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Duration"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Rating
                  </label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-900"
                  >
                    <option value="G">G</option>
                    <option value="PG">PG</option>
                    <option value="PG-13">PG-13</option>
                    <option value="R">R</option>
                    <option value="NC-17">NC-17</option>
                  </select>
                </div>
              </div>

              {/* 1. Video Source */}
              <div className="p-4 bg-red-50/40 rounded-2xl border border-red-100">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <FileVideo className="w-4 h-4 text-red-600" />
                    <span>Video (.mkv, .mp4, .avi, .avif, .webm) *</span>
                  </label>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setVideoMode('file')}
                      className={`px-2 py-0.5 rounded ${
                        videoMode === 'file' ? 'bg-red-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      File
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoMode('url')}
                      className={`px-2 py-0.5 rounded ${
                        videoMode === 'url' ? 'bg-red-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      URL
                    </button>
                  </div>
                </div>

                {videoMode === 'file' ? (
                  <div>
                    <input
                      type="file"
                      accept=".mkv,.mp4,.avi,.avif,.webm,.mov"
                      onChange={handleVideoFileChange}
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer"
                    />
                    {videoFile && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                        <span className="font-bold text-red-600 uppercase">.{videoFormat}</span>
                        <span>• {(videoFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                        <span className="truncate max-w-[200px] text-slate-400">({videoFile.name})</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={videoUrl}
                      onChange={(e) => {
                        setVideoUrl(e.target.value);
                        const detected = e.target.value.split('.').pop()?.split('?')[0]?.toLowerCase();
                        if (detected && ['mkv', 'mp4', 'avi', 'avif', 'webm', 'mov'].includes(detected)) {
                          setVideoFormat(detected);
                        }
                      }}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-900"
                    />
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 font-medium">Format:</span>
                      <select
                        value={videoFormat}
                        onChange={(e) => setVideoFormat(e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold uppercase text-red-600"
                      >
                        <option value="mkv">.MKV</option>
                        <option value="mp4">.MP4</option>
                        <option value="avi">.AVI</option>
                        <option value="avif">.AVIF</option>
                        <option value="webm">.WEBM</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Thumbnail Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <ImageIcon className="w-4 h-4 text-red-600" />
                    <span>Thumbnail *</span>
                  </label>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setThumbMode('file')}
                      className={`px-2 py-0.5 rounded ${
                        thumbMode === 'file' ? 'bg-red-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      File
                    </button>
                    <button
                      type="button"
                      onClick={() => setThumbMode('url')}
                      className={`px-2 py-0.5 rounded ${
                        thumbMode === 'url' ? 'bg-red-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      URL
                    </button>
                  </div>
                </div>

                {thumbMode === 'file' ? (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbFileChange}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-white hover:file:bg-black cursor-pointer"
                  />
                ) : (
                  <input
                    type="url"
                    placeholder="https://..."
                    value={thumbUrl}
                    onChange={(e) => setThumbUrl(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-900"
                  />
                )}
              </div>

              {/* 3. Subtitles Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <Subtitles className="w-4 h-4 text-red-600" />
                    <span>Subtitles (.vtt or .srt)</span>
                  </label>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setSubtitleMode('file')}
                      className={`px-2 py-0.5 rounded ${
                        subtitleMode === 'file' ? 'bg-red-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      File
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubtitleMode('url')}
                      className={`px-2 py-0.5 rounded ${
                        subtitleMode === 'url' ? 'bg-red-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      URL
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    {subtitleMode === 'file' ? (
                      <input
                        type="file"
                        accept=".vtt,.srt"
                        onChange={handleSubtitleFileChange}
                        className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-white hover:file:bg-black cursor-pointer"
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder="Subtitle URL"
                        value={subtitleUrl}
                        onChange={(e) => setSubtitleUrl(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-900"
                      />
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Language"
                      value={subtitleLabel}
                      onChange={(e) => setSubtitleLabel(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Progress */}
              {uploading && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 flex items-center gap-3">
                  <span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span className="text-xs font-bold text-red-800">{uploadProgress}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <span>Uploading...</span>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload Movie</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Uploaded Movies List */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-white rounded-3xl p-6 border border-red-100 shadow-sm flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-red-600" />
                  <h2 className="text-base font-bold text-slate-900">Uploaded Movies</h2>
                </div>
                <button
                  onClick={fetchMovies}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingMovies ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingMovies ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : movies.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No movies uploaded yet.
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[700px] pr-1">
                  {movies.map((movie) => (
                    <div
                      key={movie.id}
                      className="p-3 bg-slate-50 hover:bg-red-50/30 rounded-2xl border border-slate-200/80 hover:border-red-200 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={movie.thumbnail_url}
                          alt={movie.title}
                          className="w-14 h-14 rounded-xl object-cover bg-slate-900 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-red-600 text-white">
                              .{movie.video_format}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {movie.title}
                            </h4>
                          </div>
                          {(movie.genre || movie.release_year) && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {[movie.genre, movie.release_year].filter(Boolean).join(' • ')}
                            </p>
                          )}
                          {movie.subtitle_url && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 mt-0.5">
                              <Subtitles className="w-3 h-3" />
                              <span>{movie.subtitle_label || 'CC'}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => setPreviewMovie(movie)}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:border-red-500 hover:bg-red-50 text-slate-600 hover:text-red-600 flex items-center justify-center transition-colors shadow-xs"
                          title="Play"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          onClick={() => handleDeleteMovie(movie.id, movie.title)}
                          disabled={deletingId === movie.id}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:border-red-500 hover:bg-red-600 text-slate-400 hover:text-white flex items-center justify-center transition-colors shadow-xs"
                          title="Delete"
                        >
                          {deletingId === movie.id ? (
                            <span className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Preview Modal */}
      <VideoPlayerModal
        movie={previewMovie}
        onClose={() => setPreviewMovie(null)}
      />
    </div>
  );
}
