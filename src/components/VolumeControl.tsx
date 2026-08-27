import { useState } from 'react';
import { useGameContext } from '../context/GameContext';

export default function VolumeControl() {
  const { volume, setVolume } = useGameContext();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setOpen(v => !v)}
        className="text-pink-600 hover:text-pink-700 leading-none p-0.5"
        aria-label={volume === 0 ? 'Bật âm thanh' : 'Tắt âm thanh'}
      >
        {volume === 0 ? (
          <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          open ? 'max-w-[100px] sm:max-w-[120px] opacity-100' : 'max-w-0 opacity-0'
        }`}
      >
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="volume-slider w-full h-1.5 sm:h-2 cursor-pointer"
        />
      </div>
    </div>
  );
}
