export const blockedWords = ["dm", "vcl", "chửi_bậy"];

export const escapeRegExp = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function containsBlockedWord(text = "", words = blockedWords) {
    const normalizedText = text.toLowerCase();

    return words.some((word) => {
        const pattern = new RegExp(`\\b${escapeRegExp(word.toLowerCase())}\\b`, "i");
        return pattern.test(normalizedText);
    });
}

export function cleanBlockedWords(
    text = "",
    words = blockedWords,
    replacement = "[censored]"
    ) {
    return words.reduce((result, word) => {
        const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, "gi");
        return result.replace(pattern, replacement);
    }, text);
}