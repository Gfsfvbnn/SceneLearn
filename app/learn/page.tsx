"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Video {
  id: string;
  title: string;
  youtube_id: string;
  duration: number;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m + ":" + s.toString().padStart(2, "0");
}

export default function LearnListPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase
      .from("curated_videos")
      .select("id, title, youtube_id, duration")
      .then(({ data }) => setVideos(data || []));
  }, []);

  const filteredVideos = videos.filter((v) =>
    v.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen dot-grid flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-bold text-center mb-6" style={{ color: "#10233F" }}>
          Thu vien video hoc tieng Anh
        </h1>

        <input
          type="text"
          placeholder="Tim kiem video theo tieu de..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 border border-zinc-300 rounded-lg mb-8 bg-white"
        />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredVideos.map((v) => (
            <Link
              key={v.id}
              href={`/learn/${v.id}`}
              className="bg-white rounded-lg overflow-hidden border border-zinc-200 hover:shadow-lg transition"
            >
              <div className="relative aspect-video bg-zinc-100">
                <img
                  src={`https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg`}
                  alt={v.title}
                  className="w-full h-full object-cover"
                />
                {v.duration > 0 && (
                  <span
                    className="absolute bottom-1 right-1 text-xs px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: "rgba(16,35,63,0.85)", color: "white" }}
                  >
                    {formatDuration(v.duration)}
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="font-medium text-sm" style={{ color: "#10233F" }}>
                  {v.title}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <p className="text-center mt-8" style={{ color: "#5C6B84" }}>
            Khong tim thay video nao.
          </p>
        )}
      </div>
    </div>
  );
}