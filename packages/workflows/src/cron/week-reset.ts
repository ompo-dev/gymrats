import { db } from "@gymrats/db";

export async function resetStudentWeeklyOverride() {
  const result = await db.student.updateMany({
    data: { weekOverride: null },
  });

  return {
    success: true,
    affectedRows: result.count,
    message: "Week reset cron executed",
  };
}
