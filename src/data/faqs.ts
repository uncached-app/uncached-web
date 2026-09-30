export interface Faq {
  question: string;
  answer: string;
}

/**
 * Single source for the FAQ. Rendered by FaqSection and emitted as FAQPage
 * JSON-LD from index.astro — keep both in sync by importing from here.
 */
export const faqs: Faq[] = [
  {
    question: "What happens when I clean a target?",
    answer: "Uncached checks the target again against the scan that found it, then moves it to the system Trash. If a build needs it, put it back from there, or run the restore command the project page shows."
  },
  {
    question: "What does it find?",
    answer: "Dependency, build and cache folders a toolchain can rebuild, each confirmed by the project file beside it, never a folder that only has the right name. Coverage grows with every release, and the app lists exactly what it found."
  },
  {
    question: "How does it know a project is safe to clean?",
    answer: "It reads the project's git state. Uncommitted files, commits on no remote, forgotten stashes and branches with no upstream mark it Protect. A remote on the same disk does not count, because one failure takes both."
  },
  {
    question: "Does Uncached upload anything?",
    answer: "No. Scanning, verdicts, dependency readings and history run on your machine, with no account. The only network requests are the update check and, when you ask for one, a git fetch."
  },
  {
    question: "What is free and what is Pro?",
    answer: "Free reclaims every artifact of every project, with every safety check and verdict, and no limits, and flags the secrets Git would publish. Pro adds maintenance that runs on its own, including when the disk runs low, the unused toolchain versions one by one, duplicate insights, history and Dock icons, at $4.99 a year or $14.99 once."
  },
  {
    question: "Does Uncached read my secrets?",
    answer: "It reads the file names Git lists and, only for a .pem, .key, .npmrc or .pypirc, the first few kilobytes, to tell a private key or a literal token from a harmless file. Nothing is stored or sent anywhere: the project page shows the file and the command that stops Git from publishing it."
  },
  {
    question: "Which systems does it run on?",
    answer: "macOS (Apple Silicon and Intel, signed and notarised) and Linux. Windows comes later, through the Microsoft Store."
  }
];
