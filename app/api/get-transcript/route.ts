import { YoutubeTranscript } from "youtube-transcript";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json({ error: "Thieu link video" }, { status: 400 });
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoUrl);

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("Loi khi lay phu de:", error);
    return NextResponse.json(
      { error: "Khong lay duoc phu de. Video co the khong co phu de tieng Anh." },
      { status: 500 }
    );
  }
}