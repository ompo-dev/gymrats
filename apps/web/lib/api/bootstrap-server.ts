import type { BootstrapResponse } from "@gymrats/types/bootstrap";
import {
  readGymBootstrap,
  readPersonalBootstrap,
  readStudentBootstrap,
} from "@/lib/actions/bootstrap-readers";
import type { GymDataSection, GymUnifiedData } from "@/lib/types/gym-unified";
import type {
  PersonalDataSection,
  PersonalUnifiedData,
} from "@/lib/types/personal-unified";
import type {
  StudentData,
  StudentDataSection,
} from "@/lib/types/student-unified";

export async function getStudentBootstrapServerRequest(
  sections?: readonly StudentDataSection[],
) {
  return readStudentBootstrap(sections) as Promise<
    BootstrapResponse<Partial<StudentData>>
  >;
}

export async function getGymBootstrapServerRequest(
  sections?: readonly GymDataSection[],
) {
  return readGymBootstrap(sections) as Promise<
    BootstrapResponse<Partial<GymUnifiedData>>
  >;
}

export async function getPersonalBootstrapServerRequest(
  sections?: readonly PersonalDataSection[],
) {
  return readPersonalBootstrap(sections) as Promise<
    BootstrapResponse<Partial<PersonalUnifiedData>>
  >;
}
