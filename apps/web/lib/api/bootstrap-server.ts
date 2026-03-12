import type { BootstrapResponse } from "@gymrats/types/bootstrap";
import { serverApiGet } from "@/lib/api/server";
import type {
  StudentData,
  StudentDataSection,
} from "@/lib/types/student-unified";

function buildSectionsQuery(sections?: readonly string[]) {
  if (!sections || sections.length === 0) {
    return "";
  }

  const params = new URLSearchParams({
    sections: sections.join(","),
  });

  return `?${params.toString()}`;
}

export async function getStudentBootstrapServerRequest(
  sections?: readonly StudentDataSection[],
) {
  return serverApiGet<BootstrapResponse<Partial<StudentData>>>(
    `/api/students/bootstrap${buildSectionsQuery(sections)}`,
  );
}
