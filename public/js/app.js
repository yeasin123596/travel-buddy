// ============================================================
// app.js — All frontend logic for Travel Buddy.
//
// Responsibilities:
//   1. Submit the "Post a Trip" form   → POST /api/posts
//   2. Submit the "Find a Trip" form   → GET  /api/posts?...
//   3. Load all trips on page load
//   4. Render trip cards in the DOM
// ============================================================

// --- Grab references to DOM elements we'll use often ---
const postForm     = document.getElementById('post-form');
const postMessage  = document.getElementById('post-message');
const searchForm   = document.getElementById('search-form');
const clearBtn     = document.getElementById('clear-btn');
const resultsList  = document.getElementById('results-list');
const resultsCount = document.getElementById('results-count');

// ============================================================
// HELPER: Format a date string "YYYY-MM-DD" to a human-friendly
// format like "Feb 20, 2026".
// ============================================================
function formatDate(dateStr) {
  // Append "T00:00" so the Date object uses local time, not UTC
  const d = new Date(dateStr + 'T00:00');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric'
  });
}

// ============================================================
// HELPER: Escape HTML to prevent XSS when injecting user text.
// ============================================================
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================
// RENDER — Take an array of post objects and render them as
// cards inside #results-list.
// ============================================================
function renderPosts(posts) {
  // Update the counter badge
  resultsCount.textContent = posts.length;

  // If there are no posts, show a friendly message
  if (posts.length === 0) {
    resultsList.innerHTML =
      '<p class="placeholder-text">No trips found. Try a different search or post one!</p>';
    return;
  }

  // Build the HTML for every post card
  resultsList.innerHTML = posts.map(post => `
    <div class="trip-card">
      <div class="trip-route">
        <span class="tag tag-from">${escapeHtml(post.from_loc)}</span>
        <span class="trip-arrow">→</span>
        <span class="tag tag-to">${escapeHtml(post.to_loc)}</span>
      </div>
      <div class="trip-meta">
        📅 ${formatDate(post.travel_date)}
        &nbsp;·&nbsp;
        Posted ${formatDate(post.created_at)}
      </div>
      ${
        post.note
          ? `<div class="trip-note">${escapeHtml(post.note)}</div>`
          : ''
      }
    </div>
  `).join('');
}

// ============================================================
// FETCH — Load posts from the server.
// @param {object} filters — optional { from, to, date }
// ============================================================
async function fetchPosts(filters = {}) {
  // Build query string from the filters object
  const params = new URLSearchParams();
  if (filters.from) params.set('from', filters.from);
  if (filters.to)   params.set('to',   filters.to);
  if (filters.date) params.set('date', filters.date);

  const queryString = params.toString();
  const url = '/api/posts' + (queryString ? '?' + queryString : '');

  try {
    const res  = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      console.error('Server error:', data);
      return;
    }

    renderPosts(data);
  } catch (err) {
    console.error('Network error:', err);
    resultsList.innerHTML =
      '<p class="placeholder-text">Could not load trips. Is the server running?</p>';
  }
}

// ============================================================
// HELPER: Show a temporary success / error message under the
// post form.
// ============================================================
function showPostMessage(text, type = 'success') {
  postMessage.textContent = text;
  postMessage.className   = `message ${type}`;   // "message success" or "message error"
  postMessage.hidden      = false;

  // Auto-hide after 4 seconds
  setTimeout(() => {
    postMessage.hidden = true;
  }, 4000);
}

// ============================================================
// EVENT: Submit the "Post a Trip" form.
// ============================================================
postForm.addEventListener('submit', async (e) => {
  // Prevent the browser's default form-submit (page reload)
  e.preventDefault();

  // Gather values from the input fields
  const from = document.getElementById('post-from').value.trim();
  const to   = document.getElementById('post-to').value.trim();
  const date = document.getElementById('post-date').value;
  const note = document.getElementById('post-note').value.trim();

  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, date, note })
    });

    const data = await res.json();

    if (!res.ok) {
      // Server returned a 4xx or 5xx error
      showPostMessage(data.error || 'Something went wrong.', 'error');
      return;
    }

    // Success! Clear the form and show confirmation
    postForm.reset();
    showPostMessage('Trip posted successfully!', 'success');

    // Refresh the trip list so the new post appears immediately
    fetchPosts();
  } catch (err) {
    console.error('Network error:', err);
    showPostMessage('Network error — is the server running?', 'error');
  }
});

// ============================================================
// EVENT: Submit the "Find a Trip" search form.
// ============================================================
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const from = document.getElementById('search-from').value.trim();
  const to   = document.getElementById('search-to').value.trim();
  const date = document.getElementById('search-date').value;

  fetchPosts({ from, to, date });
});

// ============================================================
// EVENT: "Show All" button clears filters and loads everything.
// ============================================================
clearBtn.addEventListener('click', () => {
  searchForm.reset();
  fetchPosts();
});

// ============================================================
// ON PAGE LOAD — Fetch and display all existing trips.
// ============================================================
fetchPosts();
