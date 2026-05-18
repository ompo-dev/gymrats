import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  gymMembershipFindFirstMock,
  studentPersonalAssignmentFindFirstMock,
  gymPersonalAffiliationFindFirstMock,
  gymPersonalAffiliationFindManyMock,
} = vi.hoisted(() => ({
  gymMembershipFindFirstMock: vi.fn(),
  studentPersonalAssignmentFindFirstMock: vi.fn(),
  gymPersonalAffiliationFindFirstMock: vi.fn(),
  gymPersonalAffiliationFindManyMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    gymMembership: {
      findFirst: (...args: unknown[]) => gymMembershipFindFirstMock(...args),
    },
    studentPersonalAssignment: {
      findFirst: (...args: unknown[]) =>
        studentPersonalAssignmentFindFirstMock(...args),
    },
    gymPersonalAffiliation: {
      findFirst: (...args: unknown[]) =>
        gymPersonalAffiliationFindFirstMock(...args),
      findMany: (...args: unknown[]) => gymPersonalAffiliationFindManyMock(...args),
    },
  },
}));

import {
  assertActorCanAccessTrainingLibraryPlan,
  filterVisibleTrainingLibraryPlansForActor,
  resolveAuthorizedTrainingLibraryStudentId,
  TrainingLibraryAccessError,
} from "./training-library-access.service";

describe("training-library-access.service", () => {
  beforeEach(() => {
    gymMembershipFindFirstMock.mockReset();
    studentPersonalAssignmentFindFirstMock.mockReset();
    gymPersonalAffiliationFindFirstMock.mockReset();
    gymPersonalAffiliationFindManyMock.mockReset();
  });

  it("forces STUDENT context to own studentId", async () => {
    const auth = {
      user: {
        role: "STUDENT",
        student: { id: "student_owner" },
      },
    } as never;

    const result = await resolveAuthorizedTrainingLibraryStudentId(
      auth,
      "student_other",
    );

    expect(result).toBe("student_owner");
    expect(gymMembershipFindFirstMock).not.toHaveBeenCalled();
  });

  it("blocks GYM access when membership is not active", async () => {
    gymMembershipFindFirstMock.mockResolvedValue(null);

    const auth = {
      user: {
        role: "GYM",
        activeGymId: "gym_1",
        gyms: [{ id: "gym_1" }],
      },
    } as never;

    await expect(
      resolveAuthorizedTrainingLibraryStudentId(auth, "student_1"),
    ).rejects.toMatchObject({
      code: "TRAINING_LIBRARY_ACCESS_DENIED",
      status: 403,
    });
  });

  it("allows GYM access only with active membership", async () => {
    gymMembershipFindFirstMock.mockResolvedValue({ id: "membership_1" });

    const auth = {
      user: {
        role: "GYM",
        activeGymId: "gym_1",
        gyms: [{ id: "gym_1" }],
      },
    } as never;

    const result = await resolveAuthorizedTrainingLibraryStudentId(
      auth,
      "student_1",
    );

    expect(result).toBe("student_1");
  });

  it("blocks PERSONAL access to gym-created plan without active affiliation", async () => {
    studentPersonalAssignmentFindFirstMock.mockResolvedValue({ id: "assignment_1" });
    gymPersonalAffiliationFindFirstMock.mockResolvedValue(null);

    const auth = {
      user: {
        role: "PERSONAL",
        personal: { id: "personal_1" },
      },
    } as never;

    await expect(
      assertActorCanAccessTrainingLibraryPlan(
        auth,
        {
          studentId: "student_1",
          createdById: "gym_1",
          creatorType: "GYM",
        },
        "detail",
      ),
    ).rejects.toMatchObject({
      code: "TRAINING_LIBRARY_ACCESS_DENIED",
      status: 403,
    });
  });

  it("filters PERSONAL list to gym plans with active affiliation", async () => {
    gymPersonalAffiliationFindManyMock.mockResolvedValue([{ gymId: "gym_1" }]);

    const auth = {
      user: {
        role: "PERSONAL",
        personal: { id: "personal_1" },
      },
    } as never;

    const plans = [
      { id: "p1", creatorType: "GYM", createdById: "gym_1" },
      { id: "p2", creatorType: "GYM", createdById: "gym_2" },
      { id: "p3", creatorType: "PERSONAL", createdById: "personal_1" },
    ];

    const visible = await filterVisibleTrainingLibraryPlansForActor(auth, plans);

    expect(visible).toEqual([
      { id: "p1", creatorType: "GYM", createdById: "gym_1" },
      { id: "p3", creatorType: "PERSONAL", createdById: "personal_1" },
    ]);
  });
});