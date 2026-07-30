"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface WordItem {
  id: string;
  word: string;
  meaning: string;
  part_of_speech: string;
  example: string;
  source_video: string | null;
  created_at: string;
}

export default function VocabularyPage() {
  const [words, setWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWords = async () => {
      const { data } = await supabase
        .from("looked_up_words")
        .select("*")
        .order("created_at", { ascending: false });

      setWords(data || []);
      setLoading(false);
    };
    fetchWords();
  }, []);

  return (
    <div className="min-h-screen dot-grid flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-2xl">
        <Link href="/" className="text-sm mb-4 inline-block" style={{ color: "var(--color-cyan)" }}>
          Ve trang chu
        </Link>
        <h1 className="text-3xl font-bold text-center mb-2" style={{ color: "var(--color-ink)" }}>
          Tu vung da tra tren YouTube
        </h1>
        <p className="text-center mb-8" style={{ color: "var(--color-muted)" }}>
          Cac tu ban da tra khi xem video se tu dong xuat hien o day
        </p>

        {loading && (
          <p className="text-center" style={{ color: "var(--color-muted)" }}>
            Dang tai...
          </p>
        )}

        {!loading && words.length === 0 && (
          <p className="text-center" style={{ color: "var(--color-muted)" }}>
            Chua co tu nao. Cai extension va tra thu vai tu tren YouTube nhe!
          </p>
        )}

        <div className="space-y-3">
          {words.map((w) => (
            <div key={w.id} className="scene-frame p-4 bg-white">
              <div className="flex items-baseline gap-2">
                <span className="font-bold" style={{ color: "var(--color-cyan)" }}>
                  {w.word}
                </span>
                <span className="text-sm" style={{ color: "var(--color-muted)" }}>
                  ({w.part_of_speech})
                </span>
              </div>
              <p style={{ color: "var(--color-ink)" }}>{w.meaning}</p>
              <p className="italic mt-1" style={{ color: "var(--color-muted)" }}>
                {w.example}
              </p>
              {w.source_video ? (
  <a
    href={w.source_video}
    target="_blank"
    rel="noreferrer"
    className="text-xs underline mt-2 inline-block"
    style={{ color: "var(--color-cyan)" }}
  >
    Xem lai video nguon
  </a>
) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}