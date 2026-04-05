import { NextResponse } from "next/server";
import { queryCharacterFeed } from "@/lib/queries/content";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const skip = parseInt(searchParams.get("skip") || "0", 10);
  const take = parseInt(searchParams.get("take") || "10", 10);
  const categorySlug = searchParams.get("categorySlug") || undefined;
  const sort = searchParams.get("sort") || "recent";
  const genderParam = searchParams.get("gender");
  const q = searchParams.get("q") || undefined;
  const allowNsfw = searchParams.get("nsfw") === "true";

  try {
    const orderBy = sort === "trending" ? "trending" : "recent";
    const gender =
      genderParam === "Male" || genderParam === "Female" ? genderParam : undefined;

    const characters = await queryCharacterFeed({
      skip,
      take,
      orderBy,
      categorySlug,
      gender,
      isNsfw: allowNsfw ? true : false,
      searchQuery: q,
    });

    return NextResponse.json({ characters });
  } catch (error) {
    console.error("Error fetching characters:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
