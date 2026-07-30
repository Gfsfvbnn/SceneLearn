import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const { word, email, sourceVideo } = await request.json();

    if (!word) {
      return NextResponse.json({ error: "Thiếu từ cần tra" }, { status: 400, headers: corsHeaders });
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

    // Nếu có email, tìm user và lưu từ vào tài khoản đó
    if (email) {
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      const matchedUser = userList?.users.find((u) => u.email === email);

      if (matchedUser) {
        await supabaseAdmin.from("looked_up_words").insert({
          user_id: matchedUser.id,
          word: parsed.word,
          meaning: parsed.meaning,
          part_of_speech: parsed.partOfSpeech,
          example: parsed.example,
          source_video: sourceVideo || null,
        });
      }
    }

    return NextResponse.json(parsed, { headers: corsHeaders });
  } catch (error) {
    console.error("Lỗi khi tra từ:", error);
    return NextResponse.json({ error: "Có lỗi xảy ra" }, { status: 500, headers: corsHeaders });
  }
}