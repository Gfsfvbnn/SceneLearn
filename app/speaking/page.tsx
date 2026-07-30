"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface WordItem {
  word: string;
  meaning: string;
}

interface GradeResult {
  usedWordCorrectly: boolean;
  feedback: string;
  betterVersion: string;
  score: number;
}

export default function SpeakingPage() {
  const [currentWord, setCurrentWord] = useState<WordItem | null>(null);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState("");

  const recognitionRef = useRef<any>(null);

  const loadNewQuestion = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setSpokenText("");
    setQuestion("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Ban can dang nhap de dung tinh nang nay");
        setLoading(false);
        return;
      }

      const { data: words } = await supabase
        .from("looked_up_words")
        .select("word, meaning")
        .eq("user_id", user.id);

      if (!words || words.length === 0) {
        setError("Ban chua co tu vung nao. Hay tra vai tu tren trang chu hoac YouTube truoc nhe!");
        setLoading(false);
        return;
      }

      const randomWord = words[Math.floor(Math.random() * words.length)];
      setCurrentWord(randomWord);

      const res = await fetch("/api/speaking-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: randomWord.word, meaning: randomWord.meaning }),
      });

      const data = await res.json();
      setQuestion(data.question);
    } catch (err) {
      setError("Co loi xay ra, thu lai sau");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Trinh duyet cua ban khong ho tro ghi am. Hay dung Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setSpokenText(text);
    };

    recognition.onerror = () => {
      setRecording(false);
      setError("Khong nghe duoc, thu lai nhe");
    };

    recognition.onend = () => {
      setRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
    setError("");
  };

  const handleGrade = async () => {
    if (!spokenText || !currentWord) return;
    setGrading(true);

    try {
      const res = await fetch("/api/grade-speaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: currentWord.word,
          question,
          spokenText,
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError("Khong cham duoc bai, thu lai sau");
    } finally {
      setGrading(false);
    }
  };

  return (
    <div className="min-h-screen dot-grid flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-2xl">
        <Link href="/" className="text-sm mb-4 inline-block" style={{ color: "#1CA7EC" }}>
          Ve trang chu
        </Link>
        <h1 className="text-3xl font-bold text-center mb-2" style={{ color: "#10233F" }}>
          Luyen noi voi tu vung cua ban
        </h1>
        <p className="text-center mb-8" style={{ color: "#5C6B84" }}>
          AI tao cau hoi tu chinh nhung tu ban da hoc, ban tra loi bang giong noi
        </p>

        {!question && !loading && (
          <button
            onClick={loadNewQuestion}
            className="w-full py-3 rounded-lg font-medium"
            style={{ backgroundColor: "#1CA7EC", color: "#FFFFFF" }}
          >
            Bat dau luyen noi
          </button>
        )}

        {loading && <p className="text-center" style={{ color: "#5C6B84" }}>Dang tao cau hoi...</p>}

        {error && <p className="text-red-600 text-center mt-4">{error}</p>}

        {question && currentWord && (
          <div className="space-y-4">
            <div className="scene-frame p-4 bg-white">
              <p className="text-sm mb-1" style={{ color: "#5C6B84" }}>
                Tu vung: <strong style={{ color: "#1CA7EC" }}>{currentWord.word}</strong> ({currentWord.meaning})
              </p>
              <p className="font-medium" style={{ color: "#10233F" }}>
                {question}
              </p>
            </div>

            <button
              onClick={startRecording}
              disabled={recording}
              className="w-full py-3 rounded-lg font-medium disabled:opacity-50"
              style={{ backgroundColor: recording ? "#FF6B5B" : "#1CA7EC", color: "#FFFFFF" }}
            >
              {recording ? "Dang nghe... noi ngay bay gio" : "Bam de noi"}
            </button>

            {spokenText && (
              <div className="p-4 bg-white border border-zinc-200 rounded-lg">
                <p className="text-sm" style={{ color: "#5C6B84" }}>
                  Ban da noi:
                </p>
                <p style={{ color: "#10233F" }}>{spokenText}</p>
              </div>
            )}

            {spokenText && !result && (
              <button
                onClick={handleGrade}
                disabled={grading}
                className="w-full py-3 rounded-lg font-medium disabled:opacity-50"
                style={{ backgroundColor: "#10233F", color: "#FFFFFF" }}
              >
                {grading ? "Dang cham..." : "Cham diem"}
              </button>
            )}

            {result && (
              <div className="space-y-3">
                <div className="p-4 bg-white border border-zinc-200 rounded-lg text-center">
                  <p className="text-sm" style={{ color: "#5C6B84" }}>
                    Diem
                  </p>
                  <p className="text-4xl font-bold" style={{ color: "#1CA7EC" }}>
                    {result.score}/10
                  </p>
                  <p className="text-sm mt-1" style={{ color: result.usedWordCorrectly ? "#3AAFA9" : "#FF6B5B" }}>
                    {result.usedWordCorrectly ? "Da dung dung tu vung" : "Chua dung tu vung nay"}
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: "rgba(28, 167, 236, 0.08)" }}>
                  <p className="font-semibold mb-1" style={{ color: "#10233F" }}>
                    Nhan xet
                  </p>
                  <p style={{ color: "#10233F" }}>{result.feedback}</p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: "rgba(58, 175, 169, 0.1)" }}>
                  <p className="font-semibold mb-1" style={{ color: "#10233F" }}>
                    Goi y cau hay hon
                  </p>
                  <p className="italic" style={{ color: "#10233F" }}>
                    {result.betterVersion}
                  </p>
                </div>

                <button
                  onClick={loadNewQuestion}
                  className="w-full py-3 rounded-lg font-medium"
                  style={{ backgroundColor: "#1CA7EC", color: "#FFFFFF" }}
                >
                  Cau tiep theo
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}