"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Video {
  id: string;
  title: string;
  youtube_id: string;
}

export default function LearnListPage() {
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    supabase
      .from("curated_videos")
      .select("id, title, youtube_id")
      .then(({ data }) => setVideos(data || []));
  }, []);

  return (
    <div className="min-h-screen dot-grid flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-8" style={{ color: "#10233F" }}>
          Thu vien video hoc tieng Anh
        </h1>
        <div className="grid gap-4">
          {videos.map((v) => (
            <Link
              key={v.id}
              href={`/learn/${v.id}`}
              className="scene-frame p-4 bg-white block hover:bg-blue-50"
            >
              <p className="font-medium" style={{ color: "#10233F" }}>
                {v.title}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}