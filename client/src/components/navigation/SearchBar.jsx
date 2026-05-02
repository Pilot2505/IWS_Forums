import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    setQuery("");
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-sm">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts, tags..."
          className="h-12 w-full rounded-2xl border border-forum-border bg-forum-surface pl-12 pr-12 text-sm text-forum-ink placeholder:text-forum-subtle shadow-sm outline-none transition focus:border-forum-primary focus:ring-2 focus:ring-forum-primary/15 md:w-80"
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-forum-muted transition hover:bg-forum-primarySoft hover:text-forum-primary"
        >
          <Search className="h-4 w-4" />
        </button>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-forum-subtle" />
      </div>
    </form>
  );
}
