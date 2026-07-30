import { NextResponse } from "next/server";

function getVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

async function fetchTranscript(videoId: string) {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    Cookie: "CONSENT=YES+cb.20210328-17-p0.en+FX+299",
  };

  // Buoc 1: tai trang video de tim link phu de
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { headers });
  const pageHtml = await pageRes.text();

  // DEBUG: in ra thong tin de kiem tra
  console.log("DEBUG - Status code:", pageRes.status);
  console.log("DEBUG - Do dai HTML tra ve:", pageHtml.length);
  console.log("DEBUG - 500 ky tu dau:", pageHtml.slice(0, 500));
  console.log("DEBUG - Co chua 'captionTracks' khong:", pageHtml.includes("captionTracks"));
  console.log("DEBUG - Co chua 'consent' khong:", pageHtml.toLowerCase().includes("consent"));

  const captionMatch = pageHtml.match(/"captionTracks":(\[.*?\])/);
  if (!captionMatch) {
    throw new Error("Video nay khong co phu de kha dung.");
  }

  const captionTracks = JSON.parse(captionMatch[1]);

  // Uu tien phu de tieng Anh, neu khong co thi lay phu de dau tien
  const englishTrack =
    captionTracks.find((t: any) => t.languageCode === "en") || captionTracks[0];

  if (!englishTrack) {
    throw new Error("Khong tim thay phu de tieng Anh.");
  }

  // Buoc 2: tai noi dung phu de tu link do
  const transcriptRes = await fetch(englishTrack.baseUrl, { headers });
  const transcriptXml = await transcriptRes.text();

  // Buoc 3: tach cac dong phu de tu XML
  const lines = [...transcriptXml.matchAll(/<text start="([\d.]+)"[^>]*>([^<]*)<\/text>/g)];

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