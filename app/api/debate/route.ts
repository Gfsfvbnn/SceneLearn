import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function POST(request: Request) {
  try {
    const { topic, history } = await request.json();

    const systemPrompt = `Bạn đang đóng vai người tranh luận có quan điểm đối lập với người dùng về chủ đề: "${topic}".
Nhiệm vụ của bạn:
- Phản biện lại lập luận của người dùng một cách lịch sự nhưng sắc bén, giống giám khảo IELTS Speaking Part 3
- Luôn trả lời bằng tiếng Anh
- Mỗi câu trả lời chỉ nên 2-4 câu, không quá dài
- Đặt câu hỏi ngược lại để buộc người dùng phải giải thích rõ hơn`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
    });

    const reply = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Lỗi khi gọi AI debate:", error);
    return NextResponse.json({ error: "Có lỗi xảy ra, thử lại sau" }, { status: 500 });
  }
}