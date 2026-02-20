// ============================================================
// server.js — The Express web server.
//
// Routes:
//   GET  /api/posts     → list / search posts
//   POST /api/posts    → create a new travel post
// ============================================================

const express = require("express");
const path = require("path");
const { createPost, searchPosts } = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ============================================================
// POST /api/posts — Create a new travel post
// ============================================================
app.post("/api/posts", async (req, res) => {
  const { from, to, date, note } = req.body;

  if (!from || !to || !date) {
    return res.status(400).json({
      error: '"from", "to", and "date" are required.'
    });
  }

  try {
    const newPost = await createPost({ from, to, date, note });
    res.status(201).json(newPost);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: "Failed to create post." });
  }
});

// ============================================================
// GET /api/posts — List / search posts
// ============================================================
app.get("/api/posts", async (req, res) => {
  const { from, to, date } = req.query;

  try {
    const posts = await searchPosts({ from, to, date });
    res.json(posts);
  } catch (err) {
    console.error("Error searching posts:", err);
    res.status(500).json({ error: "Failed to search posts." });
  }
});

// ============================================================
// Start server
// ============================================================
app.listen(PORT, () => {
  console.log("");
  console.log("✈ Travel Buddy is running!");
  console.log(`→ http://localhost:${PORT}`);
  console.log("");
});