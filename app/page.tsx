"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface VocabItem {
  word: string;
  meaning: string;
  partOfSpeech: string;
  example: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function speakWord(text: string) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [vocabulary, setVocabulary] = useState<VocabItem[]>([]);
  const [debateQuestion, setDebateQuestion] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError("");
    setVocabulary([]);
    setDebateQuestion("");
    setChatMessages([]);
    setSaved(false);

    try {
      const res = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      if (!res.ok) throw new Error("Co loi xay ra");

      const data = await res.json();
      const words: VocabItem[] = data.vocabulary || [];
      setVocabulary(words);
      setDebateQuestion(data.debateQuestion || "");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && words.length > 0) {
        const rows = words.map((w) => ({
          user_id: user.id,
          word: w.word,
          meaning: w.meaning,
          part_of_speech: w.partOfSpeech,
          example: w.example,
          source_video: null,
        }));

        await supabase.from("looked_up_words").insert(rows);
        setSaved(true);
      }
    } catch (err) {
      setError("Khong the tao bai hoc. Thu lai sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const newMessages: ChatMessage[] = [...chatMessages, { role: "user", content: chatInput }];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: debateQuestion, history: newMessages }),
      });

      const data = await res.json();
      setChatMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setChatMessages([...newMessages, { role: "assistant", content: "Co loi xay ra, thu lai sau." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen dot-grid flex flex-col items-center py-16 px-4">
      <div className="decorative-bg w-full max-w-2xl">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-center mb-2" style={{ color: "#10233F" }}>
            SceneLearn
          </h1>
          <p className="text-center mb-8" style={{ color: "#5C6B84" }}>
            Dan vao mot doan van ban, AI se tao bai hoc tu vung cho ban
          </p>

          <textarea
            className="w-full h-40 p-4 border border-zinc-300 rounded-lg mb-4 focus:outline-none focus:ring-2 bg-white"
            style={{ borderColor: "#D6E4F0" }}
            placeholder="Dan doan van ban tieng Anh vao day..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 rounded-lg font-medium disabled:opacity-50 transition"
            style={{ backgroundColor: "#1CA7EC", color: "#FFFFFF" }}
          >
            {loading ? "Dang tao bai hoc..." : "Tao bai hoc"}
          </button>

          {error && <p className="mt-4 text-red-600">{error}</p>}

          {vocabulary.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold" style={{ color: "#10233F" }}>
                  Tu vung
                </h2>
                {saved && (
                  <span className="text-xs" style={{ color: "#3AAFA9" }}>
                    Da luu vao tai khoan
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {vocabulary.map((item, i) => (
                  <div key={i} className="scene-frame p-4 bg-white">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold" style={{ color: "#1CA7EC" }}>
                        {item.word}
                      </span>
                      <span className="text-sm" style={{ color: "#5C6B84" }}>
                        ({item.partOfSpeech})
                      </span>
                      <button
                        onClick={() => speakWord(item.word)}
                        className="ml-1 text-sm"
                        style={{ color: "#1CA7EC" }}
                        title="Nghe phat am"
                      >
                        🔊
                      </button>
                    </div>
                    <p style={{ color: "#10233F" }}>{item.meaning}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="italic" style={{ color: "#5C6B84" }}>
                        {item.example}
                      </p>
                      <button
                        onClick={() => speakWord(item.example)}
                        className="text-sm"
                        style={{ color: "#1CA7EC" }}
                        title="Nghe cau vi du"
                      >
                        🔊
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {debateQuestion && (
            <div className="mt-8">
              <div
                className="scene-frame p-4 mb-4"
                style={{ backgroundColor: "rgba(28, 167, 236, 0.08)" }}
              >
                <h2 className="text-xl font-semibold mb-2" style={{ color: "#10233F" }}>
                  Cau hoi tranh luan
                </h2>
                <p style={{ color: "#10233F" }}>{debateQuestion}</p>
              </div>

              <div className="border border-zinc-200 rounded-lg bg-white">
                <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                  {chatMessages.length === 0 && (
                    <p className="text-sm" style={{ color: "#5C6B84" }}>
                      Tra loi cau hoi tren de bat dau tranh luan voi AI...
                    </p>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className="max-w-[80%] px-3 py-2 rounded-lg text-sm"
                        style={
                          msg.role === "user"
                            ? { backgroundColor: "#1CA7EC", color: "white" }
                            : { backgroundColor: "#EEF3F8", color: "#10233F" }
                        }
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <p className="text-sm" style={{ color: "#5C6B84" }}>
                      AI dang suy nghi...
                    </p>
                  )}
                </div>

                <div className="flex border-t border-zinc-200 p-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 focus:outline-none"
                    placeholder="Nhap cau tra loi cua ban bang tieng Anh..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={chatLoading}
                    className="px-4 py-2 rounded-lg ml-2 disabled:opacity-50"
                    style={{ backgroundColor: "#1CA7EC", color: "#FFFFFF" }}
                  >
                    Gui
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}