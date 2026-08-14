import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const contentRoot = path.join(projectRoot, "src/content");

const requiredFiles = [
  "site/global.md",
  "pages/home.md",
  "pages/about.md",
  "pages/research.md",
  "pages/people.md",
  "pages/404.md",
];

const forbiddenPatterns = [
  { pattern: /가나다라/, label: "임시 가나다라 문구" },
  { pattern: /여기에\s*(?:설명|내용)?\s*입력/, label: "입력 안내용 임시 문구" },
  { pattern: /\b(?:TODO|TBD|FIXME)\b/i, label: "작업용 표시" },
];

const errors = [];

async function walkMarkdown(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return walkMarkdown(target);
      return entry.isFile() && entry.name.endsWith(".md") ? [target] : [];
    }),
  );

  return files.flat();
}

function relativeContentPath(file) {
  return path.relative(contentRoot, file).split(path.sep).join("/");
}

function splitMarkdown(source, file) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) {
    errors.push(`${relativeContentPath(file)}: 올바른 YAML frontmatter가 필요합니다.`);
    return { frontmatter: "", body: "" };
  }

  return { frontmatter: match[1], body: match[2].trim() };
}

function scalar(frontmatter, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `^${escapedKey}:\\s*(?:"([^"]*)"|'([^']*)'|([^#\\r\\n]+?))\\s*(?:#.*)?$`,
    "m",
  );
  const match = frontmatter.match(pattern);
  return match ? (match[1] ?? match[2] ?? match[3]).trim() : undefined;
}

function reportDuplicates(items, label) {
  const seen = new Map();
  for (const { value, file } of items) {
    if (value === undefined) continue;
    const first = seen.get(value);
    if (first) {
      errors.push(
        `${relativeContentPath(file)}: ${label} "${value}"이(가) ${relativeContentPath(first)}와 중복됩니다.`,
      );
    } else {
      seen.set(value, file);
    }
  }
}

for (const requiredFile of requiredFiles) {
  try {
    await access(path.join(contentRoot, requiredFile));
  } catch {
    errors.push(`${requiredFile}: 필수 콘텐츠 파일이 없습니다.`);
  }
}

const markdownFiles = await walkMarkdown(contentRoot);
const projectCodes = [];
const projectOrders = [];
const memberNames = [];

for (const file of markdownFiles) {
  const source = await readFile(file, "utf8");
  const relativePath = relativeContentPath(file);
  const { frontmatter, body } = splitMarkdown(source, file);

  for (const { pattern, label } of forbiddenPatterns) {
    if (pattern.test(source)) {
      errors.push(`${relativePath}: ${label}가 남아 있습니다.`);
    }
  }

  if (relativePath.startsWith("pages/")) {
    const expectedPage = path.basename(file, ".md");
    const actualPage = scalar(frontmatter, "page");
    if (actualPage !== expectedPage) {
      errors.push(
        `${relativePath}: page 값은 파일명과 같은 "${expectedPage}"이어야 합니다.`,
      );
    }
  }

  if (relativePath === "pages/about.md" && !body) {
    errors.push(`${relativePath}: 연구실 소개 본문이 비어 있습니다.`);
  }

  if (relativePath.startsWith("projects/")) {
    if (!body) errors.push(`${relativePath}: 프로젝트 본문이 비어 있습니다.`);
    projectCodes.push({ value: scalar(frontmatter, "code"), file });
    projectOrders.push({ value: scalar(frontmatter, "order"), file });
  }

  if (relativePath.startsWith("members/")) {
    memberNames.push({ value: scalar(frontmatter, "name"), file });
    const photo = scalar(frontmatter, "photo");
    if (photo?.startsWith("/")) {
      try {
        await access(path.join(projectRoot, "public", photo.slice(1)));
      } catch {
        errors.push(`${relativePath}: 사진 파일 ${photo}을(를) 찾을 수 없습니다.`);
      }
    }
  }
}

reportDuplicates(projectCodes, "프로젝트 코드");
reportDuplicates(projectOrders, "프로젝트 표시 순서");
reportDuplicates(memberNames, "구성원 이름");

if (errors.length > 0) {
  console.error("Content validation failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Content validation passed (${markdownFiles.length} Markdown files).`);
}
