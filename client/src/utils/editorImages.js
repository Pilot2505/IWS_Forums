import { authFetch } from "../services/api";

export async function uploadEditorImage(blob, index, prefix = "editor-image") {
    const formData = new FormData();
    const extension = blob.type.split("/")[1] || "png";

    formData.append("image", blob, `${prefix}-${Date.now()}-${index}.${extension}`);

    const res = await authFetch("/api/posts/upload-image", {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        throw new Error("Image upload failed");
    }

    const data = await res.json();
    return data.location;
}

export async function uploadEmbeddedImages(content, options = {}) {
    const {
        maxWidth = 800,
        uploadImage = uploadEditorImage,
    } = options;

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    const images = Array.from(doc.querySelectorAll("img"));

    for (let index = 0; index < images.length; index += 1) {
        const image = images[index];
        const src = image.getAttribute("src") || "";

        image.style.maxWidth = `${maxWidth}px`;
        image.style.height = "auto";

        if (!src.startsWith("data:image/")) {
        continue;
        }

        const blob = await fetch(src).then((response) => response.blob());
        const uploadedUrl = await uploadImage(blob, index);
        image.setAttribute("src", uploadedUrl);
    }

    return doc.body.innerHTML;
}