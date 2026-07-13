import { drizzle } from "drizzle-orm/node-postgres";
import { relations } from "../db/relations.ts";
import { config } from "./index.ts";

const { DATABASE_URL } = config;

const db = drizzle(DATABASE_URL!, {
	relations,
});

export default db;
