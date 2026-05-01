import { Link } from "react-router-dom";
import { stripHtml } from "../../utils/content";
import { formatTagLabel, getMatchingInterestTags, parseTagsValue } from "../../utils/postMeta";

function getStoredInterestCategories() {
    if (typeof window === "undefined") {
        return [];
    }

    try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        return Array.isArray(storedUser.categories) ? storedUser.categories : [];
    } catch {
        return [];
    }
}

export default function PostCard({
    post,
    authorNode,
    meta,
    readMoreTo,
    children,
    className = "",
}) {
    const tags = parseTagsValue(post.tags);
    const userCategories = getStoredInterestCategories();
    const matchingTags = getMatchingInterestTags(tags, userCategories);
    const matchingTagSet = new Set(matchingTags);
    const orderedTags = [
        ...matchingTags,
        ...tags.filter((tag) => !matchingTagSet.has(tag)),
    ];

    return (
        <article className={`rounded-lg border border-gray-200 bg-white p-4 sm:p-6 ${className}`}>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <h3 className="text-xl font-semibold text-black sm:text-2xl">
                    <span dangerouslySetInnerHTML={{ __html: post.title }} />
                </h3>
                {authorNode ? <div className="text-sm text-gray-600">{authorNode}</div> : null}
            </div>

            {tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                    {orderedTags.slice(0, 4).map((tag) => {
                        const isMatched = matchingTagSet.has(tag);

                        return (
                            <span
                                key={tag}
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                    isMatched
                                        ? "border border-[#1E56A0]/20 bg-[#1E56A0]/10 text-[#1E56A0]"
                                        : "bg-gray-100 text-gray-600"
                                }`}
                            >
                                #{formatTagLabel(tag)}
                            </span>
                        );
                    })}
                </div>
            )}

            <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-700 sm:text-base">
                {stripHtml(post.content)}
            </p>

            {children}

            <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-400">{meta}</span>
                <Link to={readMoreTo} className="font-medium text-[#1E56A0] hover:underline">
                    Read More
                </Link>
            </div>
        </article>
    );
}