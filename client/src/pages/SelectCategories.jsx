import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authFetch } from "../services/api";

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
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState([]);
  const [initialSelected, setInitialSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!storedUser || !token) {
      navigate("/login");
      return;
    }
    const parsed = JSON.parse(storedUser);
    setUser(parsed);

    // Nếu user đã có categories, load lên để có thể chỉnh sửa
    const savedCategories = Array.isArray(parsed.categories) ? parsed.categories : [];
    setSelected(savedCategories);
    setInitialSelected(savedCategories);
  }, [navigate]);

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

  const normalizeCategories = (arr) => [...arr].sort(); // Để so sánh không bị ảnh hưởng bởi thứ tự chọn categories

  const hasChanges =
    JSON.stringify(normalizeCategories(selected)) !==
    JSON.stringify(normalizeCategories(initialSelected)); // So sánh mảng đã chọn hiện tại với mảng ban đầu để xác định xem có thay đổi nào không

  const canContinue = hasChanges; // Cho phép tiếp tục nếu có sự thay đổi so với ban đầu. Nếu user đã có categories và không thay đổi gì thì sẽ không cho submit, tránh việc gửi request update không cần thiết.


  const handleSkip = async () => {
    navigate("/home"); // Không thay đổi gì, chuyển hướng về home
  };

  const handleSubmit = async () => {
    await saveCategories(selected);
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#d4e4ec] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
        <h1 className="text-xl font-bold text-[#1a2332]">Tech Pulse</h1>
      </header>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#0a0a0a] sm:text-4xl mb-2">
              {user?.categories && Array.isArray(user.categories) && user.categories.length > 0
                ? "Update your interests"
                : "What are you interested in?"}
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Select up to <span className="font-semibold text-[#2b5a8a]">3 categories</span> to personalize your feed.
            </p>
          </div>

          <div className="rounded-lg bg-white p-5 shadow-sm sm:p-8">
            {/* Selected count */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {selected.length}/3 selected
              </span>
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

            {/* Category grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mb-6">
              {CATEGORIES.map((cat) => {
                const isSelected = selected.includes(cat.id);
                const isDisabled = !isSelected && selected.length >= 3;
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    disabled={isDisabled}
                    className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all
                      ${
                        isSelected
                          ? "border-[#2b5a8a] bg-[#2b5a8a] text-white shadow-md scale-105"
                          : isDisabled
                          ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
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
                onClick={handleSubmit}
                disabled={loading || !canContinue}
                className="flex-1 bg-[#2b5a8a] hover:bg-[#1e4167] disabled:bg-gray-400 text-white font-semibold py-3 rounded-md transition-colors"
              >
                {loading ? "Saving..." : "Continue"}
              </button>
              <button
                onClick={handleSkip}
                disabled={loading}
                className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium py-3 rounded-md transition-colors"
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
