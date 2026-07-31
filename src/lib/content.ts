import { getCollection, type CollectionEntry } from "astro:content";
import { sortMembers } from "./member-sort";

type OrderedEntry = { data: { order: number } };

const byOrder = <T extends OrderedEntry>(a: T, b: T) =>
  a.data.order - b.data.order;

export async function getLabProfile(): Promise<CollectionEntry<"lab">> {
  const entries = await getCollection("lab");
  const profile = entries.find(({ id }) => id === "about") ?? entries[0];

  if (!profile) {
    throw new Error("src/content/lab에 연구실 소개 Markdown이 필요합니다.");
  }

  return profile;
}

export async function getProjects() {
  const entries = await getCollection("projects");
  return entries.sort(byOrder);
}

export async function getFeaturedProjects() {
  const entries = await getProjects();
  return entries.filter(({ data }) => data.featured);
}

export async function getMembers() {
  const entries = await getCollection("members");
  return sortMembers(entries);
}
