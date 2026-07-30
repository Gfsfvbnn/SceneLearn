import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function POST(request: Request) {
  try {
    const { word } = await request.json();

    if (!word) {
      return NextResponse.json({ error: "Thiếu từ cần tra" }, { status: 400 });
    }

    const prompt = `Cho từ tiếng Anh: "${word}". Trả lời CHỈ bằng JSON, không thêm chữ nào khác:
{
  "word": "${word}",
  "meaning": "nghĩa tiếng Việt ngắn gọn",
  "partOfSpeech": "loại từ (viết tắt: n, v, adj, adv...)",
  "example": "1 câu ví dụ tiếng Anh ngắn"
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
    });

    const responseText = completion.choices[0]?.message?.content || "";
    const cleanedText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanedText);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Lỗi khi tra từ:", error);
    return NextResponse.json({ error: "Có lỗi xảy ra" }, { status: 500 });
  }
}