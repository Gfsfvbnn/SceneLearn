"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

export default function LearnDetailPage() {
  const params = useParams();
  const [title, setTitle] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [selectedWord, setSelectedWord] = useState<WordInfo | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [wordSaved, setWordSaved] = useState(false);

  useEffect(() => {
    supabase
      .from("curated_videos")
      .select("*")
      .eq("id", params.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setTitle(data.title);
          setYoutubeId(data.youtube_id);
          setTranscript(data.transcript || []);
        }
      });
  }, [params.id]);

  const handleWordClick = async (word: string) => {
    const cleanWord = word.replace(/[.,!?;:]/g, "");
    if (!cleanWord) return;

    setLookupLoading(true);
    setSelectedWord(null);
    setWordSaved(false);

    try {
      const res = await fetch("/api/lookup-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: cleanWord }),
      });

      const data = await res.json();
      setSelectedWord(data);
    } catch (err) {
      // im lang
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSaveWord = async () => {
    if (!selectedWord) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Ban can dang nhap de luu tu vung");
      return;
    }

    const { error } = await supabase.from("looked_up_words").insert({
      user_id: user.id,
      word: selectedWord.word,
      meaning: selectedWord.meaning,
      part_of_speech: selectedWord.partOfSpeech,
      example: selectedWord.example,
      source_video: "https://youtube.com/watch?v=" + youtubeId,
    });

    if (!error) {
      setWordSaved(true);
    }
  };

  return (
    <div className="min-h-screen dot-grid flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-4xl">
        <Link href="/learn" className="text-sm mb-4 inline-block" style={{ color: "#1CA7EC" }}>
          Ve thu vien
        </Link>
        <h1 className="text-2xl font-bold mb-4" style={{ color: "#10233F" }}>
          {title}
        </h1>

        <a
          href={"https://youtube.com/watch?v=" + youtubeId}
          target="_blank"
          rel="noreferrer"
          className="text-sm underline mb-4 inline-block"
          style={{ color: "#1CA7EC" }}
        >
          Xem video goc tren YouTube
        </a>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <iframe
              className="w-full aspect-video rounded-lg"
              src={"https://www.youtube.com/embed/" + youtubeId}
              allowFullScreen
            />

            {selectedWord && (
              <div className="scene-frame p-4 bg-white mt-4">
                <div className="flex items-baseline gap-2 justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold" style={{ color: "#1CA7EC" }}>
                      {selectedWord.word}
                    </span>
                    <span className="text-sm" style={{ color: "#5C6B84" }}>
                      ({selectedWord.partOfSpeech})
                    </span>
                  </div>
                  <button
                    onClick={handleSaveWord}
                    disabled={wordSaved}
                    className="text-xs px-2 py-1 rounded-md whitespace-nowrap"
                    style={
                      wordSaved
                        ? { backgroundColor: "#3AAFA9", color: "white" }
                        : { backgroundColor: "#1CA7EC", color: "white" }
                    }
                  >
                    {wordSaved ? "Da luu" : "Luu tu nay"}
                  </button>
                </div>
                <p style={{ color: "#10233F" }}>{selectedWord.meaning}</p>
                <p className="italic mt-1" style={{ color: "#5C6B84" }}>
                  {selectedWord.example}
                </p>
              </div>
            )}
            {lookupLoading && (
              <p className="text-sm mt-2" style={{ color: "#5C6B84" }}>
                Dang tra tu...
              </p>
            )}
          </div>

          <div className="bg-white border border-zinc-200 rounded-lg p-4 max-h-[500px] overflow-y-auto">
            {transcript.map((line, i) => (
              <p key={i} className="mb-2 leading-relaxed">
                {line.text.split(" ").map((word, j) => (
                  <span
                    key={j}
                    onClick={() => handleWordClick(word)}
                    className="cursor-pointer hover:bg-blue-100 rounded px-0.5"
                    style={{ color: "#10233F" }}
                  >
                    {word}{" "}
                  </span>
                ))}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}