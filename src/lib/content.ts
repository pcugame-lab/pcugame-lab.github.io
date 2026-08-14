import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import { sortMembers } from "./member-sort";

type OrderedEntry = { data: { order: number } };

const byOrder = <T extends OrderedEntry>(a: T, b: T) =>
  a.data.order - b.data.order;

type PageEntry = CollectionEntry<"pages">;
type PageData = PageEntry["data"];
type PageId = PageData["page"];
type PageEntryFor<T extends PageId> = Omit<PageEntry, "data"> & {
  data: Extract<PageData, { page: T }>;
};

export async function getSiteContent(): Promise<CollectionEntry<"site">> {
  const content = await getEntry("site", "global");

  if (!content) {
    throw new Error("src/content/site/global.md 파일이 필요합니다.");
  }

  return content;
}

export async function getPageContent<T extends PageId>(
  page: T,
): Promise<PageEntryFor<T>> {
  const content = await getEntry("pages", page);

  if (!content) {
    throw new Error(`src/content/pages/${page}.md 파일이 필요합니다.`);
  }

  if (content.data.page !== page) {
    throw new Error(
      `src/content/pages/${page}.md의 page 값은 "${page}"이어야 합니다.`,
    );
  }

  return content as PageEntryFor<T>;
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
