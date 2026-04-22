export function stripHtml(html = "") {
    if (!html) return "";

    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
}

export function getPreviewText(html = "", maxLength = 220) {
    const text = stripHtml(html);

    if (text.length <= maxLength) {
        return text;
    }

    return `${text.slice(0, maxLength).trimEnd()}...`;
}