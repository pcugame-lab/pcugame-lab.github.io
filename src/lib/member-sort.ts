export type MemberLevel = "leadership" | "member";

export interface MemberPosition {
  year: number;
  role: string;
  level: MemberLevel;
}

export interface SortableMember {
  id?: string;
  data: {
    name: string;
    nameEn: string;
    positions: readonly MemberPosition[];
  };
}

export interface PositionedMember {
  member: SortableMember;
  position: MemberPosition;
}

export interface RolePriority {
  key: string;
  aliases: readonly string[];
}

export interface MemberSortPolicy {
  locales: string | readonly string[];
  rolePriorities: readonly RolePriority[];
  getName: (member: SortableMember) => string;
  getFallbackName: (member: SortableMember) => string;
}

/**
 * 표시 언어나 직책명이 늘어나면 이 정책만 확장하면 된다.
 * 화면에서는 순번을 입력받지 않고 직책의 의미와 이름으로 순서를 결정한다.
 */
export const defaultMemberSortPolicy = {
  locales: ["ko-KR", "en"],
  rolePriorities: [
    {
      key: "director",
      aliases: ["연구실장", "Lab Director", "Director"],
    },
    {
      key: "deputy-director",
      aliases: [
        "부연구실장",
        "Deputy Lab Director",
        "Vice Lab Director",
        "Associate Lab Director",
      ],
    },
  ],
  getName: (member) => member.data.name,
  getFallbackName: (member) => member.data.nameEn,
} as const satisfies MemberSortPolicy;

const normalizeRole = (role: string) =>
  role.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase();

function getLocales(locales: MemberSortPolicy["locales"]) {
  return typeof locales === "string" ? locales : [...locales];
}

export function createPositionedMemberComparator(
  policy: MemberSortPolicy = defaultMemberSortPolicy,
) {
  const collator = new Intl.Collator(getLocales(policy.locales), {
    usage: "sort",
    sensitivity: "base",
    numeric: true,
    ignorePunctuation: true,
  });
  const roleRanks = new Map<string, number>();

  policy.rolePriorities.forEach(({ aliases }, rank) => {
    aliases.forEach((alias) => roleRanks.set(normalizeRole(alias), rank));
  });

  const getRoleRank = ({ role, level }: MemberPosition) => {
    const explicitRank = roleRanks.get(normalizeRole(role));

    if (explicitRank !== undefined) return explicitRank;
    if (level === "leadership") return policy.rolePriorities.length;
    return policy.rolePriorities.length + 1;
  };

  return (a: PositionedMember, b: PositionedMember) => {
    const roleComparison = getRoleRank(a.position) - getRoleRank(b.position);
    if (roleComparison !== 0) return roleComparison;

    const nameComparison = collator.compare(
      policy.getName(a.member),
      policy.getName(b.member),
    );
    if (nameComparison !== 0) return nameComparison;

    const fallbackNameComparison = collator.compare(
      policy.getFallbackName(a.member),
      policy.getFallbackName(b.member),
    );
    if (fallbackNameComparison !== 0) return fallbackNameComparison;

    return collator.compare(a.member.id ?? "", b.member.id ?? "");
  };
}

export function getLatestMemberPosition(member: SortableMember) {
  const [firstPosition, ...remainingPositions] = member.data.positions;

  if (!firstPosition) {
    throw new Error(`${member.data.name} 구성원에게 직책 이력이 필요합니다.`);
  }

  return remainingPositions.reduce(
    (latest, position) =>
      position.year > latest.year ? position : latest,
    firstPosition,
  );
}

export function sortPositionedMembers<T extends PositionedMember>(
  members: readonly T[],
  policy: MemberSortPolicy = defaultMemberSortPolicy,
) {
  const compare = createPositionedMemberComparator(policy);
  return [...members].sort(compare);
}

export function sortMembers<T extends SortableMember>(
  members: readonly T[],
  policy: MemberSortPolicy = defaultMemberSortPolicy,
) {
  const positionedMembers = members.map((member) => ({
    member,
    position: getLatestMemberPosition(member),
  }));
  const compare = createPositionedMemberComparator(policy);

  return positionedMembers.sort(compare).map(({ member }) => member);
}
