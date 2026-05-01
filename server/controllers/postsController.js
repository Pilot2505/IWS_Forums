import pool from "../config/db.js";
import { sanitizeRichText } from "../utils/sanitize.js";
import { sanitizeTitleRichText } from "../utils/sanitize.js";
import { createNotification } from "../utils/notifications.js";
import {
  categoryLabels,
  derivePrimaryCategory,
  enrichPostRow,
  normalizeTags,
} from "../utils/postMeta.js";
const stripHtmlTags = (value = "") => String(value).replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
const voteSelectFields = `
  COALESCE(vote_stats.vote_count, 0) AS vote_count,
  COALESCE(user_vote.vote, 0) AS current_user_vote
`;

const voteJoinClause = `
  LEFT JOIN (
    SELECT post_id, SUM(vote) AS vote_count
    FROM post_votes
    GROUP BY post_id
  ) vote_stats ON vote_stats.post_id = posts.id
  LEFT JOIN post_votes user_vote
    ON user_vote.post_id = posts.id
   AND user_vote.user_id = ?
`;

const bookmarkJoinClause = `
  LEFT JOIN bookmarks user_bookmark
    ON user_bookmark.post_id = posts.id
   AND user_bookmark.user_id = ?
`;

const postSelectFields = `
  posts.*, users.username, users.avatar, ${voteSelectFields},
  CASE WHEN user_bookmark.user_id IS NULL THEN 0 ELSE 1 END AS is_bookmarked
`;

const mapPosts = (rows) => rows.map(enrichPostRow);

const decodeCursor = (cursor) => {
  if (!cursor) return null;

  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
  } catch {
    return null;
  }
};

const encodeCursor = (post, sortBy) => {
  const payload =
    sortBy === "upvotes"
      ? {
          voteCount: Number(post.vote_count) || 0,
          id: Number(post.id),
        }
      : {
          createdAt: new Date(post.created_at).toISOString(),
          id: Number(post.id),
        };

  return Buffer.from(JSON.stringify(payload)).toString("base64");
};

const buildCursorClause = (sortBy, sortDir, cursor) => {
  const decodedCursor = decodeCursor(cursor);
  if (!decodedCursor) {
    return { clause: "", params: [] };
  }

  const comparison = sortDir === "asc" ? ">" : "<";

  if (sortBy === "upvotes") {
    const voteCount = Number(decodedCursor.voteCount);
    const postId = Number(decodedCursor.id);

    if (!Number.isFinite(voteCount) || !Number.isInteger(postId)) {
      return { clause: "", params: [] };
    }

    return {
      clause: `
        AND (
          COALESCE(vote_stats.vote_count, 0) ${comparison} ?
          OR (
            COALESCE(vote_stats.vote_count, 0) = ?
            AND posts.id ${comparison} ?
          )
        )
      `,
      params: [voteCount, voteCount, postId],
    };
  }

  const createdAt = new Date(decodedCursor.createdAt);
  const postId = Number(decodedCursor.id);

  if (Number.isNaN(createdAt.getTime()) || !Number.isInteger(postId)) {
    return { clause: "", params: [] };
  }

  return {
    clause: `
      AND (
        posts.created_at ${comparison} ?
        OR (
          posts.created_at = ?
          AND posts.id ${comparison} ?
        )
      )
    `,
    params: [createdAt, createdAt, postId],
  };
};

const getOrderByClause = (sortBy, sortDir) => {
  const direction = sortDir === "asc" ? "ASC" : "DESC";

  if (sortBy === "upvotes") {
    return `COALESCE(vote_stats.vote_count, 0) ${direction}, posts.id ${direction}`;
  }

  return `posts.created_at ${direction}, posts.id ${direction}`;
};

const listPostsWithCursor = async ({
  userId,
  limit,
  cursor,
  sortBy,
  sortDir,
  whereClause = "",
  whereParams = [],
}) => {
  const { clause: cursorClause, params: cursorParams } = buildCursorClause(
    sortBy,
    sortDir,
    cursor
  );
  const orderByClause = getOrderByClause(sortBy, sortDir);

  const [rows] = await pool.query(
    `
    SELECT ${postSelectFields}
    FROM posts
    JOIN users ON posts.user_id = users.id
    ${voteJoinClause}
    ${bookmarkJoinClause}
    WHERE 1 = 1
    ${whereClause}
    ${cursorClause}
    ORDER BY ${orderByClause}
    LIMIT ?
    `,
    [userId, userId, ...whereParams, ...cursorParams, limit + 1]
  );

  const hasMore = rows.length > limit;
  const posts = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor =
    hasMore && posts.length > 0
      ? encodeCursor(posts[posts.length - 1], sortBy)
      : null;

  return {
    posts: mapPosts(posts),
    nextCursor,
    hasMore,
  };
};

export const getPosts = async (req, res) => {
  const { cursor, limit, sortBy, sortDir } = req.validated.query;
  const userId = Number(req.user?.id);

  try {
    const result = await listPostsWithCursor({
      userId,
      limit: Number(limit),
      cursor,
      sortBy,
      sortDir,
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const searchPosts = async (req, res) => {
  const { q } = req.validated.query;

  try {
    if (!q.trim()) {
      return res.json([]);
    }

    const keyword = `%${q.trim()}%`;

    const [rows] = await pool.execute(
      `
      SELECT ${postSelectFields}
      FROM posts
      JOIN users ON posts.user_id = users.id
      ${voteJoinClause}
      ${bookmarkJoinClause}
      WHERE posts.title LIKE ? OR posts.content LIKE ? OR CAST(posts.tags AS CHAR) LIKE ?
      ORDER BY posts.created_at DESC
      LIMIT 50
      `,
      [req.user.id, req.user.id, keyword, keyword, keyword]
    );

    res.json(mapPosts(rows));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getRecommendedPosts = async (req, res) => {
  const { cursor, limit, categories, sortBy, sortDir } = req.validated.query;
  const userId = req.user.id;

  try {
    const categoryList = categories
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const categoryKeywords = {
      javascript: ["javascript", "js", "node", "react", "vue", "angular", "typescript"],
      python: ["python", "django", "flask", "fastapi", "pandas", "numpy"],
      java: ["java", "spring", "maven", "gradle", "jvm", "kotlin"],
      cpp: ["c++", "cpp", "c language", "pointer", "memory management"],
      web: ["html", "css", "web", "frontend", "backend", "http", "api", "rest"],
      mobile: ["mobile", "android", "ios", "flutter", "react native", "swift"],
      database: ["sql", "mysql", "postgresql", "mongodb", "database", "nosql", "redis"],
      devops: ["devops", "docker", "kubernetes", "ci/cd", "jenkins", "nginx", "linux"],
      ai_ml: ["ai", "machine learning", "deep learning", "neural", "tensorflow", "pytorch", "llm"],
      security: ["security", "cybersecurity", "encryption", "firewall", "vulnerability", "hacking"],
      cloud: ["aws", "azure", "gcp", "cloud", "serverless", "s3", "lambda"],
      opensource: ["open source", "github", "git", "contribution", "license"],
    };

    const keywords = categoryList.flatMap((cat) => categoryKeywords[cat] || [cat]);

    if (keywords.length === 0) {
      return res.status(400).json({ message: "Invalid categories" });
    }

    const conditions = keywords
      .map(() => "(posts.title LIKE ? OR posts.content LIKE ? OR CAST(posts.tags AS CHAR) LIKE ?)")
      .join(" OR ");
    const params = keywords.flatMap((kw) => [`%${kw}%`, `%${kw}%`, `%${kw}%`]);

    const result = await listPostsWithCursor({
      userId,
      limit: Number(limit),
      cursor,
      sortBy,
      sortDir,
      whereClause: `AND (${conditions})`,
      whereParams: params,
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPostsByUsername = async (req, res) => {
  const { username } = req.validated.params;
  const { cursor, limit, sortBy, sortDir } = req.validated.query;
  const userId = req.user.id;

  try {
    const [countRows] = await pool.query(
      `
      SELECT COUNT(*) AS totalCount
      FROM posts
      JOIN users ON posts.user_id = users.id
      WHERE users.username = ?
      `,
      [username]
    );

    const result = await listPostsWithCursor({
      userId,
      limit: Number(limit),
      cursor,
      sortBy,
      sortDir,
      whereClause: "AND users.username = ?",
      whereParams: [username],
    });

    res.json({
      ...result,
      totalCount: Number(countRows[0]?.totalCount) || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPostById = async (req, res) => {
  const { id } = req.validated.params;
  const userId = req.user.id;

  try {
    const [rows] = await pool.execute(
      `
      SELECT ${postSelectFields}
      FROM posts
      JOIN users ON posts.user_id = users.id
      ${voteJoinClause}
      ${bookmarkJoinClause}
      WHERE posts.id = ?
      `,
      [userId, userId, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(enrichPostRow(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createPost = async (req, res) => {
  const { title, content, userId, tags = [] } = req.validated.body;

  try {
    const safeTitle = sanitizeTitleRichText(title).trim();
    if (!stripHtmlTags(safeTitle)) {
      return res.status(400).json({ message: "Title is required" });
    }

    const safeContent = sanitizeRichText(content);
    const safeTags = normalizeTags(tags);
    const primaryCategory = derivePrimaryCategory(safeTags);

    const [result] = await pool.execute(
      "INSERT INTO posts (title, content, user_id, tags, created_at) VALUES (?, ?, ?, ?, UTC_TIMESTAMP())",
      [safeTitle, safeContent, userId, JSON.stringify(safeTags)]
    );

    res.status(201).json({
      id: result.insertId,
      title: safeTitle,
      content: safeContent,
      user_id: userId,
      tags: safeTags,
      primary_category: primaryCategory,
      primary_category_label: primaryCategory ? categoryLabels[primaryCategory] || primaryCategory : null,
      is_bookmarked: false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const uploadPostImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: "Invalid image format" });
    }

    res.json({
      location: `/post-images/${req.file.filename}`,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Image upload failed", details: err.message });
  }
};

export const deletePost = async (req, res) => {
  const { id } = req.validated.params;

  try {
    const [result] = await pool.execute(
      "DELETE FROM posts WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ message: "Post deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updatePost = async (req, res) => {
  const { title, content, tags = [] } = req.validated.body;
  const { id } = req.validated.params;

  try {
    const safeTitle = sanitizeTitleRichText(title).trim();
    if (!stripHtmlTags(safeTitle)) {
      return res.status(400).json({ message: "Title is required" });
    }

    const safeContent = sanitizeRichText(content);
    const safeTags = normalizeTags(tags);
    const primaryCategory = derivePrimaryCategory(safeTags);

    const [result] = await pool.execute(
      "UPDATE posts SET title = ?, content = ?, tags = ? WHERE id = ?",
      [safeTitle, safeContent, JSON.stringify(safeTags), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({
      message: "Post updated successfully",
      title: safeTitle,
      tags: safeTags,
      primary_category: primaryCategory,
      primary_category_label: primaryCategory ? categoryLabels[primaryCategory] || primaryCategory : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCommentsByPostId = async (req, res) => {
  const { id } = req.validated.params;

  try {
    const [rows] = await pool.execute(
      `
      SELECT comments.*, users.username, users.avatar
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE comments.post_id = ?
      ORDER BY comments.created_at DESC
      `,
      [id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createComment = async (req, res) => {
  const { content, user_id, parent_id } = req.validated.body;
  const { id: postId } = req.validated.params;

  try {
    const safeContent = sanitizeRichText(content);

    const [result] = await pool.execute(
      `
      INSERT INTO comments (post_id, user_id, content, parent_id, created_at)
      VALUES (?, ?, ?, ?, UTC_TIMESTAMP())
      `,
      [postId, user_id, safeContent, parent_id || null]
    );

    const [rows] = await pool.execute(
      `
      SELECT comments.*, users.username
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE comments.id = ?
      `,
      [result.insertId]
    );

    if (parent_id) {
      const [replyRows] = await pool.execute(
        `
        SELECT user_id
        FROM comments
        WHERE id = ?
        LIMIT 1
        `,
        [parent_id]
      );

      await createNotification({
        userId: replyRows[0]?.user_id,
        actorUserId: user_id,
        type: "comment_reply",
        postId,
        commentId: result.insertId,
        message: "replied to your comment",
      });
    } else {
      const [postRows] = await pool.execute(
        `
        SELECT user_id
        FROM posts
        WHERE id = ?
        LIMIT 1
        `,
        [postId]
      );

      await createNotification({
        userId: postRows[0]?.user_id,
        actorUserId: user_id,
        type: "comment",
        postId,
        commentId: result.insertId,
        message: "commented on your post",
      });
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteComment = async (req, res) => {
  const { id: commentId } = req.validated.params;
  const { userId } = req.validated.body;

  try {
    const [rows] = await pool.execute(
      `
      SELECT comments.user_id AS commentOwner,
             posts.user_id AS postOwner
      FROM comments
      JOIN posts ON comments.post_id = posts.id
      WHERE comments.id = ?
      `,
      [commentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const { commentOwner, postOwner } = rows[0];

    if (commentOwner !== userId && postOwner !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await pool.execute("DELETE FROM comments WHERE id = ?", [commentId]);

    res.json({ message: "Comment deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
export const togglePostVote = async (req, res) => {
  const { id: postId } = req.validated.params;
  const { vote } = req.validated.body;
  const userId = req.user.id;

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [postRows] = await connection.query(
      "SELECT id FROM posts WHERE id = ? FOR UPDATE",
      [postId]
    );

    if (postRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Post not found" });
    }

    const [voteRows] = await connection.query(
      "SELECT vote FROM post_votes WHERE post_id = ? AND user_id = ? FOR UPDATE",
      [postId, userId]
    );

    const currentVote = voteRows.length > 0 ? Number(voteRows[0].vote) : 0;

    let nextVote = 0;
    if (vote === 1) {
      nextVote = currentVote === 1 ? 0 : 1;
    } else if (vote === -1) {
      nextVote = currentVote === -1 ? 0 : -1;
    } else {
      nextVote = 0;
    }

    if (nextVote === 0) {
      if (currentVote !== 0) {
        await connection.query(
          "DELETE FROM post_votes WHERE post_id = ? AND user_id = ?",
          [postId, userId]
        );
      }
    } else if (currentVote === 0) {
      await connection.query(
        "INSERT INTO post_votes (post_id, user_id, vote) VALUES (?, ?, ?)",
        [postId, userId, nextVote]
      );
    } else {
      await connection.query(
        "UPDATE post_votes SET vote = ? WHERE post_id = ? AND user_id = ?",
        [nextVote, postId, userId]
      );
    }

    const [countRows] = await connection.query(
      "SELECT COALESCE(SUM(vote), 0) AS vote_count FROM post_votes WHERE post_id = ?",
      [postId]
    );

    await connection.commit();

    return res.json({
      voteCount: Number(countRows[0].vote_count) || 0,
      currentUserVote: nextVote,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  } finally {
    if (connection) connection.release();
  }
};
