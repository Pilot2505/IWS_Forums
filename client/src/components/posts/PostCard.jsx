import { Link } from "react-router-dom";
import { stripHtml } from "../../utils/content";

export default function PostCard({
    post,
    authorNode,
    meta,
    readMoreTo,
    children,
    className = "",
}) {
    return (
        <article className={`rounded-lg border border-gray-200 bg-white p-4 sm:p-6 ${className}`}>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="text-xl font-semibold text-black sm:text-2xl">
            {post.title}
            </h3>
            {authorNode ? <div className="text-sm text-gray-600">{authorNode}</div> : null}
        </div>

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