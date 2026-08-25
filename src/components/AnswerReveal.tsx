import { useGameContext } from '../context/GameContext';

export default function AnswerReveal() {
  const ctx = useGameContext();
  const { currentTrack, gameStatus, nextTrack } = ctx;

  if (!currentTrack || (gameStatus !== 'WON' && gameStatus !== 'LOST')) {
    return null;
  }

  const isWon = gameStatus === 'WON';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pink-900/30 p-4">
      <div className="bg-white border border-pink-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="text-center mb-4">
          <h2 className={`text-2xl font-bold ${isWon ? 'text-pink-600' : 'text-gray-600'}`}>
            {isWon ? 'Chính xác!' : 'Rất tiếc! Bài hát là:'}
          </h2>
        </div>

        <div className="flex flex-col items-center gap-4">
          {currentTrack.album_art && (
            <img
              src={currentTrack.album_art}
              alt={currentTrack.name}
              className="w-48 h-48 rounded-lg object-cover shadow-lg"
            />
          )}

          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-800">{currentTrack.name}</h3>
            <p className="text-pink-500 mt-1">{currentTrack.primary_artist}</p>
          </div>

          <a
            href={currentTrack.spotify_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.18c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            Nghe trên Spotify
          </a>

          <button
            onClick={nextTrack}
            className="mt-2 px-6 py-2 bg-pink-100 text-gray-700 rounded-lg hover:bg-pink-200 transition-colors"
          >
            Bài tiếp theo
          </button>
        </div>
      </div>
    </div>
  );
}
