import { NextResponse } from "next/server";

function getVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

function extractPlayerResponse(html: string): any {
  const startMarker = "ytInitialPlayerResponse = ";
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return null;

  const jsonStart = startIdx + startMarker.length;

  let depth = 0;
  let endIdx = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = jsonStart; i < html.length; i++) {
    const char = html[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") depth++;
    if (char === "}") {
      depth--;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }

  if (endIdx === -1) return null;

  const jsonStr = html.slice(jsonStart, endIdx);
  return JSON.parse(jsonStr);
}

async function fetchTranscript(videoId: string) {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    Cookie: "CONSENT=YES+cb.20210328-17-p0.en+FX+299",
  };

  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { headers });
  const pageHtml = await pageRes.text();

  const playerResponse = extractPlayerResponse(pageHtml);

  if (!playerResponse) {
    throw new Error("Khong doc duoc du lieu video. YouTube co the da doi cau truc trang.");
  }

  console.log("DEBUG - Co truong captions khong:", !!playerResponse?.captions);
  console.log("DEBUG - videoDetails title:", playerResponse?.videoDetails?.title);

  const captionTracks =
    playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!captionTracks || captionTracks.length === 0) {
    throw new Error("Video nay khong co phu de kha dung.");
  }

  const englishTrack =
    captionTracks.find((t: any) => t.languageCode === "en") || captionTracks[0];

  const transcriptRes = await fetch(englishTrack.baseUrl, { headers });
  const transcriptXml = await transcriptRes.text();

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