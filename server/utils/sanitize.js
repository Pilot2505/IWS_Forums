import sanitizeHtml from "sanitize-html";

// Function to sanitize rich text input, allowing only specific tags and attributes

export const sanitizeRichText = (value) => {
  if (typeof value !== "string") return "";

  return sanitizeHtml(value, {
    allowedTags: [
      "p",
      "br",
      "b",
      "strong",
      "i",
      "em",
      "u",
      "s",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "pre",
      "a",
      "img",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "span",
      "div",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title"],
      span: ["style"],
      div: ["style"],
      p: ["style"],
      code: ["class"],
      pre: ["class"],
    },
    allowedSchemes: ["http", "https", "data"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
};