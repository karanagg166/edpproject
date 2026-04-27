import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/fatsecret?barcode=<GTIN-13>
 *
 * Server-side proxy for FatSecret OAuth2 Platform API.
 * Hides client_secret from the browser.
 * Returns null gracefully if env vars are missing or lookup fails.
 *
 * Free tier: 5000 calls/month — https://platform.fatsecret.com/platform-api
 */

interface TokenCache {
  token: string;
  expires: number;
}

let cachedToken: TokenCache | null = null;

async function getFatSecretToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires) {
    return cachedToken.token;
  }

  const res = await fetch("https://oauth.fatsecret.com/connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.FATSECRET_CLIENT_ID!,
      client_secret: process.env.FATSECRET_CLIENT_SECRET!,
      scope: "basic",
    }),
  });

  if (!res.ok) {
    throw new Error(`FatSecret token error: ${res.status}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    token: data.access_token,
    // Subtract 60s buffer before expiry
    expires: Date.now() + data.expires_in * 1000 - 60_000,
  };

  return cachedToken.token;
}

interface FatSecretServing {
  serving_description?: string;
  calories?: string;
  protein?: string;
  carbohydrate?: string;
  fat?: string;
  fiber?: string;
  sodium?: string;
}

interface FatSecretFood {
  food_name?: string;
  brand_name?: string;
  food_type?: string;
  servings?: {
    serving?: FatSecretServing | FatSecretServing[];
  };
}

export async function GET(req: NextRequest) {
  // Gracefully skip if FatSecret env vars not configured
  if (!process.env.FATSECRET_CLIENT_ID || !process.env.FATSECRET_CLIENT_SECRET) {
    return NextResponse.json(null);
  }

  const barcode = req.nextUrl.searchParams.get("barcode");
  if (!barcode) {
    return NextResponse.json(null, { status: 400 });
  }

  try {
    const token = await getFatSecretToken();

    // Step 1: resolve barcode → food_id
    const idRes = await fetch(
      `https://platform.fatsecret.com/rest/server.api?method=food.find_id_for_barcode&barcode=${encodeURIComponent(
        barcode
      )}&format=json`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );

    if (!idRes.ok) return NextResponse.json(null);

    const idData = (await idRes.json()) as {
      food_id?: { value?: string };
    };
    const foodId = idData?.food_id?.value;
    if (!foodId) return NextResponse.json(null);

    // Step 2: get food details
    const foodRes = await fetch(
      `https://platform.fatsecret.com/rest/server.api?method=food.get.v4&food_id=${encodeURIComponent(
        foodId
      )}&format=json`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );

    if (!foodRes.ok) return NextResponse.json(null);

    const foodData = (await foodRes.json()) as { food?: FatSecretFood };
    const food = foodData?.food;
    if (!food) return NextResponse.json(null);

    // Pick first serving (can be array or object)
    const servingRaw = food.servings?.serving;
    const serving: FatSecretServing | undefined = Array.isArray(servingRaw)
      ? servingRaw[0]
      : servingRaw;

    return NextResponse.json({
      name: food.food_name ?? "",
      brand: food.brand_name ?? "",
      category: food.food_type ?? "",
      quantity: serving?.serving_description ?? "",
      unit: "g",
      image_url: null,
      nutrients: serving
        ? {
            calories: serving.calories ? Number(serving.calories) : null,
            protein: serving.protein ? Number(serving.protein) : null,
            carbohydrates: serving.carbohydrate
              ? Number(serving.carbohydrate)
              : null,
            fat: serving.fat ? Number(serving.fat) : null,
            fiber: serving.fiber ? Number(serving.fiber) : null,
            sodium: serving.sodium ? Number(serving.sodium) : null,
          }
        : null,
    });
  } catch (err) {
    console.error("[FatSecret] lookup error:", err);
    return NextResponse.json(null);
  }
}
