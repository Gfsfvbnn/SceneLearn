"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface TranscriptLine {
  text: string;
  offset: number;
}

interface WordInfo {
  word: string;
  meaning: string;
  partOfSpeech: string;
  example: string;
}

function getVideoId(url: string) {
  const match = url.match(/(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

export default function WatchPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedWord, setSelectedWord] = useState<WordInfo | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const handleLoadVideo = async () => {
    const id = getVideoId(videoUrl);
    if (!id) {
      setError("Link YouTube khong hop le");
      return;
    }

    setLoading(true);
    setError("");
    setTranscript([]);
    setVideoId(id);

    try {
      const res = await fetch("/api/get-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTranscript(data.transcript || []);
    } catch (err: any) {
      setError(err.message || "Co loi xay ra");
    } finally {
      setLoading(false);
    }
  };

  const handleWordClick = async (word: string) => {
    const cleanWord = word.replace(/[.,!?;:]/g, "");
    if (!cleanWord) return;

    setLookupLoading(true);
    setSelectedWord(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const res = await fetch("/api/lookup-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: cleanWord,
          email: user?.email || null,
          sourceVideo: videoUrl,
        }),
      });

      const data = await res.json();
      setSelectedWord(data);
    } catch (err) {
      // im lang, khong lam gi
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="min-h-screen dot-grid flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-4xl">
        <Link href="/" className="text-sm mb-4 inline-block" style={{ color: "var(--color-cyan)" }}>
          Ve trang chu
        </Link>
        <h1 className="text-3xl font-bold text-center mb-2" style={{ color: "var(--color-ink)" }}>
          Xem YouTube va tra tu ngay
        </h1>
        <p className="text-center mb-8" style={{ color: "var(--color-muted)" }}>
          Dan link video YouTube co phu de tieng Anh vao day
        </p>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            className="flex-1 p-3 border border-zinc-300 rounded-lg bg-white"
            placeholder="https://www.youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          <button
            onClick={handleLoadVideo}
            disabled={loading}
            className="px-6 py-3 text-white rounded-lg font-medium disabled:opacity-50"
            style={{ backgroundColor: "#1CA7EC", color: "#FFFFFF" }}
          >
            {loading ? "Dang tai..." : "Tai video"}
          </button>
        </div>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        {videoId && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <iframe
                className="w-full aspect-video rounded-lg"
                src={`https://www.youtube.com/embed/${videoId}`}
                allowFullScreen
              />

              {selectedWord && (
                <div className="scene-frame p-4 bg-white mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold" style={{ color: "var(--color-cyan)" }}>
                      {selectedWord.word}
                    </span>
                    <span className="text-sm" style={{ color: "var(--color-muted)" }}>
                      ({selectedWord.partOfSpeech})
                    </span>
                  </div>
                  <p style={{ color: "var(--color-ink)" }}>{selectedWord.meaning}</p>
                  <p className="italic mt-1" style={{ color: "var(--color-muted)" }}>
                    {selectedWord.example}
                  </p>
                </div>
              )}
              {lookupLoading && (
                <p className="text-sm mt-2" style={{ color: "var(--color-muted)" }}>
                  Dang tra tu...
                </p>
              )}
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-4 max-h-[500px] overflow-y-auto">
              <p className="text-sm font-semibold mb-2" style={{ color: "var(--color-ink)" }}>
                Phu de (click vao tu de tra nghia):
              </p>
              {transcript.map((line, i) => (
                <p key={i} className="mb-2 leading-relaxed">
                  {line.text.split(" ").map((word, j) => (
                    <span
                      key={j}
                      onClick={() => handleWordClick(word)}
                      className="cursor-pointer hover:bg-blue-100 rounded px-0.5"
                      style={{ color: "var(--color-ink)" }}
                    >
                      {word}{" "}
                    </span>
                  ))}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}