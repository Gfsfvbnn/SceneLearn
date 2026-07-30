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
    const { word, question, spokenText } = await request.json();

    if (!spokenText) {
      return NextResponse.json({ error: "Khong nghe duoc noi dung" }, { status: 400, headers: corsHeaders });
    }

    const prompt = `Ban la giao vien tieng Anh. Nguoi hoc duoc yeu cau tra loi cau hoi sau, bat buoc phai dung tu "${word}":

Cau hoi: "${question}"

Cau tra loi cua hoc sinh (da duoc chuyen tu giong noi sang chu): "${spokenText}"

Hay danh gia:
1. Hoc sinh co dung dung tu "${word}" trong cau tra loi khong, va dung dung ngu canh khong
2. Nhan xet ngan gon ve ngu phap va cach dien dat (2-3 cau)
3. Goi y 1 cach dien dat hay hon (neu co)
4. Cham diem tong the tren thang 1-10

Tra loi CHI bang JSON, khong them chu nao khac:
{
  "usedWordCorrectly": true hoac false,
  "feedback": "nhan xet ngan gon bang tieng Viet",
  "betterVersion": "1 cau tieng Anh hay hon",
  "score": 0
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
    });

    const responseText = completion.choices[0]?.message?.content || "";
    const cleanedText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanedText);

    return NextResponse.json(parsed, { headers: corsHeaders });
  } catch (error) {
    console.error("Loi khi cham bai:", error);
    return NextResponse.json({ error: "Co loi xay ra" }, { status: 500, headers: corsHeaders });
  }
}