// Posts.jsx
import { useEffect, useState } from "react";
import { fetchPosts } from "@/api/api.js";
import "./postsPage.scss";

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // API filter options
  const [apiFilters, setApiFilters] = useState({
    product: "Cursor",
    has_pain_points: true,
    limit: 20,
    sort_by: "score",
    sort_order: "desc",
  });

  // Local filter options
  const [localFilters, setLocalFilters] = useState({
    minScore: "",
    maxScore: "",
    subreddit: "",
  });

  // Load posts from API
  const loadPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchPosts(apiFilters);
      setPosts(data.posts || []);
      setFilteredPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError("Failed to fetch posts. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Apply local filters and search
  useEffect(() => {
    if (posts.length === 0) return;

    let result = [...posts];

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (post) =>
          post.title?.toLowerCase().includes(term) ||
          post.body?.toLowerCase().includes(term) ||
          post.author?.toLowerCase().includes(term) ||
          post.subreddit?.toLowerCase().includes(term)
      );
    }

    // Apply min score filter
    if (localFilters.minScore !== "") {
      const minScore = parseInt(localFilters.minScore);
      result = result.filter((post) => post.score >= minScore);
    }

    // Apply max score filter
    if (localFilters.maxScore !== "") {
      const maxScore = parseInt(localFilters.maxScore);
      result = result.filter((post) => post.score <= maxScore);
    }

    // Apply subreddit filter
    if (localFilters.subreddit) {
      result = result.filter(
        (post) =>
          post.subreddit?.toLowerCase() === localFilters.subreddit.toLowerCase()
      );
    }

    setFilteredPosts(result);
  }, [posts, searchTerm, localFilters]);

  // Handle API filter changes
  const handleApiFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setApiFilters({
      ...apiFilters,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle local filter changes
  const handleLocalFilterChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters({
      ...localFilters,
      [name]: value,
    });
  };

  // Handle API filter form submission
  const handleApiSubmit = (e) => {
    e.preventDefault();
    loadPosts();
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle clearing all filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setLocalFilters({
      minScore: "",
      maxScore: "",
      subreddit: "",
    });
  };

  // Get unique subreddits for dropdown
  const uniqueSubreddits = [
    ...new Set(posts.map((post) => post.subreddit).filter(Boolean)),
  ];

  return (
    <div className="posts-container">
      <div className="posts-header">
        <h2>Scraped Posts</h2>
        <p>View and filter the most recent scraped posts from Reddit</p>
      </div>

      {/* API Filters Section */}
      <div className="filters-card">
        <h3 className="filters-title">API Filters</h3>
        <form onSubmit={handleApiSubmit}>
          <div className="filter-grid">
            <div className="filter-item">
              <label>Product</label>
              <input
                type="text"
                name="product"
                value={apiFilters.product}
                onChange={handleApiFilterChange}
              />
            </div>

            <div className="filter-item">
              <label>Limit</label>
              <input
                type="number"
                name="limit"
                min="1"
                max="100"
                value={apiFilters.limit}
                onChange={handleApiFilterChange}
              />
            </div>

            <div className="filter-item">
              <label>Sort By</label>
              <select
                name="sort_by"
                value={apiFilters.sort_by}
                onChange={handleApiFilterChange}
              >
                <option value="score">Score</option>
                <option value="created_at">Date</option>
                <option value="num_comments">Comments</option>
              </select>
            </div>

            <div className="filter-item">
              <label>Sort Order</label>
              <select
                name="sort_order"
                value={apiFilters.sort_order}
                onChange={handleApiFilterChange}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          <div className="filter-bottom">
            <div className="checkbox-container">
              <label>
                <input
                  type="checkbox"
                  name="has_pain_points"
                  checked={apiFilters.has_pain_points}
                  onChange={handleApiFilterChange}
                />
                <span>Only show posts with pain points</span>
              </label>
            </div>

            <button type="submit" className="fetch-button" disabled={loading}>
              {loading ? "Fetching..." : "Fetch Posts"}
            </button>
          </div>
        </form>
      </div>

      {/* Local Search and Filters */}
      <div className="search-filters-section">
        <div className="local-filters">
          <div className="filter-item">
            <input
              type="text"
              placeholder="Search in posts, titles, subreddits..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            <div className="search-icon">🔍</div>
          </div>
          <div className="filter-item">
            <label>Min Score</label>
            <input
              type="number"
              name="minScore"
              value={localFilters.minScore}
              onChange={handleLocalFilterChange}
              placeholder="Min"
            />
          </div>

          <div className="filter-item">
            <label>Max Score</label>
            <input
              type="number"
              name="maxScore"
              value={localFilters.maxScore}
              onChange={handleLocalFilterChange}
              placeholder="Max"
            />
          </div>

          <div className="filter-item">
            <label>Subreddit</label>
            <select
              name="subreddit"
              value={localFilters.subreddit}
              onChange={handleLocalFilterChange}
            >
              <option value="">All Subreddits</option>
              {uniqueSubreddits.map((subreddit) => (
                <option key={subreddit} value={subreddit}>
                  r/{subreddit}
                </option>
              ))}
            </select>
          </div>

          <button
            className="clear-button"
            onClick={handleClearFilters}
            type="button"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results Metadata */}
      <div className="results-meta">
        <span className="results-count">
          Showing {filteredPosts.length} of {posts.length} posts
        </span>
        {filteredPosts.length !== posts.length && (
          <span className="filtered-note">
            (filtered from {posts.length} total posts)
          </span>
        )}
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Loading State */}
      {loading ? (
        <div className="loading-indicator">Loading posts...</div>
      ) : (
        <div className="posts-list">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <div className="post-card" key={post.id}>
                <div className="post-header">
                  <h3 className="post-title">{post.title}</h3>
                  <div className="post-score">{post.score} points</div>
                </div>

                <div className="post-meta">
                  <span className="subreddit">r/{post.subreddit}</span>
                  <span className="separator">•</span>
                  <span className="author">u/{post.author}</span>
                  {post.created_at && (
                    <>
                      <span className="separator">•</span>
                      <span className="date">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>

                {post.body && (
                  <div className="post-body">
                    <p>
                      {post.body.length > 200
                        ? post.body.substring(0, 200) + "..."
                        : post.body}
                    </p>
                  </div>
                )}

                <div className="post-footer">
                  <div className="comments-count">
                    {post.num_comments || 0} comments
                  </div>
                  {post.url && (
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noretch postrrer"
                      className="view-button"
                    >
                      View on Reddit
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-posts">
              {posts.length > 0
                ? "No posts match your filters. Try adjusting your search criteria."
                : "No posts found. Try fetching posts using the controls above."}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Posts;
