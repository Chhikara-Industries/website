export type ChangelogTag = "feature" | "improvement" | "fix" | "breaking"

export type ChangelogEntry = {
  version: string
  date: string
  title: string
  summary: string
  tags: ChangelogTag[]
  items: { type: ChangelogTag; text: string }[]
}

export const changelog: ChangelogEntry[] = []