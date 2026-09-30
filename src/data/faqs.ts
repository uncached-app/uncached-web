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
    answer: "Uncached verifies the target against the current scan session, then moves it to your native Trash or Recycle Bin by default. You can restore it there if a build needs it again."
  },
  {
    question: "Which targets are supported now?",
    answer: "The current scanner set covers node_modules, Rust target directories, Python caches, .gradle, .next, and .turbo. Coverage will expand as new scanners are implemented."
  },
  {
    question: "Is Uncached available to download?",
    answer: "Yes. The free tier is a public download for macOS and Linux, and needs no account. Windows comes later, through the Microsoft Store. Pro adds the deeper cleaners at $19.90 a year or $89.90 once."
  },
  {
    question: "Does Uncached upload workspace data?",
    answer: "The scanner is designed to run locally. It works with workspace paths and target data on your machine rather than requiring project contents in the cloud."
  },
  {
    question: "What is included in the free tier?",
    answer: "The manual scan and cleanup flow, with measured sizes shown before anything moves and Trash as the default. The safety checks that run before a deletion are free in every tier and always will be."
  },
  {
    question: "Who is Uncached for?",
    answer: "Developers maintaining local workspaces who want to reclaim build and dependency artifacts without manually hunting through folders."
  }
];
