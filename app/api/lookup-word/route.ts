import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

// Headers cho phép gọi từ domain khác (extension trên YouTube)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Xử lý request "kiểm tra trước" mà trình duyệt tự gửi
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const { word } = await request.json();

    if (!word) {
      return NextResponse.json(
        { error: "Thiếu từ cần tra" },
        { status: 400, headers: corsHeaders }
      );
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

    return NextResponse.json(parsed, { headers: corsHeaders });
  } catch (error) {
    console.error("Lỗi khi tra từ:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra" },
      { status: 500, headers: corsHeaders }
    );
  }
}