import { drizzle } from "drizzle-orm/node-postgres";
import { config } from "./index.ts";

const { DATABASE_URL } = config;

const db = drizzle(DATABASE_URL!);

export default db;
