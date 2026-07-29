import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Thiếu nội dung văn bản" }, { status: 400 });
    }

    const prompt = `Bạn là giáo viên tiếng Anh. Đọc đoạn văn bản sau và:
1. Trích ra 5-8 từ vựng khó (band 6.5+ nếu có thể), mỗi từ kèm: nghĩa tiếng Việt, loại từ, 1 câu ví dụ tiếng Anh
2. Tạo 1 câu hỏi tranh luận (debate) bằng tiếng Anh liên quan đến chủ đề đoạn văn, dạng câu hỏi IELTS Speaking Part 3

Đoạn văn bản:
"""
${text}
"""

Trả lời CHỈ bằng JSON theo đúng định dạng sau, không thêm chữ nào khác, không dùng markdown code block:
{
  "vocabulary": [
    { "word": "...", "meaning": "...", "partOfSpeech": "...", "example": "..." }
  ],
  "debateQuestion": "..."
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content || "";

    const cleanedText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const parsed = JSON.parse(cleanedText);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Lỗi khi gọi AI:", error);
    return NextResponse.json({ error: "Có lỗi xảy ra, thử lại sau" }, { status: 500 });
  }
}