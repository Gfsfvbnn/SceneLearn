"use client";

import { useState } from "react";

export default function AdminPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [secret, setSecret] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin-add-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl, title, secret }),
      });

      const data = await res.json();
      if (data.error) {
        setMessage("Loi: " + data.error);
      } else {
        setMessage("Da them video thanh cong!");
        setVideoUrl("");
        setTitle("");
      }
    } catch (err) {
      setMessage("Co loi xay ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-md space-y-3">
        <h1 className="text-2xl font-bold">Them video vao thu vien</h1>
        <input
          className="w-full p-3 border rounded-lg"
          placeholder="Link YouTube"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
        <input
          className="w-full p-3 border rounded-lg"
          placeholder="Tieu de video"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="password"
          className="w-full p-3 border rounded-lg"
          placeholder="Mat khau admin"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />
        <button
          onClick={handleAdd}
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg"
        >
          {loading ? "Dang them..." : "Them video"}
        </button>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}