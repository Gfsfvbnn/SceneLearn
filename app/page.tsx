"use client";

import { useState } from "react";

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

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [vocabulary, setVocabulary] = useState<VocabItem[]>([]);
  const [debateQuestion, setDebateQuestion] = useState("");
  const [error, setError] = useState("");

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

    try {
      const res = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      if (!res.ok) throw new Error("Có lỗi xảy ra");

      const data = await res.json();
      setVocabulary(data.vocabulary || []);
      setDebateQuestion(data.debateQuestion || "");
    } catch (err) {
      setError("Không thể tạo bài học. Thử lại sau.");
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
      setChatMessages([...newMessages, { role: "assistant", content: "Có lỗi xảy ra, thử lại sau." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen dot-grid flex flex-col items-center py-16 px-4">
      <div className="decorative-bg w-full max-w-2xl">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-center mb-2" style={{ color: "var(--color-ink)" }}>
            SceneLearn
          </h1>
          <p className="text-center mb-8" style={{ color: "var(--color-muted)" }}>
            Dán vào một đoạn văn bản, AI sẽ tạo bài học từ vựng cho bạn
          </p>

          <textarea
            className="w-full h-40 p-4 border border-zinc-300 rounded-lg mb-4 focus:outline-none focus:ring-2 bg-white"
            style={{ borderColor: "#D6E4F0" }}
            placeholder="Dán đoạn văn bản tiếng Anh vào đây..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full text-white py-3 rounded-lg font-medium disabled:opacity-50 transition"
            style={{ backgroundColor: "var(--color-cyan)" }}
          >
            {loading ? "Đang tạo bài học..." : "Tạo bài học"}
          </button>

          {error && <p className="mt-4 text-red-600">{error}</p>}

          {vocabulary.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--color-ink)" }}>
                Từ vựng
              </h2>
              <div className="space-y-3">
                {vocabulary.map((item, i) => (
                  <div key={i} className="scene-frame p-4 bg-white">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold" style={{ color: "var(--color-cyan)" }}>
                        {item.word}
                      </span>
                      <span className="text-sm" style={{ color: "var(--color-muted)" }}>
                        ({item.partOfSpeech})
                      </span>
                    </div>
                    <p style={{ color: "var(--color-ink)" }}>{item.meaning}</p>
                    <p className="italic mt-1" style={{ color: "var(--color-muted)" }}>
                      {item.example}
                    </p>
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
                <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-ink)" }}>
                  Câu hỏi tranh luận
                </h2>
                <p style={{ color: "var(--color-ink)" }}>{debateQuestion}</p>
              </div>

              <div className="border border-zinc-200 rounded-lg bg-white">
                <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                  {chatMessages.length === 0 && (
                    <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                      Trả lời câu hỏi trên để bắt đầu tranh luận với AI...
                    </p>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className="max-w-[80%] px-3 py-2 rounded-lg text-sm"
                        style={
                          msg.role === "user"
                            ? { backgroundColor: "var(--color-cyan)", color: "white" }
                            : { backgroundColor: "#EEF3F8", color: "var(--color-ink)" }
                        }
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                      AI đang suy nghĩ...
                    </p>
                  )}
                </div>

                <div className="flex border-t border-zinc-200 p-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 focus:outline-none"
                    placeholder="Nhập câu trả lời của bạn bằng tiếng Anh..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={chatLoading}
                    className="px-4 py-2 text-white rounded-lg ml-2 disabled:opacity-50"
                    style={{ backgroundColor: "var(--color-cyan)" }}
                  >
                    Gửi
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