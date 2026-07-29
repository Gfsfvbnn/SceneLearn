"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Result {
  id: string;
  overall_band: number;
  task_response: number;
  coherence: number;
  lexical: number;
  grammar: number;
  created_at: string;
}

export default function ProgressPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      const { data } = await supabase
        .from("writing_results")
        .select("*")
        .order("created_at", { ascending: false });

      setResults(data || []);
      setLoading(false);
    };
    fetchResults();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-2xl">
        <Link href="/writing" className="text-blue-600 text-sm mb-4 inline-block">
          ← Về trang luyện tập
        </Link>
        <h1 className="text-3xl font-bold text-center mb-8">Tiến độ của bạn</h1>

        {loading && <p className="text-center text-zinc-500">Đang tải...</p>}

        {!loading && results.length === 0 && (
          <p className="text-center text-zinc-500">Chưa có bài nào được chấm.</p>
        )}

        <div className="space-y-3">
          {results.map((r) => (
            <div key={r.id} className="p-4 bg-white border border-zinc-200 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-sm text-zinc-500">
                  {new Date(r.created_at).toLocaleDateString("vi-VN")}
                </p>
                <p className="text-xs text-zinc-400">
                  TR: {r.task_response} · CC: {r.coherence} · LR: {r.lexical} · GR: {r.grammar}
                </p>
              </div>
              <p className="text-2xl font-bold text-blue-700">{r.overall_band.toFixed(1)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}