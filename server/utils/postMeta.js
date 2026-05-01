const categoryKeywords = {
  javascript: ["javascript", "js", "node", "react", "vue", "angular", "typescript"],
  python: ["python", "django", "flask", "fastapi", "pandas", "numpy"],
  java: ["java", "spring", "maven", "gradle", "jvm", "kotlin"],
  cpp: ["c++", "cpp", "c language", "pointer", "memory management"],
  web: ["html", "css", "web", "frontend", "backend", "http", "api", "rest"],
  mobile: ["mobile", "android", "ios", "flutter", "react native", "swift"],
  database: ["sql", "mysql", "postgresql", "mongodb", "database", "nosql", "redis"],
  devops: ["devops", "docker", "kubernetes", "ci/cd", "jenkins", "nginx", "linux"],
  ai_ml: ["ai", "machine learning", "ml", "deep learning", "neural", "tensorflow", "pytorch", "llm"],
  security: ["security", "cybersecurity", "encryption", "firewall", "vulnerability", "hacking"],
  cloud: ["aws", "azure", "gcp", "cloud", "serverless", "s3", "lambda"],
  opensource: ["open source", "github", "git", "contribution", "license"],
};

export const categoryLabels = {
  javascript: "JavaScript",
  python: "Python",
  java: "Java",
  cpp: "C / C++",
  web: "Web Development",
  mobile: "Mobile Development",
  database: "Database",
  devops: "DevOps",
  ai_ml: "AI / Machine Learning",
  security: "Cybersecurity",
  cloud: "Cloud Computing",
  opensource: "Open Source",
};

export function normalizeTags(tags = []) {
  const values = Array.isArray(tags) ? tags : String(tags).split(",");

  return [
    ...new Set(
      values
        .map((value) => String(value).trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 10)
    ),
  ];
}

export function parseTagsValue(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return normalizeTags(value);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return normalizeTags(parsed);
      }
    } catch {
      return normalizeTags(value);
    }
  }

  return [];
}

export function derivePrimaryCategory(tags = []) {
  const normalizedTags = normalizeTags(tags);

  for (const [categoryId, keywords] of Object.entries(categoryKeywords)) {
    if (
      normalizedTags.some((tag) =>
        keywords.some((keyword) => tag.includes(keyword) || keyword.includes(tag))
      )
    ) {
      return categoryId;
    }
  }

  return null;
}

export function enrichPostRow(row) {
  const tags = parseTagsValue(row.tags);
  const primaryCategory = derivePrimaryCategory(tags);

  return {
    ...row,
    tags,
    primary_category: primaryCategory,
    primary_category_label: primaryCategory ? categoryLabels[primaryCategory] || primaryCategory : null,
    is_bookmarked: Boolean(row.is_bookmarked),
  };
}
