// StatusBar.jsx
import { useEffect, useState } from "react";
import { fetchStatus } from "@/api/api.js";
import "./statusBar.scss";

const StatusBar = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const getStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchStatus({
        openai_api_key: import.meta.env.VITE_OPENAI_API_KEY,
      });
      setStatus(data);
    } catch (err) {
      console.error("Error fetching status:", err);
      setError("Failed to fetch status information.");
    } finally {
      setLoading(false);
    }
  };

  // Initialize status on component mount
  useEffect(() => {
    getStatus();

    // Set up polling every 15 seconds if scrape is in progress
    const intervalId = setInterval(() => {
      if (status?.scrape_in_progress) {
        getStatus();
      }
    }, 15000);

    return () => clearInterval(intervalId);
  }, [status?.scrape_in_progress]);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const formatTime = (timeString) => {
    if (!timeString) return "Never";

    try {
      const date = new Date(timeString);
      return date.toLocaleString();
    } catch (e) {
      console.log("ERROR: ", e);
      return timeString;
    }
  };

  const getApiStatusClass = (apiStatus) => {
    return apiStatus === "connected" ? "status-connected" : "status-error";
  };

  if (loading && !status) {
    return (
      <div className="status-bar status-loading">
        <div className="status-loading-text">
          <div className="loading-animation">
            <div className="loading-circle"></div>
            <div className="loading-circle"></div>
            <div className="loading-circle"></div>
          </div>
          Loading status...
        </div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="status-bar status-error">
        <div className="status-error-content">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={getStatus} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div
      className={`status-bar ${
        status.scrape_in_progress ? "scrape-active" : ""
      }`}
    >
      <div className="status-summary" onClick={toggleExpanded}>
        <div className="status-indicator">
          {status.scrape_in_progress ? (
            <>
              <span className="status-icon spinning">🔄</span>
              <span className="status-text">Scrape in progress...</span>
            </>
          ) : (
            <>
              <span className="status-icon">✅</span>
              <span className="status-text">Scraper ready</span>
            </>
          )}
        </div>

        <div className="status-quick-info">
          <div className="status-stat">
            <span className="stat-label">Posts:</span>
            <span className="stat-value">{status.raw_posts_count}</span>
          </div>
          <div className="status-stat">
            <span className="stat-label">Pain Points:</span>
            <span className="stat-value">{status.pain_points_count}</span>
          </div>
          <div className="status-stat">
            <span className="stat-label">Last Scrape:</span>
            <span className="stat-value">
              {formatTime(status.last_scrape_time)}
            </span>
          </div>
        </div>

        <button className="toggle-details-button">
          {expanded ? "Hide Details" : "Show Details"}
        </button>
      </div>

      {expanded && (
        <div className="status-details">
          <div className="status-section">
            <h4>API Connections</h4>
            <div className="api-connections">
              <div
                className={`api-status ${getApiStatusClass(
                  status.apis.reddit
                )}`}
              >
                <span className="api-name">Reddit API:</span>
                <span className="api-state">{status.apis.reddit}</span>
              </div>
              <div
                className={`api-status ${getApiStatusClass(
                  status.apis.openai
                )}`}
              >
                <span className="api-name">OpenAI API:</span>
                <span className="api-state">{status.apis.openai}</span>
              </div>
            </div>
          </div>

          <div className="status-section">
            <h4>Data Statistics</h4>
            <div className="status-grid">
              <div className="status-stat-detailed">
                <span className="stat-label">Raw Posts:</span>
                <span className="stat-value">{status.raw_posts_count}</span>
              </div>
              <div className="status-stat-detailed">
                <span className="stat-label">Analyzed Posts:</span>
                <span className="stat-value">
                  {status.analyzed_posts_count}
                </span>
              </div>
              <div className="status-stat-detailed">
                <span className="stat-label">Pain Points:</span>
                <span className="stat-value">{status.pain_points_count}</span>
              </div>
              <div className="status-stat-detailed">
                <span className="stat-label">OpenAI Analyses:</span>
                <span className="stat-value">
                  {status.openai_analyses_count}
                </span>
              </div>
            </div>
          </div>

          {status.subreddits_scraped && status.subreddits_scraped.length > 0 && (
            <div className="status-section">
              <h4>Subreddits Scraped</h4>
              <div className="subreddit-tags">
                {status.subreddits_scraped.map((subreddit, index) => (
                  <span key={index} className="subreddit-tag">
                    r/{subreddit}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="status-actions">
            <button onClick={getStatus} className="refresh-button">
              {loading ? "Refreshing..." : "Refresh Status"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusBar;
