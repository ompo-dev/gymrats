
import { NextRequest, NextResponse } from "next/server";
import { muscleDatabase } from "@/lib/educational-data";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q")?.toLowerCase() || "";
  const muscleFilter = searchParams.get("muscle")?.toLowerCase() || "";
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  let allExercises: any[] = [];

  // Flatten exercises from muscleDatabase
  muscleDatabase.forEach((muscle) => {
    muscle.commonExercises.forEach((exName) => {
      allExercises.push({
        id: exName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""), // simple slug
        name: exName,
        primaryMuscles: [muscle.name], 
        group: muscle.group,
      });
    });
  });

  // Filter
  let filtered = allExercises;

  if (query) {
    filtered = filtered.filter((ex) => ex.name.toLowerCase().includes(query));
  }

  if (muscleFilter) {
    filtered = filtered.filter((ex) =>
      ex.group === muscleFilter ||
      ex.primaryMuscles.some((m: string) => m.toLowerCase().includes(muscleFilter))
    );
  }

  // Deduplicate by Name (case insensitive check effectively done by using same name source)
  const seen = new Set();
  const uniqueFiltered = [];
  for (const ex of filtered) {
    if (!seen.has(ex.name)) {
      seen.add(ex.name);
      uniqueFiltered.push(ex);
    }
  }

  const total = uniqueFiltered.length;
  const paginated = uniqueFiltered.slice(offset, offset + limit);

  return NextResponse.json({
    exercises: paginated,
    total,
  });
}
