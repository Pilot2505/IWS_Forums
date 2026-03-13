export const updatePost = async (id, title, content) => {
  const res = await fetch(`/api/posts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, content }),
  });

  if (!res.ok) {
    throw new Error("Failed to update post");
  }

  return res.json();
};

export const deletePost = async (id) => {
  const res = await fetch(`/api/posts/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete post");
  }

  return true;
};