import { useState, useEffect, useRef } from 'react';
import { useGameContext } from '../context/GameContext';
import { searchTracks } from '../utils/fuseSearch';
import { SpotifyTrack } from '../types';

export default function SearchBar() {
  const { submitGuess, gameStatus } = useGameContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const tracks = (window as any).__SONG_GUESS_TRACKS__ as SpotifyTrack[] | undefined;
      if (tracks && value.trim()) {
        const found = searchTracks(value, tracks);
        setResults(found);
        setIsOpen(found.length > 0);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 150);
  };

  const handleSelect = (track: SpotifyTrack) => {
    submitGuess(track.id);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Escape') {
        setQuery('');
        setResults([]);
        setIsOpen(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelect(results[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setQuery('');
      setResults([]);
      setIsOpen(false);
    }
  };

  const isDisabled = gameStatus !== 'PLAYING';

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true);
        }}
        disabled={isDisabled}
        placeholder={isDisabled ? 'Trò chơi chưa bắt đầu' : 'Tìm kiếm nhạc hoặc nghệ sĩ...'}
        className={`w-full px-4 py-3 rounded-lg border ${
          isDisabled
            ? 'bg-pink-100 border-pink-200 text-pink-400 cursor-not-allowed'
            : 'bg-white border-pink-300 text-gray-800 focus:border-pink-400 focus:outline-none'
        }`}
      />

      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 w-full bottom-full mb-1 bg-white border border-pink-200 rounded-lg shadow-xl max-h-64 overflow-auto">
          {results.map((track, index) => (
            <li
              key={track.id}
              onClick={() => handleSelect(track)}
              className={`px-4 py-3 cursor-pointer flex items-center gap-3 ${
                index === activeIndex ? 'bg-pink-50' : 'hover:bg-pink-50'
              }`}
            >
              {track.album_art && (
                <img src={track.album_art} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
              )}
              <div className="min-w-0">
                <div className="text-gray-800 text-sm truncate">{track.name}</div>
                <div className="text-pink-500 text-xs truncate">{track.primary_artist}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
