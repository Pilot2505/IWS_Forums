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

export function parseTagsValue(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parseTagsValue(parsed);
      }
    } catch {
      return value
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);
    }
  }

  return [];
}

export function normalizeTagsInput(value = "") {
  return [...new Set(parseTagsValue(value))].slice(0, 10);
}

export function formatTagLabel(tag = "") {
  const normalized = String(tag).trim();

  if (!normalized) {
    return "";
  }

  if (normalized.length <= 3) {
    return normalized.toUpperCase();
  }

  return normalized
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getCategoryLabel(category) {
  if (!category) {
    return null;
  }

  return categoryLabels[category] || formatTagLabel(category);
}

export function getMatchingInterestTags(tags = [], interests = []) {
  const normalizedTags = parseTagsValue(tags);
  const normalizedInterests = Array.isArray(interests)
    ? interests.map((interest) => String(interest).trim().toLowerCase()).filter(Boolean)
    : [];

  if (normalizedTags.length === 0 || normalizedInterests.length === 0) {
    return [];
  }

  const matchedKeywords = normalizedInterests.flatMap((interest) => categoryKeywords[interest] || []);

  if (matchedKeywords.length === 0) {
    return [];
  }

  return normalizedTags.filter((tag) =>
    matchedKeywords.some((keyword) => tag.includes(keyword) || keyword.includes(tag))
  );
}
