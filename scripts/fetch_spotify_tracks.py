from spotify_scraper import SpotifyClient
import json
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

PLAYLIST_IDS = [
    "4pkof2WT0Spca1pX3j2dh4",
    "3Rso58hNRq63GTIFTiHLW7",
]

TRACKS_OUTPUT_PATH = os.path.join(
    os.path.dirname(__file__), "..", "public", "data", "tracks.json"
)
MAX_WORKERS = 10


def normalize_track(track):
    artists = getattr(track, "artists", None) or ()
    primary_artist = artists[0].name if artists else "Unknown Artist"

    album = getattr(track, "album", None) or {}
    images = getattr(album, "images", None) or ()
    album_art = ""
    if images:
        album_art = max(images, key=lambda img: img.width or 0).url

    return {
        "id": track.id,
        "name": track.name,
        "primary_artist": primary_artist,
        "preview_url": track.preview_url,
        "album_art": album_art,
        "spotify_url": f"https://open.spotify.com/track/{track.id}",
        "duration_ms": track.duration_ms or 0,
    }


def fetch_track(client, track_id):
    try:
        track = client.get_track(track_id)
        if track and track.preview_url:
            return normalize_track(track)
        return None
    except Exception as exc:
        print(f"    Failed to fetch track {track_id}: {exc}")
        return None


def main():
    client = SpotifyClient()

    seen = {}
    total_playlists = len(PLAYLIST_IDS)

    for p, playlist_id in enumerate(PLAYLIST_IDS, start=1):
        print(f"Fetching playlist {p}/{total_playlists}: {playlist_id}")
        try:
            playlist = client.get_playlist(playlist_id, max_tracks=1000)
        except Exception as exc:
            print(f"  Failed to fetch playlist {playlist_id}: {exc}")
            continue

        tracks = getattr(playlist, "tracks", None)
        if not tracks:
            print(f"  Warning: empty or inaccessible playlist {playlist_id}")
            continue
        if not isinstance(tracks, (list, tuple)):
            print(f"  Warning: unexpected response for {playlist_id}: {type(tracks)}")
            continue

        ids = []
        for item in tracks:
            track = getattr(item, "track", None)
            if track and track.id:
                ids.append(track.id)

        unique_ids = list(dict.fromkeys(ids))
        print(f"  Retrieved {len(unique_ids)} unique track IDs")
        print(f"  Fetching track details with {MAX_WORKERS} workers...")

        done = 0
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {executor.submit(fetch_track, client, tid): tid for tid in unique_ids}
            for future in as_completed(futures):
                result = future.result()
                done += 1
                if result:
                    seen[result["id"]] = result
                if done % 50 == 0 or done == len(unique_ids):
                    print(f"  Progress: {done}/{len(unique_ids)} tracks processed")

    final_tracks = list(seen.values())
    print(f"\nTotal unique tracks with preview: {len(final_tracks)}")

    os.makedirs(os.path.dirname(TRACKS_OUTPUT_PATH), exist_ok=True)
    with open(TRACKS_OUTPUT_PATH, "w", encoding="utf-8") as fh:
        json.dump(final_tracks, fh, ensure_ascii=False, indent=2)

    print(f"Written to {TRACKS_OUTPUT_PATH}")


if __name__ == "__main__":
    main()
