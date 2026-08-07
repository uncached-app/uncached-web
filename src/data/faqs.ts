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
    answer: "Uncached is currently opening private early access. Join the list to hear when the free tier is ready for testers."
  },
  {
    question: "Does Uncached upload workspace data?",
    answer: "The scanner is designed to run locally. It works with workspace paths and target data on your machine rather than requiring project contents in the cloud."
  },
  {
    question: "What is included in early access?",
    answer: "Early access focuses on the free manual scan and cleanup flow. Future capabilities such as deeper cleaners, scheduled cleanup, and history will be announced separately when they are implemented."
  },
  {
    question: "Who is Uncached for?",
    answer: "Developers maintaining local workspaces who want to reclaim build and dependency artifacts without manually hunting through folders."
  }
];
