import { Elysia } from "elysia";
import { authRolesMacro } from "../plugins/auth-roles";
import {
  addWeightHandler,
  getAllStudentDataHandler,
  getDayPassesHandler,
  getFriendsHandler,
  getPersonalRecordsHandler,
  getStudentInfoHandler,
  getStudentProfileHandler,
  getStudentProgressHandler,
  getWeightHistoryFilteredHandler,
  getWeightHistoryHandler,
  updateStudentProfileHandler,
  updateStudentProgressHandler,
} from "../handlers/students";

export const studentsRoutes = new Elysia()
  .use(authRolesMacro)
  .get(
    "/all",
    ({ set, query, studentId, userId }) =>
      getAllStudentDataHandler({ set, query, studentId, userId }),
    { requireStudent: true }
  )
  .get(
    "/profile",
    ({ set, studentId, userId }) =>
      getStudentProfileHandler({ set, studentId, userId }),
    { requireStudent: true }
  )
  .post(
    "/profile",
    ({ set, body, studentId, userId }) =>
      updateStudentProfileHandler({ set, body, studentId, userId }),
    { requireStudent: true }
  )
  .get(
    "/weight",
    ({ set, query, studentId, userId }) =>
      getWeightHistoryHandler({ set, query, studentId, userId }),
    { requireStudent: true }
  )
  .post(
    "/weight",
    ({ set, body, studentId, userId }) =>
      addWeightHandler({ set, body, studentId, userId }),
    { requireStudent: true }
  )
  .get(
    "/weight-history",
    ({ set, query, studentId, userId }) =>
      getWeightHistoryFilteredHandler({ set, query, studentId, userId }),
    { requireStudent: true }
  )
  .get(
    "/progress",
    ({ set, studentId, userId }) =>
      getStudentProgressHandler({ set, studentId, userId }),
    { requireStudent: true }
  )
  .put(
    "/progress",
    ({ set, body, studentId, userId }) =>
      updateStudentProgressHandler({ set, body, studentId, userId }),
    { requireStudent: true }
  )
  .get(
    "/student",
    ({ set, studentId, userId }) =>
      getStudentInfoHandler({ set, studentId, userId }),
    { requireStudent: true }
  )
  .get(
    "/personal-records",
    ({ set, studentId, userId }) =>
      getPersonalRecordsHandler({ set, studentId, userId }),
    { requireStudent: true }
  )
  .get(
    "/day-passes",
    ({ set, studentId, userId }) =>
      getDayPassesHandler({ set, studentId, userId }),
    { requireStudent: true }
  )
  .get(
    "/friends",
    ({ set, studentId, userId }) =>
      getFriendsHandler({ set, studentId, userId }),
    { requireStudent: true }
  );
