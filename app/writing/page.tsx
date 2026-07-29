"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
interface CriterionScore {
  band: number;
  comment: string;
}

interface GradeResult {
  scores: {
    taskResponse: CriterionScore;
    coherence: CriterionScore;
    lexical: CriterionScore;
    grammar: CriterionScore;
  };
  strengths: string[];
  improvements: string[];
  challengeQuestion: string;
}

const SAMPLE_TOPIC =
  "Some people think that the best way to reduce crime is to give longer prison sentences. Others believe there are better alternative ways of reducing crime. Discuss both views and give your opinion.";

export default function WritingPage() {
  const [essayText, setEssayText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState("");

  const wordCount = essayText.trim().split(/\s+/).filter(Boolean).length;

  const handleSubmit = async () => {
    if (!essayText.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/grade-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essayTopic: SAMPLE_TOPIC, essayText }),
      });

      if (!res.ok) throw new Error("Có lỗi xảy ra");

      const data = await res.json();
      setResult(data);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const overall =
          (data.scores.taskResponse.band +
            data.scores.coherence.band +
            data.scores.lexical.band +
            data.scores.grammar.band) / 4;

        await supabase.from("writing_results").insert({
          user_id: user.id,
          essay_topic: SAMPLE_TOPIC,
          essay_text: essayText,
          overall_band: overall,
          task_response: data.scores.taskResponse.band,
          coherence: data.scores.coherence.band,
          lexical: data.scores.lexical.band,
          grammar: data.scores.grammar.band,
        });
      }
    } catch (err) {
      setError("Không thể chấm bài. Thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const overallBand = result
    ? (
        (result.scores.taskResponse.band +
          result.scores.coherence.band +
          result.scores.lexical.band +
          result.scores.grammar.band) /
        4
      ).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-2xl">
        <Link href="/" className="text-blue-600 text-sm mb-4 inline-block">
          ← Về trang chủ
        </Link>
        <h1 className="text-3xl font-bold text-center mb-2">Luyện IELTS Writing</h1>
        <div className="text-center mb-4">
  <a href="/writing" className="text-blue-600 underline text-sm">
    Chuyển sang luyện IELTS Writing →
  </a>
</div>
        <p className="text-center text-zinc-600 mb-6">AI chấm điểm bài viết của bạn theo 4 tiêu chí IELTS</p>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <p className="font-semibold mb-1">Đề bài:</p>
          <p className="text-zinc-700">{SAMPLE_TOPIC}</p>
        </div>

        <textarea
          className="w-full h-64 p-4 border border-zinc-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Viết bài luận của bạn vào đây (khuyến khích 250+ từ)..."
          value={essayText}
          onChange={(e) => setEssayText(e.target.value)}
        />
        <p className="text-sm text-zinc-500 mb-4">Số từ: {wordCount}</p>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Đang chấm bài..." : "Nộp bài"}
        </button>

        {error && <p className="mt-4 text-red-600">{error}</p>}

        {result && (
          <div className="mt-8 space-y-4">
            <div className="p-4 bg-white border border-zinc-200 rounded-lg text-center">
              <p className="text-sm text-zinc-500">Điểm tổng</p>
              <p className="text-4xl font-bold text-blue-700">{overallBand}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Task Response", data: result.scores.taskResponse },
                { label: "Coherence & Cohesion", data: result.scores.coherence },
                { label: "Lexical Resource", data: result.scores.lexical },
                { label: "Grammar", data: result.scores.grammar },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-white border border-zinc-200 rounded-lg">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-2xl font-bold text-blue-700">{item.data.band}</p>
                  <p className="text-xs text-zinc-500">{item.data.comment}</p>
                </div>
              ))}
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-semibold mb-2">✓ Điểm mạnh</p>
              <ul className="list-disc list-inside text-sm text-zinc-700 space-y-1">
                {result.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="font-semibold mb-2">△ Cần cải thiện</p>
              <ul className="list-disc list-inside text-sm text-zinc-700 space-y-1">
                {result.improvements.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="font-semibold mb-2">Thử thách phản biện</p>
              <p className="text-sm text-zinc-700">{result.challengeQuestion}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}