"use server";

import { db } from "@/db";
import { procurementRequests, brands, procurementCategories, services } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { sql } from "drizzle-orm";

export async function getDashboardStats() {
  await requireAdmin();

  const [statusCounts, contentCounts] = await Promise.all([
    db
      .select({ status: procurementRequests.status, count: sql<number>`count(*)::int` })
      .from(procurementRequests)
      .groupBy(procurementRequests.status),
    Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(brands),
      db.select({ count: sql<number>`count(*)::int` }).from(procurementCategories),
      db.select({ count: sql<number>`count(*)::int` }).from(services),
    ]),
  ]);

const [brandRows, categoryRows, serviceRows] = contentCounts;
const brandCount = brandRows[0]?.count ?? 0;
const categoryCount = categoryRows[0]?.count ?? 0;
const serviceCount = serviceRows[0]?.count ?? 0;

  return {
    statusCounts, // e.g. [{status:'new', count:4}, {status:'sourcing', count:2}, ...]
    brandCount,
    categoryCount,
    serviceCount,
    newRequestsCount: statusCounts.find((s) => s.status === "new")?.count ?? 0,
  };
}
