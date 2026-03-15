/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [url, setUrl] = useState('https://douvid.xyz/_v1_douvid/nbz6tojjDdgAAOn1lvABlQ==/jxYI5dFD7A.m3u8');
  const [error, setError] = useState('');

  const handlePlay = () => {
    if (!videoRef.current) return;
    setError('');

    const encodedUrl = btoa(url);
    const proxyUrl = `/api/proxy?url=${encodedUrl}&type=m3u8`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        debug: false,
      });
      hls.loadSource(proxyUrl);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play().catch(e => console.error("Play prevented:", e));
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError('Network error encountered while fetching stream.');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError('Media error encountered.');
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setError('Fatal error encountered.');
              break;
          }
        }
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // For Safari
      videoRef.current.src = proxyUrl;
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current?.play().catch(e => console.error("Play prevented:", e));
      });
    } else {
      setError('HLS is not supported in this browser.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">HLS Proxy Player</h1>
          <p className="text-zinc-400">
            Bypass hotlinking restrictions and basic protections by proxying m3u8 streams.
          </p>
        </div>

        <div className="flex gap-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter m3u8 URL..."
          />
          <button
            onClick={handlePlay}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Play Stream
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl">
          <video
            ref={videoRef}
            controls
            className="w-full h-full"
            crossOrigin="anonymous"
          />
        </div>
      </div>
    </div>
  );
}
