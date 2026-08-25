import Fuse from 'fuse.js';
import { SpotifyTrack } from '../types';

function normalizeVietnamese(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

type IndexedTrack = SpotifyTrack & {
  name_normalized: string;
  primary_artist_normalized: string;
};

export function createFuse(tracks: SpotifyTrack[]): Fuse<IndexedTrack> {
  const indexedTracks: IndexedTrack[] = tracks.map(track => ({
    ...track,
    name_normalized: normalizeVietnamese(track.name),
    primary_artist_normalized: normalizeVietnamese(track.primary_artist),
  }));

  return new Fuse(indexedTracks, {
    keys: [
      { name: 'name_normalized', weight: 0.6 },
      { name: 'primary_artist_normalized', weight: 0.4 },
    ],
    threshold: 0.3,
  });
}

export function searchTracks(query: string, tracks: SpotifyTrack[]): SpotifyTrack[] {
  if (!query.trim()) return [];

  const fuse = createFuse(tracks);
  const normalizedQuery = normalizeVietnamese(query);
  const results = fuse.search(normalizedQuery, { limit: 10 });
  return results.map(result => result.item);
}
