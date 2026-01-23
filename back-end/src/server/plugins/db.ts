import { Elysia } from "elysia";
import { db } from "@/lib/db";

export const dbPlugin = new Elysia({ name: "db" }).decorate("db", db);
