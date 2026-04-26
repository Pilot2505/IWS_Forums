import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authFetch } from "../services/api";
import useRequireAuth from "../hooks/useRequireAuth";

const CATEGORIES = [
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C / C++" },
  { id: "web", label: "Web Development" },
  { id: "mobile", label: "Mobile Development" },
  { id: "database", label: "Database" },
  { id: "devops", label: "DevOps" },
  { id: "ai_ml", label: "AI / Machine Learning" },
  { id: "security", label: "Cybersecurity" },
  { id: "cloud", label: "Cloud Computing" },
  { id: "opensource", label: "Open Source" },
];

export default function SelectCategories() {
  const navigate = useNavigate();
  const { user, setUser, ready } = useRequireAuth({
    redirectTo: "/login",
    requireToken: true,
  });
  
  const [selected, setSelected] = useState([]);
  const [initialSelected, setInitialSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!ready || !user) return null;
  
  useEffect(() => {
    if (!user) return;

    const savedCategories = Array.isArray(user.categories) ? user.categories : [];
    setSelected(savedCategories);
    setInitialSelected(savedCategories);
  }, [user]);

  const toggleCategory = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((c) => c !== id);
      }

      if (prev.length >= 3) {
        toast.error("You can select up to 3 categories only!");
        return prev;
      }

      return [...prev, id];
    });
  };

  const normalizeCategories = (arr) => [...arr].sort();

  const hasChanges =
    JSON.stringify(normalizeCategories(selected)) !==
    JSON.stringify(normalizeCategories(initialSelected));

  const canContinue = hasChanges;

  const handleSkip = () => {
    navigate("/home");
  };

  const saveCategories = async (cats) => {
    setLoading(true);
    try {
      const res = await authFetch("/api/users/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, categories: cats }),
      });

      if (!res.ok) throw new Error("Failed to save categories");

      const updatedUser = { ...user, categories: cats };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setInitialSelected(cats);

      toast.success("Categories saved!");
      navigate("/home");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    await saveCategories(selected);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#d4e4ec]">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
        <h1 className="text-xl font-bold text-[#1a2332]">Tech Pulse</h1>
      </header>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-bold text-[#0a0a0a] sm:text-4xl">
              {user?.categories && Array.isArray(user.categories) && user.categories.length > 0
                ? "Update your interests"
                : "What are you interested in?"}
            </h2>
            <p className="text-sm text-gray-600 sm:text-base">
              Select up to <span className="font-semibold text-[#2b5a8a]">3 categories</span> to personalize your feed.
            </p>
          </div>

          <div className="rounded-lg bg-white p-5 shadow-sm sm:p-8">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">{selected.length}/3 selected</span>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`h-2 w-8 rounded-full transition-colors ${
                      i < selected.length ? "bg-[#2b5a8a]" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {CATEGORIES.map((cat) => {
                const isSelected = selected.includes(cat.id);
                const isDisabled = !isSelected && selected.length >= 3;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    disabled={isDisabled}
                    className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all
                      ${
                        isSelected
                          ? "border-[#2b5a8a] bg-[#2b5a8a] text-white shadow-md scale-105"
                          : isDisabled
                          ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                          : "border-gray-300 bg-white text-gray-700 hover:border-[#2b5a8a] hover:text-[#2b5a8a]"
                      }
                    `}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !canContinue}
                className="flex-1 rounded-md bg-[#2b5a8a] py-3 font-semibold text-white transition-colors hover:bg-[#1e4167] disabled:bg-gray-400"
              >
                {loading ? "Saving..." : "Continue"}
              </button>
              <button
                type="button"
                onClick={handleSkip}
                disabled={loading}
                className="flex-1 rounded-md border border-gray-300 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}