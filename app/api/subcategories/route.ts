import { NextResponse } from 'next/server';
import { fetchSubCategoriesByCategory } from '../../lib/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('category');

  if (!categoryId) {
    return NextResponse.json([]);
  }

  try {
    const subcategories = await fetchSubCategoriesByCategory(categoryId);
    return NextResponse.json(subcategories);
  } catch (error) {
    console.error('Failed to fetch subcategories via API route:', error);
    return NextResponse.json({ error: 'Failed to fetch subcategories' }, { status: 500 });
  }
}
