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
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-2">SceneLearn</h1>
        <p className="text-center text-zinc-600 mb-8">
          Dán vào một đoạn văn bản, AI sẽ tạo bài học từ vựng cho bạn
        </p>

        <textarea
          className="w-full h-40 p-4 border border-zinc-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Dán đoạn văn bản tiếng Anh vào đây..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Đang tạo bài học..." : "Tạo bài học"}
        </button>

        {error && <p className="mt-4 text-red-600">{error}</p>}

        {vocabulary.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-3">Từ vựng</h2>
            <div className="space-y-3">
              {vocabulary.map((item, i) => (
                <div key={i} className="p-4 bg-white border border-zinc-200 rounded-lg">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-blue-700">{item.word}</span>
                    <span className="text-sm text-zinc-500">({item.partOfSpeech})</span>
                  </div>
                  <p className="text-zinc-700">{item.meaning}</p>
                  <p className="text-zinc-500 italic mt-1">{item.example}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {debateQuestion && (
          <div className="mt-8">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <h2 className="text-xl font-semibold mb-2">Câu hỏi tranh luận</h2>
              <p className="text-zinc-700">{debateQuestion}</p>
            </div>

            <div className="border border-zinc-200 rounded-lg bg-white">
              <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                {chatMessages.length === 0 && (
                  <p className="text-zinc-400 text-sm">Trả lời câu hỏi trên để bắt đầu tranh luận với AI...</p>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                        msg.role === "user" ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-800"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && <p className="text-zinc-400 text-sm">AI đang suy nghĩ...</p>}
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg ml-2 disabled:opacity-50"
                >
                  Gửi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}