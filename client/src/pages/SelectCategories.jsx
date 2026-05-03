import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Bot,
  Braces,
  Cloud,
  Code2,
  Coffee,
  Database,
  Globe,
  PackageOpen,
  Shield,
  Smartphone,
  Terminal,
  Workflow,
} from "lucide-react";
import { authFetch } from "../services/api";
import useRequireAuth from "../hooks/useRequireAuth";

const MAX_SELECTIONS = 3;

const CATEGORIES = [
  { id: "javascript", label: "JavaScript", icon: Code2 },
  { id: "python", label: "Python", icon: Braces },
  { id: "java", label: "Java", icon: Coffee },
  { id: "cpp", label: "C/C++", icon: Terminal },
  { id: "web", label: "Web Development", icon: Globe },
  { id: "mobile", label: "Mobile Development", icon: Smartphone },
  { id: "database", label: "Database", icon: Database },
  { id: "devops", label: "DevOps", icon: Workflow },
  { id: "ai_ml", label: "AI / Machine Learning", icon: Bot },
  { id: "security", label: "Cybersecurity", icon: Shield },
  { id: "cloud", label: "Cloud Computing", icon: Cloud },
  { id: "opensource", label: "Open Source", icon: PackageOpen },
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

  useEffect(() => {
    if (!user) return;

    const savedCategories = Array.isArray(user.categories) ? user.categories : [];
    setSelected(savedCategories);
    setInitialSelected(savedCategories);
  }, [user]);

  const toggleCategory = (id) => {
    setSelected((previous) => {
      if (previous.includes(id)) {
        return previous.filter((categoryId) => categoryId !== id);
      }

      if (previous.length >= MAX_SELECTIONS) {
        toast.error("You can select up to 3 categories only!");
        return previous;
      }

      return [...previous, id];
    });
  };

  const normalizeCategories = (values) => [...values].sort();

  const hasChanges =
    JSON.stringify(normalizeCategories(selected)) !==
    JSON.stringify(normalizeCategories(initialSelected));

  const hasExistingCategories = Array.isArray(user?.categories) && user.categories.length > 0;
  const canContinue = selected.length > 0 && (hasChanges || hasExistingCategories);
  const isMaxedOut = selected.length >= MAX_SELECTIONS;

  const handleSkip = () => {
    navigate("/home");
  };

  const saveCategories = async (categories) => {
    setLoading(true);

    try {
      const response = await authFetch("/api/users/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, categories }),
      });

      if (!response.ok) {
        throw new Error("Failed to save categories");
      }

      const updatedUser = { ...user, categories };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setInitialSelected(categories);

      toast.success("Categories saved!");
      navigate("/home");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    await saveCategories(selected);
  };

  if (!ready || !user) return null;

  return (
    <div
      className="relative isolate min-h-screen overflow-hidden bg-[#f8f9fa] text-[#191c1d] antialiased selection:bg-[#2976c7] selection:text-[#fdfcff]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <header className="fixed left-0 top-0 z-50 flex w-full items-center justify-center bg-[#f8f9fa]/80 px-8 py-6 backdrop-blur-[20px]">
        <div className="text-xl font-bold tracking-tighter text-[#191c1d]">Tech Pulse</div>
      </header>

      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pb-12 pt-24 sm:px-6">
        <div
          className="absolute inset-0 z-0 bg-gradient-to-br from-[#f8f9fa] via-[#f8f9fa] to-[#d4e3ff]/20 pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 flex w-full max-w-3xl flex-col gap-10 rounded-xl bg-white p-8 shadow-[0px_12px_32px_rgba(25,28,29,0.04)] md:p-12">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-[#191c1d] md:text-5xl">
              {hasExistingCategories ? "Update your interests" : "What are you interested in?"}
            </h1>
            <p className="mx-auto max-w-xl text-lg leading-relaxed text-[#414751]">
              Select up to 3 categories to personalize your feed.
            </p>
            <div className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[#f3f4f5] px-4 py-1.5">
              <span className="text-sm font-medium tracking-[0.05em] text-[#005da7]">
                {selected.length}/3
              </span>
              <span className="text-sm tracking-[0.05em] text-[#414751]">
                selected
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {CATEGORIES.map((category) => {
              const isSelected = selected.includes(category.id);
              const isDisabled = !isSelected && isMaxedOut;
              const Icon = category.icon;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                  className={[
                    "group flex flex-col items-center justify-center gap-3 rounded-xl border p-4 text-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#005da7] focus:ring-offset-2",
                    isSelected
                      ? "border-[#c1d9fe] bg-[#eef5ff]"
                      : isDisabled
                      ? "cursor-not-allowed border-[#e1e3e4] bg-[#f3f4f5] opacity-60"
                      : "border-[#c1c7d3]/15 bg-white hover:border-transparent hover:bg-[#e7e8e9]",
                  ].join(" ")}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f4f5] text-[#005da7] transition-colors group-hover:bg-white">
                    <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
                  </div>
                  <span className="text-center text-sm font-medium text-[#191c1d]">
                    {category.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col-reverse items-center justify-between gap-6 border-t border-[#e1e3e4] pt-6 sm:flex-row">
            <button
              type="button"
              onClick={handleSkip}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium uppercase tracking-[0.05em] text-[#414751] transition-colors hover:text-[#005da7]"
            >
              Skip for now
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !canContinue}
              className="w-full rounded-full bg-gradient-to-r from-[#005da7] to-[#2976c7] px-8 py-3 text-base font-semibold text-white shadow-[0px_4px_12px_rgba(0,93,167,0.2)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}