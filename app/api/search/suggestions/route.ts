import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";

type Suggestion = {
  product_id: string;
  name: string;
  price: number;
  photos: string[] | null;
  brand_name: string | null;
  category_name: string | null;
  colour: string | null;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const like = `%${query}%`;
  const suggestions = await getDb()<Suggestion[]>`
    SELECT
      p.product_id,
      p.name,
      p.price,
      p.photos,
      b.name AS brand_name,
      c.name AS category_name,
      p.colour
    FROM products p
    LEFT JOIN brands b ON b.brand_id = p.brand_id
    LEFT JOIN categories c ON c.category_id = p.category_id
    WHERE
      p.name ILIKE ${like}
      OR b.name ILIKE ${like}
      OR c.name ILIKE ${like}
      OR p.colour ILIKE ${like}
      OR p.size ILIKE ${like}
    ORDER BY
      CASE
        WHEN p.name ILIKE ${query + "%"} THEN 0
        WHEN p.name ILIKE ${like} THEN 1
        ELSE 2
      END,
      p.created_at DESC
    LIMIT 6
  `;

  return NextResponse.json({ suggestions });
}
