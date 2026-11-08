# Cherry Movies

A streaming web application built with **Next.js 14**, **Supabase**, and **ImageKit**, supporting multi-format video playback (`.mkv`, `.mp4`, `.avi`, `.avif`) with subtitles and dynamic content rendering.

---

## Features

- **Multi-Format Video Playback**: Supports streaming `.mkv`, `.mp4`, `.avi`, `.avif`, `.webm`, and `.mov`.
- **Subtitles Engine**: Full support for `.vtt` and `.srt` subtitle files with automatic WebVTT conversion.
- **Dynamic Content**: Every page dynamically reflects uploaded movies from the database.
- **Public Streaming**: Users can browse and stream movies without logging in.
- **Admin Portal**: Admin upload studio to publish new movies in any format with subtitles and manage/delete uploaded titles.
- **Authentication**: Supabase Auth integration with Login (`/login`) and Registration (`/register`).
- **CDN & Media Delivery**: Integrated with ImageKit (`https://ik.imagekit.io/j3mihntzd/`).

---

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, TypeScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (White & Red theme)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Media CDN**: [ImageKit](https://imagekit.io/)
- **Streaming Parser**: Busboy multipart streaming parser (supports up to 2GB uploads)
- **Icons**: Lucide React

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## Admin Credentials

- **Email**: `admin@dramabox.stream`
- **Password**: `Admin@DramaBox2026!`

