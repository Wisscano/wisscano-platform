"use server";

import { db } from "@/db";
import { carouselConfigs } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateSchema = z.object({
  type: z.enum(["brands", "what_we_source", "services"]),
  direction: z.enum(["left", "right"]),
  speedPxPerSec: z.number().int().min(5).max(200),
  active: z.boolean(),
  pauseOnHover: z.boolean(),
});

export async function listCarouselConfigs() {
  await requireAdmin();
  return db.select().from(carouselConfigs);
}

/** Admin control for §6-8/§15 (and the bidirectional-drag enhancement): direction, speed and active state per carousel, no code changes required. */
export async function updateCarouselConfig(input: unknown) {
  await requireAdmin();
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };

  await db
    .update(carouselConfigs)
    .set({ direction: parsed.data.direction, speedPxPerSec: parsed.data.speedPxPerSec, active: parsed.data.active, pauseOnHover: parsed.data.pauseOnHover })
    .where(eq(carouselConfigs.type, parsed.data.type));

  revalidatePath("/");
  revalidatePath("/admin/carousels");
  return { ok: true };
}
