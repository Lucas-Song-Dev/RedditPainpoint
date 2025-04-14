import { useState, useEffect } from "react";
import { triggerScrape, fetchStatus } from "@/api/api.js";
import { useNotification } from "@/context/NotificationContext";
import "./ScrapePage.scss";

const ScrapePage = () => {
  const [loading, setLoading] = useState(false);
  const [scrapeInProgress, setScrapeInProgress] = useState(false);
  const { showNotification } = useNotification();
  const [customSubreddit, setCustomSubreddit] = useState("");
  const [customProduct, setCustomProduct] = useState("");

  // Initialize form data from localStorage or use defaults
  const [formData, setFormData] = useState(() => {
    try {
      const savedData = localStorage.getItem("scrape_form_data");
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (err) {
      console.error("Error parsing localStorage data:", err);
    }

    // Default values if nothing in localStorage
    return {
      subreddits: ["webdev", "python"],
      products: ["cursor", "replit"],
      limit: 75,
      time_filter: "week",
      use_openai: true,
    };
  });

  // Periodically check scrape status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await fetchStatus();
        setScrapeInProgress(status.scrape_in_progress);

        // If scrape was in progress but now completed, show notification
        if (scrapeInProgress && !status.scrape_in_progress) {
          showNotification("Scraping job completed!", "success");
          setScrapeInProgress(false);
        }
      } catch (err) {
        console.error("Error fetching status:", err);
      }
    };

    // Check immediately
    checkStatus();

    // Then set up interval
    const intervalId = setInterval(checkStatus, 10000); // Check every 10 seconds

    return () => clearInterval(intervalId);
  }, [scrapeInProgress, showNotification]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("scrape_form_data", JSON.stringify(formData));
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const removeSubreddit = (subredditToRemove) => {
    setFormData({
      ...formData,
      subreddits: formData.subreddits.filter(
        (subreddit) => subreddit !== subredditToRemove
      ),
    });
  };

  const removeProduct = (productToRemove) => {
    setFormData({
      ...formData,
      products: formData.products.filter(
        (product) => product !== productToRemove
      ),
    });
  };

  const addCustomSubreddit = () => {
    if (customSubreddit && !formData.subreddits.includes(customSubreddit)) {
      setFormData({
        ...formData,
        subreddits: [...formData.subreddits, customSubreddit],
      });
      setCustomSubreddit("");
    }
  };

  const addCustomProduct = () => {
    if (customProduct && !formData.products.includes(customProduct)) {
      setFormData({
        ...formData,
        products: [...formData.products, customProduct],
      });
      setCustomProduct("");
    }
  };

  const handleScrape = async () => {
    setLoading(true);
    try {
      const data = await triggerScrape({
        products: formData.products,
        limit: parseInt(formData.limit),
        subreddits: formData.subreddits,
        time_filter: formData.time_filter,
        use_openai: formData.use_openai,
      });
      setScrapeInProgress(true);

      // Create a formatted message for the notification
      const notificationMessage = `
        Scraping job started successfully!
        
        Products: ${data.products.join(", ")}
        Subreddits: ${data.subreddits.join(", ")}
        Limit: ${data.limit}
        Time filter: ${data.time_filter}
        Using OpenAI: ${data.use_openai ? "Yes" : "No"}
      `;

      showNotification(notificationMessage, "info");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Reset to default values
  const handleReset = () => {
    const defaultData = {
      subreddits: [],
      products: [],
      limit: 75,
      time_filter: "week",
      use_openai: true,
    };

    setFormData(defaultData);
    // Update localStorage with defaults
    localStorage.setItem("scrape_form_data", JSON.stringify(defaultData));
  };

  return (
    <div className="scrape-page">
      <h1 className="page-title">Reddit Scraping Tool</h1>

      <div className="cards-container">
        {/* Subreddits Section */}
        <div className="card">
          <h2 className="card-title">Subreddits</h2>
          <div className="tags-container">
            {formData.subreddits.map((subreddit) => (
              <div key={subreddit} className="tag subreddit-tag">
                <span>r/{subreddit}</span>
                <button
                  className="delete-button"
                  onClick={() => removeSubreddit(subreddit)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="input-group">
            <input
              type="text"
              value={customSubreddit}
              onChange={(e) => setCustomSubreddit(e.target.value)}
              placeholder="Add custom subreddit"
              className="custom-input"
            />
            <button onClick={addCustomSubreddit} className="add-button">
              Add
            </button>
          </div>
        </div>

        {/* Products Section */}
        <div className="card">
          <h2 className="card-title">Products</h2>
          <div className="tags-container">
            {formData.products.map((product) => (
              <div key={product} className="tag product-tag">
                <span>{product}</span>
                <button
                  className="delete-button"
                  onClick={() => removeProduct(product)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="input-group">
            <input
              type="text"
              value={customProduct}
              onChange={(e) => setCustomProduct(e.target.value)}
              placeholder="Add custom product"
              className="custom-input"
            />
            <button onClick={addCustomProduct} className="add-button">
              Add
            </button>
          </div>
        </div>

        {/* Settings Section */}
        <div className="card">
          <h2 className="card-title">Settings</h2>

          <div className="settings-grid">
            <div className="setting-item">
              <label className="setting-label">Time Filter</label>
              <select
                name="time_filter"
                value={formData.time_filter}
                onChange={handleInputChange}
                className="select-input"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div className="setting-item">
              <label className="setting-label">Post Limit</label>
              <input
                type="number"
                name="limit"
                value={formData.limit}
                onChange={handleInputChange}
                min="1"
                max="100"
                className="number-input"
              />
            </div>
          </div>

          <div className="checkbox-container">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="use_openai"
                checked={formData.use_openai}
                onChange={handleInputChange}
              />
              <span>Use OpenAI</span>
            </label>
          </div>
        </div>
      </div>

      <div className="actions-container">
        <button
          onClick={handleScrape}
          disabled={
            loading ||
            scrapeInProgress ||
            formData.subreddits.length === 0 ||
            formData.products.length === 0
          }
          className="scrape-button"
        >
          {loading
            ? "Starting..."
            : scrapeInProgress
            ? "Scraping in Progress..."
            : "Start Scraping Reddit Posts"}
        </button>
        <button
          onClick={handleReset}
          className="reset-button"
          disabled={loading}
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default ScrapePage;
