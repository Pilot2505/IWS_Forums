import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

export default function SearchBar({ className = "" }) {
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
    <form onSubmit={handleSearch} className={`relative w-[300px] ${className}`}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#717783]">
        <Search className="h-4 w-4" />
      </span>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search"
        className="w-full rounded-lg border border-[#c1c7d3] bg-[#f8f9fa] py-2 pl-10 pr-4 text-sm text-[#191c1d] placeholder:text-[#717783] transition-colors duration-150 hover:bg-[#f3f4f5] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#005da7]"
      />
    </form>
  );
}