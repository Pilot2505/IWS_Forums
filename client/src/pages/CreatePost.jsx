import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Editor } from "@tinymce/tinymce-react";
import { Tag } from "lucide-react";
import Navbar from "../components/navigation/Navbar";
import { authFetch } from "../services/api";
import { stripHtml } from "../utils/content";
import { containsBlockedWord } from "../utils/moderation";
import { uploadEmbeddedImages } from "../utils/editorImages";
import useRequireAuth from "../hooks/useRequireAuth";
import { formatTagLabel, normalizeTagsInput } from "../utils/postMeta";

export default function CreatePost() {
  const navigate = useNavigate();
  const titleEditorRef = useRef(null);
  const editorRef = useRef(null);
  const { user, setUser, ready } = useRequireAuth({
    redirectTo: "/login",
    requireToken: true,
  });
  
  const [title, setTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [titleEditorLoaded, setTitleEditorLoaded] = useState(false);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const normalizedTags = normalizeTagsInput(tagsInput);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const rawTitle = titleEditorRef.current?.getContent() || title;
    const trimmedTitle = stripHtml(rawTitle).trim();
    const rawContent = editorRef.current?.getContent() || "";
    const trimmedContent = stripHtml(rawContent).trim();

    if (!trimmedTitle || !trimmedContent) {
      toast.error("Please fill in all fields");
      return;
    }

    if (containsBlockedWord(trimmedTitle) || containsBlockedWord(trimmedContent)) {
      toast.error("Post contains blocked words. Please edit before creating.");
      return;
    }

    try {
      const content = await uploadEmbeddedImages(rawContent);

      const res = await authFetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: rawTitle.trim(),
          content,
          userId: user.id,
          tags: normalizedTags,
        }),
      });

      if (!res.ok) throw new Error("Failed to create post");

      const data = await res.json();
      toast.success("Post created successfully!");
      navigate(`/post/${data.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  if (!ready || !user) return null;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d]">
      <Navbar user={user} setUser={setUser} showCreatePost={false} />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-[#191c1d] sm:text-4xl">
            Create New Post
          </h1>
          <p className="text-sm text-[#414751] sm:text-base">
            Share an idea, tutorial, or question with the Tech Pulse community.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-[#e1e3e4] bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="post-title-editor" className="font-label-md text-label-md text-[#191c1d]">
              Title
            </label>
            <div className="relative overflow-hidden rounded-xl border border-[#c1c7d3] bg-white shadow-sm">
              {!titleEditorLoaded && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#f8f9fa] text-sm text-[#717783]">
                  Loading title editor...
                </div>
              )}

              <Editor
                id="post-title-editor"
                ref={titleEditorRef}
                value={title}
                onEditorChange={(newTitle) => setTitle(newTitle)}
                tinymceScriptSrc="/tinymce/tinymce.min.js"
                onInit={(evt, editor) => {
                  titleEditorRef.current = editor;
                  setTitleEditorLoaded(true);
                }}
                init={{
                  license_key: "gpl",
                  promotion: false,
                  branding: false,
                  menubar: false,
                  statusbar: false,
                  placeholder: "Write your title...",
                  height: 58,
                  forced_root_block: false,
                  toolbar: "bold italic underline strikethrough",
                  plugins: [],
                  toolbar_mode: "wrap",
                  toolbar_sticky: false,
                  skin_url: "/tinymce/skins/ui/oxide",
                  valid_elements: "b,strong,i,em,u,s,br",
                  element_format: "html",
                  entity_encoding: "raw",
                  autosave_ask_before_unload: false,
                  content_style: `
                    html, body {
                      height: 100%;
                      margin: 0;
                      overflow: hidden !important;
                    }
                    .mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before {
                      left: 16px;
                    }
                    body {
                      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                      display: flex;
                      align-items: center;
                      box-sizing: border-box;
                      font-size: 18px;
                      font-weight: 500;
                      line-height: 1.25;
                      color: #191c1d;
                      padding: 6px 16px;
                      white-space: nowrap;
                    }
                    p {
                      margin: 0;
                    }
                  `,
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="tags" className="flex items-center gap-2 font-label-md text-label-md text-[#191c1d]">
              <Tag className="h-4 w-4" />
              Tags
            </label>
            <input
              type="text"
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. React, Web Development"
              className="h-12 rounded-lg border border-[#c1c7d3] bg-[#f8f9fa] px-4 text-base text-[#191c1d] placeholder:text-[#717783] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#005da7]"
            />
            <p className="text-sm text-[#717783]">
              Add multiple tags by separating them with commas. Example: React, UI, DevTools.
            </p>

            {normalizedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {normalizedTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#1E56A0]/20 bg-[#1E56A0]/10 px-3 py-1 text-xs font-medium text-[#1E56A0]"
                  >
                    #{formatTagLabel(tag)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="content" className="font-label-md text-label-md text-[#191c1d]">
              Content
            </label>

            <div className="relative overflow-hidden rounded-xl border border-[#c1c7d3] bg-white shadow-sm">
              {!editorLoaded && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#f8f9fa] text-sm text-[#717783]">
                  Loading editor...
                </div>
              )}

              <Editor
                ref={editorRef}
                tinymceScriptSrc="/tinymce/tinymce.min.js"
                onInit={(evt, editor) => {
                  editorRef.current = editor;
                  setEditorLoaded(true);
                }}
                init={{
                  license_key: "gpl",
                  promotion: false,
                  branding: false,
                  menubar: false,
                  statusbar: false,
                  placeholder: "Write your post content...",
                  height:
                    window.innerWidth < 640 ? 520 : window.innerWidth < 1024 ? 640 : 800,
                  skin_url: "/tinymce/skins/ui/oxide",
                  plugins: ["lists", "link", "image", "code"],
                  toolbar:
                    "undo redo | fontsize | bold italic underline strikethrough | forecolor | alignleft aligncenter alignright alignjustify | bullist numlist | outdent indent | link | image | code",
                  toolbar_sticky: true,
                  toolbar_sticky_offset: 0,
                  file_picker_types: "image",
                  file_picker_callback: (callback) => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";

                    input.onchange = () => {
                      const file = input.files?.[0];
                      if (!file) {
                        return;
                      }

                      const reader = new FileReader();
                      reader.onload = () => {
                        const image = new Image();
                        image.onload = () => {
                          const maxWidth = 800;
                          const width = image.width > maxWidth ? maxWidth : image.width;
                          const height =
                            image.width > maxWidth
                              ? Math.round((image.height * maxWidth) / image.width)
                              : image.height;

                          callback(reader.result, {
                            title: file.name,
                            width: String(width),
                            height: String(height),
                            style: `max-width: ${maxWidth}px; height: auto;`,
                          });
                        };
                        image.src = reader.result;
                      };
                      reader.readAsDataURL(file);
                    };

                    input.click();
                  },
                  image_title: true,
                  image_dimensions: true,
                  object_resizing: "img",
                  extended_valid_elements: "img[src|alt|width|height|style]",
                  valid_styles: { "*": "width,height,max-width" },
                  convert_urls: false,
                  remove_script_host: false,
                  automatic_uploads: false,
                  paste_data_images: true,
                  allow_local_files: true,
                  element_format: "html",
                  schema: "html5",
                  entity_encoding: "raw",
                  autosave_ask_before_unload: false,
                  content_style: `
                    body {
                      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                      font-size: 16px;
                      font-weight: 400;
                      line-height: 1.7;
                      color: #191c1d;
                    }
                    p {
                      margin: 0 0 0.75em;
                    }
                    p:last-child {
                      margin-bottom: 0;
                    }
                    body, p, li, div, span {
                      font-weight: 400;
                    }
                    strong,
                    b {
                      font-weight: 700;
                    }
                    img {
                      max-width: 800px;
                      height: auto;
                    }
                  `,
                }}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-[#005da7] px-8 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#2976c7]"
            >
              Submit Post
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}