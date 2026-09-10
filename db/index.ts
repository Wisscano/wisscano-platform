   import { drizzle } from "drizzle-orm/neon-http";
   import { neon } from "@neondatabase/serverless";
   import * as schema from "./schema";

   if (!process.env.DATABASE_URL) {
     throw new Error(
       "DATABASE_URL is not set. Copy .env.example to .env and point it at your Neon Postgres instance."
     );
   }

   const sql = neon(process.env.DATABASE_URL);

   /** Single shared Drizzle client. Import `db` anywhere server-side data access is needed. */
   export const db = drizzle(sql, { schema });
   export type Database = typeof db;