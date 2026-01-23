import { gymsRoutes } from "@back-end/src/server/routes/gyms";
import { studentsRoutes } from "@back-end/src/server/routes/students";

export const academiesRoutes = {
  gyms: gymsRoutes,
  students: studentsRoutes,
};
