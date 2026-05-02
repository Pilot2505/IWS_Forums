import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Editor } from "@tinymce/tinymce-react";
import { Tag } from "lucide-react";
import Navbar from "../components/navigation/Navbar";
import { authFetch } from "../services/api";
import { containsBlockedWord } from "../utils/moderation";
import { uploadEmbeddedImages } from "../utils/editorImages";
import useRequireAuth from "../hooks/useRequireAuth";
import { formatTagLabel, normalizeTagsInput } from "../utils/postMeta";
import { stripHtml } from "../utils/content";

export default function CreatePost() {
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const { user, setUser, ready } = useRequireAuth({
    redirectTo: "/login",
    requireToken: true,
  });

  const [title, setTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [editorLoaded, setEditorLoaded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedTitle = stripHtml(title).trim();
    const rawContent = editorRef.current?.getContent() || "";

    if (!trimmedTitle || !rawContent.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (containsBlockedWord(trimmedTitle) || containsBlockedWord(rawContent)) {
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
          title,
          content,
          userId: user.id,
          tags: normalizeTagsInput(tagsInput),
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
    <div className="min-h-screen bg-forum-bg">
      <Navbar user={user} setUser={setUser} showCreatePost={false} />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight text-forum-inkStrong sm:text-5xl">
            Create New Post
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-forum-border bg-forum-surface p-5 shadow-panel sm:p-8"
        >
          <div className="space-y-6">
            <div>
              <label
                htmlFor="create-post-title-editor"
                className="mb-3 block text-2xl font-semibold text-forum-inkStrong"
              >
                Title
              </label>
              <div className="overflow-hidden rounded-2xl border border-forum-border bg-white shadow-sm">
                <div className="relative min-h-[112px] [&_.tox]:border-0 [&_.tox-editor-header]:border-b [&_.tox-editor-header]:border-forum-border [&_.tox-edit-area__iframe]:max-h-[112px] [&_.tox-edit-area__iframe]:overflow-y-auto">
                  <Editor
                    id="create-post-title-editor"
                    value={title}
                    onEditorChange={(newTitle) => setTitle(newTitle)}
                    tinymceScriptSrc="/tinymce/tinymce.min.js"
                    init={{
                      license_key: "gpl",
                      promotion: false,
                      branding: false,
                      menubar: false,
                      statusbar: false,
                      placeholder: "Enter post title",
                      height: 100,
                      forced_root_block: false,
                      toolbar: "bold italic underline strikethrough",
                      plugins: [],
                      toolbar_sticky: false,
                      skin_url: "/tinymce/skins/ui/oxide",
                      valid_elements: "b,strong,i,em,u,s,br",
                      element_format: "html",
                      entity_encoding: "raw",
                      content_style: `
                        body {
                          font-family: Inter, system-ui, sans-serif;
                          font-size: 1rem;
                          color: #191c1d;
                        }
                      `,
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="tags"
                className="mb-3 flex items-center gap-2 text-xl font-semibold text-forum-inkStrong"
              >
                <Tag className="h-5 w-5" />
                Tags
              </label>
              <input
                type="text"
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. React, Web Development"
                className="h-14 w-full rounded-2xl border border-forum-border bg-white px-4 text-base text-forum-inkStrong placeholder:text-forum-subtle outline-none transition focus:border-forum-primary focus:ring-2 focus:ring-forum-primary/15"
              />
              <p className="mt-3 text-base leading-7 text-forum-muted">
                Add multiple tags by separating them with commas. Example:
                React, UI, DevTools.
              </p>

              {normalizeTagsInput(tagsInput).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {normalizeTagsInput(tagsInput).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-forum-primarySoft px-3 py-1 text-xs font-semibold text-forum-primary"
                    >
                      #{formatTagLabel(tag)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="content"
                className="mb-3 block text-2xl font-semibold text-forum-inkStrong"
              >
                Content
              </label>
              <div className="overflow-hidden rounded-2xl border border-forum-border bg-white shadow-sm">
                <div className="create-post-editor relative min-h-[520px] [&_.tox]:border-0 [&_.tox-editor-header]:border-b [&_.tox-editor-header]:border-forum-border [&_.tox-edit-area__iframe]:max-h-[520px] [&_.tox-edit-area__iframe]:overflow-y-auto sm:min-h-[640px] sm:[&_.tox-edit-area__iframe]:max-h-[640px] lg:min-h-[800px] lg:[&_.tox-edit-area__iframe]:max-h-[800px]">
                  {!editorLoaded && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-forum-panel text-forum-muted">
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
                      height:
                        window.innerWidth < 640
                          ? 520
                          : window.innerWidth < 1024
                            ? 640
                            : 800,
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
                              const width =
                                image.width > maxWidth ? maxWidth : image.width;
                              const height =
                                image.width > maxWidth
                                  ? Math.round(
                                      (image.height * maxWidth) / image.width,
                                    )
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
                      extended_valid_elements:
                        "img[src|alt|width|height|style]",
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
                      statusbar: false,
                      content_style: `
                        body {
                          font-family: Inter, system-ui, sans-serif;
                          color: #191c1d;
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
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-forum-primary px-8 text-lg font-semibold text-white transition hover:bg-forum-primaryDark sm:w-auto sm:min-w-[200px]"
              >
                Submit Post
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
