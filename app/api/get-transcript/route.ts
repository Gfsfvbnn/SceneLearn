import { NextResponse } from "next/server";

function getVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

async function fetchTranscript(videoId: string) {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  // Buoc 1: lay danh sach cac phu de kha dung cho video nay
  const listRes = await fetch(
    `https://video.google.com/timedtext?type=list&v=${videoId}`,
    { headers }
  );
  const listXml = await listRes.text();

  console.log("DEBUG - list XML (200 ky tu dau):", listXml.slice(0, 200));

  if (!listXml || listXml.length < 10) {
    throw new Error("Video nay khong co phu de kha dung.");
  }

  // Tim track tieng Anh, uu tien khong phai auto-generated
  const trackMatches = [...listXml.matchAll(/<track[^>]*lang_code="([a-z-]+)"[^>]*\/?>/g)];

  console.log("DEBUG - so track tim duoc:", trackMatches.length);
  console.log("DEBUG - cac lang_code:", trackMatches.map((m) => m[1]).join(", "));

  const englishMatch =
    trackMatches.find((m) => m[1] === "en") || trackMatches[0];

  if (!englishMatch) {
    throw new Error("Video nay khong co phu de kha dung.");
  }

  const langCode = englishMatch[1];

  // Buoc 2: lay noi dung phu de that
  const transcriptRes = await fetch(
    `https://video.google.com/timedtext?lang=${langCode}&v=${videoId}`,
    { headers }
  );
  const transcriptXml = await transcriptRes.text();

  const lines = [...transcriptXml.matchAll(/<text start="([\d.]+)"[^>]*>([^<]*)<\/text>/g)];

  if (lines.length === 0) {
    throw new Error("Khong doc duoc noi dung phu de.");
  }

  const transcript = lines.map((line) => ({
    offset: parseFloat(line[1]),
    text: line[2]
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'"),
  }));

  return transcript;
}

export async function POST(request: Request) {
  try {
    const { videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json({ error: "Thieu link video" }, { status: 400 });
    }

    const videoId = getVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json({ error: "Link YouTube khong hop le" }, { status: 400 });
    }

    const transcript = await fetchTranscript(videoId);

    return NextResponse.json({ transcript });
  } catch (error: any) {
    console.error("Loi khi lay phu de:", error);
    return NextResponse.json(
      { error: error.message || "Khong lay duoc phu de. Thu video khac." },
      { status: 500 }
    );
  }
}