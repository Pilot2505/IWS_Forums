import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Binary,
  Cloud,
  Code2,
  Database,
  Globe,
  HardDriveDownload,
  LaptopMinimal,
  Shield,
  Smartphone,
  Sparkles,
  SquareTerminal,
  Wrench,
} from "lucide-react";
import { authFetch } from "../services/api";
import useRequireAuth from "../hooks/useRequireAuth";

const CATEGORIES = [
  { id: "javascript", label: "JavaScript", icon: Code2 },
  { id: "python", label: "Python", icon: Binary },
  { id: "java", label: "Java", icon: SquareTerminal },
  { id: "cpp", label: "C / C++", icon: LaptopMinimal },
  { id: "web", label: "Web Development", icon: Globe },
  { id: "mobile", label: "Mobile Development", icon: Smartphone },
  { id: "database", label: "Database", icon: Database },
  { id: "devops", label: "DevOps", icon: Wrench },
  { id: "ai_ml", label: "AI / Machine Learning", icon: Sparkles },
  { id: "security", label: "Cybersecurity", icon: Shield },
  { id: "cloud", label: "Cloud Computing", icon: Cloud },
  { id: "opensource", label: "Open Source", icon: HardDriveDownload },
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

    const savedCategories = Array.isArray(user.categories)
      ? user.categories
      : [];
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

  if (!ready || !user) return null;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-forum-bg">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-10rem] h-96 w-96 rounded-full bg-forum-primarySoft/60 blur-3xl" />
        <div className="absolute bottom-[-12rem] right-[-6rem] h-80 w-80 rounded-full bg-forum-primarySoft/50 blur-3xl" />
      </div>

      <header className="relative z-10 flex items-center justify-center px-4 py-5 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-forum-inkStrong">
          Tech Pulse
        </h1>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl">
          <div className="rounded-[36px] border border-white/70 bg-white/90 p-6 shadow-dialog backdrop-blur sm:p-10 lg:p-14">
            <div className="mb-10 text-center">
              <h2 className="mb-4 text-4xl font-semibold tracking-tight text-forum-inkStrong sm:text-5xl lg:text-6xl">
                {user?.categories &&
                Array.isArray(user.categories) &&
                user.categories.length > 0
                  ? "Update your interests"
                  : "What are you interested in?"}
              </h2>
              <p className="text-lg text-forum-muted">
                Select up to 3 categories to personalize your feed.
              </p>
              <div className="mx-auto mt-6 inline-flex rounded-full bg-forum-panel px-5 py-2 text-base text-forum-inkStrong">
                <span className="font-semibold text-forum-primary">
                  {selected.length}/3
                </span>
                <span className="ml-2 text-forum-muted">selected</span>
              </div>
            </div>

            <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {CATEGORIES.map((cat) => {
                const isSelected = selected.includes(cat.id);
                const isDisabled = !isSelected && selected.length >= 3;
                const Icon = cat.icon;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    disabled={isDisabled}
                    className={`flex min-h-[152px] flex-col items-center justify-center rounded-[24px] border px-4 py-5 text-center transition-all
                      ${
                        isSelected
                          ? "border-forum-primary bg-forum-primarySoft text-forum-primary shadow-lift"
                          : isDisabled
                            ? "cursor-not-allowed border-forum-border bg-forum-panel text-forum-subtle"
                            : "border-forum-border bg-forum-surface text-forum-inkStrong hover:border-forum-primary/30 hover:shadow-panel"
                      }
                    `}
                  >
                    <span
                      className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${
                        isSelected
                          ? "bg-forum-primary text-white"
                          : "bg-forum-panel text-forum-primary"
                      }`}
                    >
                      <Icon className="h-7 w-7" />
                    </span>
                    <span className="text-base font-medium leading-7">
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-forum-border pt-8 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleSkip}
                disabled={loading}
                className="inline-flex h-14 items-center justify-center rounded-2xl border border-forum-border px-6 font-medium text-forum-ink transition hover:bg-forum-panel sm:w-auto"
              >
                Skip for now
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !canContinue}
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-forum-primary px-8 font-semibold text-white shadow-lift transition hover:bg-forum-primaryDark disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {loading ? "Saving..." : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
