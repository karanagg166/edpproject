import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const query = await req.text();
    const encoded = 'data=' + encodeURIComponent(query);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    let response: Response;
    try {
      // Use native globalThis.fetch to avoid Next.js fetch patches
      response = await globalThis.fetch(
        'https://overpass-api.de/api/interpreter',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': '*/*',
            'User-Agent': 'SmartPantry/1.0',
          },
          body: encoded,
          signal: controller.signal,
          // @ts-ignore — opt out of Next.js fetch cache
          cache: 'no-store',
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Overpass API error ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out. The Overpass API is busy, please try again.' },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to reach Overpass API.' },
      { status: 500 }
    );
  }
}
