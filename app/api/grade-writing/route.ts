import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function POST(request: Request) {
  try {
    const { essayTopic, essayText } = await request.json();

    if (!essayText || essayText.trim().length === 0) {
      return NextResponse.json({ error: "Thiếu nội dung bài viết" }, { status: 400 });
    }

    const prompt = `Bạn là giám khảo IELTS Writing Task 2 chuyên nghiệp. Chấm bài viết sau theo đúng 4 tiêu chí chính thức IELTS:
1. Task Response (Trả lời đúng trọng tâm đề bài)
2. Coherence and Cohesion (Mạch lạc, liên kết ý)
3. Lexical Resource (Vốn từ vựng)
4. Grammatical Range and Accuracy (Ngữ pháp)

Đề bài: "${essayTopic}"

Bài viết của học sinh:
"""
${essayText}
"""

Hãy:
- Chấm điểm từng tiêu chí theo thang 0-9 (band IELTS thật, có thể có số lẻ như 6.5)
- Với mỗi tiêu chí, viết 1-2 câu nhận xét ngắn gọn bằng tiếng Việt
- Liệt kê 2-3 điểm mạnh cụ thể
- Liệt kê 2-3 điểm cần cải thiện cụ thể
- Đưa ra 1 câu hỏi phản biện bằng tiếng Anh về lập luận yếu nhất trong bài, để học sinh viết lại đoạn đó cho chặt chẽ hơn

Trả lời CHỈ bằng JSON theo đúng định dạng sau, không thêm chữ nào khác, không dùng markdown code block:
{
  "scores": {
    "taskResponse": { "band": 0, "comment": "..." },
    "coherence": { "band": 0, "comment": "..." },
    "lexical": { "band": 0, "comment": "..." },
    "grammar": { "band": 0, "comment": "..." }
  },
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "challengeQuestion": "..."
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
    });

    const responseText = completion.choices[0]?.message?.content || "";
    const cleanedText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanedText);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Lỗi khi chấm bài:", error);
    return NextResponse.json({ error: "Có lỗi xảy ra, thử lại sau" }, { status: 500 });
  }
}