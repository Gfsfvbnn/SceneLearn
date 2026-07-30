import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

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
    const { word, meaning } = await request.json();

    if (!word) {
      return NextResponse.json({ error: "Thieu tu vung" }, { status: 400, headers: corsHeaders });
    }

    const prompt = `Tao 1 cau hoi luyen noi tieng Anh (dang IELTS Speaking) bat buoc nguoi hoc phai su dung tu "${word}" (nghia: ${meaning}) trong cau tra loi. Cau hoi ngan gon, de hieu, khuyen khich noi 2-3 cau.

Tra loi CHI bang JSON, khong them chu nao khac:
{
  "question": "cau hoi tieng Anh o day"
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
    });

    const responseText = completion.choices[0]?.message?.content || "";
    const cleanedText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanedText);

    return NextResponse.json(parsed, { headers: corsHeaders });
  } catch (error) {
    console.error("Loi khi tao cau hoi:", error);
    return NextResponse.json({ error: "Co loi xay ra" }, { status: 500, headers: corsHeaders });
  }
}