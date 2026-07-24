import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const lab = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/lab" }),
  schema: z.object({
    title: z.string(),
    eyebrow: z.string(),
    heroLines: z
      .array(
        z.object({
          word: z.string(),
          suffix: z.string().default(""),
          annotation: z.string(),
        }),
      )
      .length(3),
    lead: z.string(),
    statement: z.string(),
    principles: z.array(
      z.object({
        title: z.string(),
        label: z.string(),
        description: z.string(),
      }),
    ),
    facts: z.array(
      z.object({
        label: z.string(),
        value: z.string(),
      }),
    ),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    titleEn: z.string(),
    summary: z.string(),
    code: z.string(),
    year: z.string(),
    phase: z.enum(["Ongoing", "Exploration", "Archive"]),
    tags: z.array(z.string()),
    visual: z.enum(["orbit", "grid", "wave"]),
    featured: z.boolean().default(false),
    order: z.number().int().nonnegative(),
  }),
});

const members = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/members" }),
  schema: z.object({
    name: z.string(),
    nameEn: z.string(),
    monogram: z.string().max(4).optional(),
    photo: z.string().optional(),
    interests: z.array(z.string()),
    order: z.number().int().nonnegative(),
    positions: z
      .array(
        z.object({
          year: z.number().int().min(2000),
          role: z.string(),
          group: z.enum(["faculty", "researcher", "student", "alumni"]),
          level: z.enum(["leadership", "member"]).default("member"),
        }),
      )
      .min(1)
      .refine(
        (positions) =>
          new Set(positions.map(({ year }) => year)).size === positions.length,
        "한 구성원에게 같은 연도의 역할을 두 번 지정할 수 없습니다.",
      ),
    github: z.url().optional(),
    website: z.url().optional(),
    email: z.email().optional(),
  }),
});

export const collections = { lab, projects, members };
