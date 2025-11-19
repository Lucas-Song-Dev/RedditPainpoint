import { useState, useEffect } from "react";
import { triggerScrape, fetchStatus } from "@/api/api.js";
import { useNotification } from "@/context/NotificationContext";
import "./scrapePage.scss";
import PageHeader from "@/components/PageHeader/PageHeader";
import LoadingState from "@/components/LoadingState/LoadingState";

const ScrapePage = () => {
  const [loading, setLoading] = useState(false);
  const [scrapeInProgress, setScrapeInProgress] = useState(false);
  const { showNotification } = useNotification();
  const [customSubreddit, setCustomSubreddit] = useState("");
  const [customProduct, setCustomProduct] = useState("");
  const [errors, setErrors] = useState({});
  
  // Lists for random generation
  const CODING_SUBREDDITS = [
    "programming", "webdev", "learnprogramming", "Python", "javascript", 
    "reactjs", "node", "cscareerquestions", "MachineLearning", "compsci",
    "gamedev", "devops", "aws", "docker", "kubernetes", "linux", "git",
    "algorithms", "datascience", "cybersecurity"
  ];
  
  const SOFTWARE_PRODUCTS = [
    "Adobe", "Duolingo", "Word", "Replit", "Cursor", "VS Code", "GitHub",
    "Figma", "Notion", "Slack", "Discord", "Spotify", "Chrome", "Firefox",
    "Safari", "Windows", "macOS", "Linux", "Android", "iOS", "Photoshop",
    "Premiere", "After Effects", "Blender", "Unity", "Unreal Engine"
  ];

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
      use_openai: false,
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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.subreddits || formData.subreddits.length === 0) {
      newErrors.subreddits = "At least one subreddit is required";
    }
    
    if (!formData.products || formData.products.length === 0) {
      newErrors.products = "At least one product is required";
    }
    
    if (formData.limit < 1 || formData.limit > 500) {
      newErrors.limit = "Limit must be between 1 and 500";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleScrape = async () => {
    // Validate form before submitting
    if (!validateForm()) {
      showNotification("Please fix the errors in the form", "error");
      return;
    }
    
    setLoading(true);
    setErrors({});
    try {
      const data = await triggerScrape({
        products: formData.products,
        limit: parseInt(formData.limit),
        subreddits: formData.subreddits,
        time_filter: formData.time_filter,
        use_openai: false, // Analysis is now manual from product detail page
      });
      setScrapeInProgress(true);

      // Create a formatted message for the notification
      const notificationMessage = `Scraping job started! Products: ${data.products.join(", ")}, Subreddits: ${data.subreddits.join(", ")}, Limit: ${data.limit}, Time: ${data.time_filter}`;

      showNotification(notificationMessage, "info", 8000);

      // Trigger a custom event to notify StatusBar to refresh after a short delay
      // This gives the backend time to update the scrape_in_progress status
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('scrapeStarted'));
      }, 2000); // Wait 2 seconds for backend to update status
    } catch (err) {
      console.error(err);
      showNotification(err.message || "Failed to start scraping", "error");
    } finally {
      setLoading(false);
    }
  };

  const generateRandom = () => {
    // Generate 3-5 random subreddits
    const shuffledSubreddits = [...CODING_SUBREDDITS].sort(() => 0.5 - Math.random());
    const randomSubreddits = shuffledSubreddits.slice(0, Math.floor(Math.random() * 3) + 3);
    
    // Generate 1-3 random products
    const shuffledProducts = [...SOFTWARE_PRODUCTS].sort(() => 0.5 - Math.random());
    const randomProducts = shuffledProducts.slice(0, Math.floor(Math.random() * 3) + 1);
    
    setFormData({
      ...formData,
      subreddits: randomSubreddits,
      products: randomProducts,
    });
    
    setErrors({});
    showNotification("Generated random subreddits and products!", "success");
  };

  // Reset to default values
  const handleReset = () => {
    const defaultData = {
      subreddits: [],
      products: [],
      limit: 75,
      time_filter: "week",
      use_openai: false,
    };

    setFormData(defaultData);
    // Update localStorage with defaults
    localStorage.setItem("scrape_form_data", JSON.stringify(defaultData));
  };

  return (
    <div className="scrape-page">
      <PageHeader
        title="Scrape Reddit"
        description="Scrape posts from Reddit for analysis"
      />

      <div className="cards-container">
        {/* Subreddits Section */}
        <div className="card">
          <h2 className="card-title">Subreddits</h2>
          {errors.subreddits && (
            <div className="error-message">{errors.subreddits}</div>
          )}
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
          {errors.products && (
            <div className="error-message">{errors.products}</div>
          )}
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

        </div>
      </div>

      <div className="actions-container">
        <button
          onClick={handleReset}
          className="reset-button"
          disabled={loading}
        >
          Clear All
        </button>
        <button
          onClick={generateRandom}
          className="generate-button"
          disabled={loading || scrapeInProgress}
        >
          🎲 Generate Random
        </button>
        <button
          onClick={handleScrape}
          disabled={loading || scrapeInProgress}
          className="scrape-button"
        >
          {loading
            ? "Starting..."
            : scrapeInProgress
            ? "Scraping in Progress..."
            : "Start Scraping Reddit Posts"}
        </button>
      </div>
    </div>
  );
};

export default ScrapePage;
