/**
 * Use Case: Get Student Info
 * Busca informações básicas do student (dados demográficos e identidade).
 */

import { db } from "@/lib/db";

export interface GetStudentInfoInput {
  studentId: string;
}

export interface GetStudentInfoOutput {
  id: string;
  age: number | null;
  gender: string | null;
  phone: string | null;
  avatar: string | null;
  isTrans: boolean;
  usesHormones: boolean;
  hormoneType: string | null;
}

export async function getStudentInfoUseCase(
  input: GetStudentInfoInput,
): Promise<GetStudentInfoOutput> {
  const { studentId } = input;

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      age: true,
      gender: true,
      phone: true,
      avatar: true,
      isTrans: true,
      usesHormones: true,
      hormoneType: true,
    },
  });

  if (!student) {
    return {
      id: studentId,
      age: null,
      gender: null,
      phone: null,
      avatar: null,
      isTrans: false,
      usesHormones: false,
      hormoneType: null,
    };
  }

  return {
    id: student.id,
    age: student.age,
    gender: student.gender,
    phone: student.phone,
    avatar: student.avatar,
    isTrans: student.isTrans ?? false,
    usesHormones: student.usesHormones ?? false,
    hormoneType: student.hormoneType || null,
  };
}
