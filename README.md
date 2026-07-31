# LCL — Ludic Core Laboratory

재미의 핵심을 연구하는 Ludic Core Laboratory 소개 웹페이지입니다. Astro 기반의 정적 사이트이며, 연구실 소개·연구 프로젝트·구성원 정보는 Markdown으로 관리합니다.

## 시작하기

```bash
npm install
npm run dev
```

로컬 개발 서버는 기본적으로 `http://localhost:4321`에서 열립니다.

```bash
npm run check     # Astro/TypeScript 검사
npm run build     # dist/에 정적 사이트 생성
npm run validate  # 검사 후 프로덕션 빌드
```

## 콘텐츠 편집

코드를 수정하지 않고 아래 Markdown 파일의 frontmatter와 본문을 편집하면 됩니다.

| 콘텐츠 | 위치 | 렌더링 위치 |
| --- | --- | --- |
| 연구실 소개 | `src/content/lab/*.md` | 홈, 연구실 소개 |
| 연구/프로젝트 | `src/content/projects/*.md` | 홈, 연구 목록, 자동 생성 상세 페이지 |
| 구성원 | `src/content/members/*.md` | 홈, 구성원 소개 |

각 필드는 [`src/content.config.ts`](src/content.config.ts)의 스키마로 검증됩니다. 잘못된 필드나 URL은 빌드 단계에서 발견할 수 있습니다.

### 구성원 추가 예시

`src/content/members/이름.md` 파일을 추가합니다.

```md
---
name: "이름"
nameEn: "English Name"
photo: "/images/members/name.jpg"
interests:
  - "Game Design"
  - "Player Experience"
positions:
  - year: 2026
    role: "Researcher"
    group: "researcher"
    level: "member"
  - year: 2025
    role: "Student Researcher"
    group: "student"
    level: "member"
github: "https://github.com/username"
website: "https://example.com"
email: "name@example.com"
---

소개 문장을 Markdown으로 작성합니다.
```

`photo`, `github`, `website`, `email`은 선택 항목입니다. `photo`를 생략하면 구성원
사진 대신 연구실 아이콘이 표시됩니다. 사진 파일은 `public/images/members/`에 넣고
`/images/members/파일명.jpg`처럼 지정합니다. 값이 있는 링크만 구성원 카드에 표시됩니다.
`positions`에는 연도별 역할을 기록합니다. `level`은 연구실장처럼 조직도 상단에
배치할 때 `leadership`, 일반 구성원일 때 `member`를 사용합니다. 같은 구성원에게
동일한 연도를 두 번 지정하면 콘텐츠 검사에서 오류로 처리됩니다. 구성원 표시 순서는
별도의 `order` 값 없이 연구실장·부연구실장 등 특수 직책을 먼저 배치하고, 그 안에서는
이름의 가나다순으로 정합니다. 다국어 직책 별칭과 이름 정렬 기준은
`src/lib/member-sort.ts`의 정렬 정책에서 한곳에 관리합니다.

### 프로젝트 추가

`src/content/projects/*.md` 파일을 복사해 제목, 요약, 상태, 태그와 본문을 바꾸면 `/research/파일명/` 상세 페이지가 자동으로 생성됩니다. `visual`은 `orbit`, `grid`, `wave` 중 하나를 사용합니다.

## 구조

```text
src/
├── components/       재사용 가능한 UI 컴포넌트
├── config/           사이트명과 내비게이션 설정
├── content/          Markdown 콘텐츠
├── layouts/          공통 문서 레이아웃
├── lib/              콘텐츠 조회·정렬 로직
├── pages/            Astro 라우트
└── styles/           전역 스타일과 리셋
```

## 배포

`main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 Astro 사이트를 빌드해 GitHub Pages로 배포합니다. 저장소의 **Settings → Pages → Source**는 **GitHub Actions**로 설정해야 합니다.

현재 연구/소개 문구는 초기 사이트 구성을 위한 샘플입니다. 공개 전에 실제 연구 내용과 구성원 정보로 확인·교체하세요.
