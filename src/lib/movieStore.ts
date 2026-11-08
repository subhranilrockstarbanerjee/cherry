import fs from 'fs';
import path from 'path';
import { Movie } from './types';
import { supabase } from './supabase';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'movies.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export async function getMovies(): Promise<Movie[]> {
  try {
    // 1. Try querying Supabase movies table
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data as Movie[];
    }
  } catch (err) {
    // fallback to file
  }

  // 2. Read from persistent JSON file
  try {
    ensureDataFile();
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    const movies = JSON.parse(content) as Movie[];
    return Array.isArray(movies) ? movies : [];
  } catch (err) {
    return [];
  }
}

export async function addMovie(movie: Movie): Promise<Movie> {
  // 1. Try inserting to Supabase
  try {
    const { data, error } = await supabase.from('movies').insert([movie]).select().single();
    if (!error && data) {
      ensureDataFile();
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const movies = JSON.parse(content) as Movie[];
      movies.unshift(data as Movie);
      fs.writeFileSync(DATA_FILE, JSON.stringify(movies, null, 2), 'utf-8');
      return data as Movie;
    }
  } catch (err) {
    // continue to local
  }

  // 2. Save to local storage
  ensureDataFile();
  const content = fs.readFileSync(DATA_FILE, 'utf-8');
  const movies = JSON.parse(content) as Movie[];
  movies.unshift(movie);
  fs.writeFileSync(DATA_FILE, JSON.stringify(movies, null, 2), 'utf-8');
  return movie;
}

export async function deleteMovie(id: string): Promise<boolean> {
  // 1. Try deleting from Supabase
  try {
    await supabase.from('movies').delete().eq('id', id);
  } catch (err) {
    // continue to local
  }

  // 2. Delete from local storage
  ensureDataFile();
  const content = fs.readFileSync(DATA_FILE, 'utf-8');
  let movies = JSON.parse(content) as Movie[];
  const initialLength = movies.length;
  movies = movies.filter((m) => m.id !== id);
  fs.writeFileSync(DATA_FILE, JSON.stringify(movies, null, 2), 'utf-8');
  return movies.length < initialLength;
}
