// OpenAIAnalysis.jsx
import { useEffect, useState } from "react";
import { fetchOpenAIAnalysis } from "@/api/api.js";
import "./analysisPage.scss";

const OpenAIAnalysis = () => {
  const [analysis, setAnalysis] = useState([]);
  const [filteredAnalysis, setFilteredAnalysis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState("Cursor");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedPainPoints, setExpandedPainPoints] = useState({});

  // Fetch analysis from API
  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchOpenAIAnalysis({
        product,
        openai_api_key: import.meta.env.VITE_OPENAI_API_KEY,
      });

      setAnalysis(data.analyses || []);
      setFilteredAnalysis(data.analyses || []);
    } catch (err) {
      console.error("Error fetching analysis:", err);
      setError(
        "Failed to fetch analysis. Please check your API key and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchAnalysis();
  }, []);

  // Filter analysis based on search term
  useEffect(() => {
    if (!analysis.length) return;

    if (!searchTerm.trim()) {
      setFilteredAnalysis(analysis);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = analysis.filter((item) => {
      // Search in product name
      if (item.product?.toLowerCase().includes(term)) return true;

      // Search in analysis summary
      if (item.analysis_summary?.toLowerCase().includes(term)) return true;

      // Search in pain points
      const painPointMatch = item.common_pain_points?.some(
        (point) =>
          point.name?.toLowerCase().includes(term) ||
          point.description?.toLowerCase().includes(term)
      );

      return painPointMatch;
    });

    setFilteredAnalysis(filtered);
  }, [analysis, searchTerm]);

  // Toggle pain point expansion
  const togglePainPoint = (analysisIndex, pointIndex) => {
    const key = `${analysisIndex}-${pointIndex}`;
    setExpandedPainPoints((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle product input change
  const handleProductChange = (e) => {
    setProduct(e.target.value);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    fetchAnalysis();
  };

  return (
    <div className="analysis-container">
      <div className="analysis-header">
        <h2>OpenAI Analysis</h2>
        <p>AI-generated insights about pain points from Reddit discussions</p>
      </div>

      {/* Filters and Search */}
      <div className="analysis-filters">
        <form onSubmit={handleSubmit} className="product-form">
          <div className="input-group">
            <label>Product</label>
            <div className="product-input-container">
              <input
                type="text"
                value={product}
                onChange={handleProductChange}
                placeholder="Enter product name"
              />
              <button type="submit" disabled={loading}>
                {loading ? "Loading..." : "Analyze"}
              </button>
            </div>
          </div>
        </form>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search in analyses and pain points..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          <div className="search-icon">🔍</div>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Loading State */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-animation">
            <div className="loading-circle"></div>
            <div className="loading-circle"></div>
            <div className="loading-circle"></div>
          </div>
          <p>Analyzing Reddit feedback with OpenAI...</p>
        </div>
      ) : (
        <>
          {/* Results Metadata */}
          {filteredAnalysis.length > 0 && (
            <div className="results-meta">
              Found {filteredAnalysis.length} analysis result
              {filteredAnalysis.length !== 1 ? "s" : ""}
              {searchTerm &&
                filteredAnalysis.length !== analysis.length &&
                ` (filtered from ${analysis.length} total)`}
            </div>
          )}

          {/* Analysis Results */}
          <div className="analysis-results">
            {filteredAnalysis.length > 0 ? (
              filteredAnalysis.map((item, analysisIndex) => (
                <div className="analysis-card" key={analysisIndex}>
                  <div className="analysis-card-header">
                    <h3>{item.product}</h3>
                  </div>

                  <div className="analysis-summary">
                    <h4>Analysis Summary</h4>
                    <p>{item.analysis_summary}</p>
                  </div>

                  <div className="pain-points-section">
                    <h4>Common Pain Points</h4>
                    <div className="pain-points-list">
                      {item.common_pain_points.map((point, pointIndex) => {
                        const isExpanded =
                          expandedPainPoints[`${analysisIndex}-${pointIndex}`];
                        const descriptionLength =
                          point.description?.length || 0;

                        return (
                          <div className="pain-point-item" key={pointIndex}>
                            <div className="pain-point-header">
                              <h5>{point.name}</h5>
                              {descriptionLength > 100 && (
                                <button
                                  className="expand-button"
                                  onClick={() =>
                                    togglePainPoint(analysisIndex, pointIndex)
                                  }
                                >
                                  {isExpanded ? "Show Less" : "Show More"}
                                </button>
                              )}
                            </div>
                            <p
                              className={`pain-point-description ${
                                isExpanded ? "expanded" : ""
                              }`}
                            >
                              {descriptionLength > 100 && !isExpanded
                                ? `${point.description.substring(0, 100)}...`
                                : point.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                {analysis.length > 0
                  ? "No analysis results match your search. Try different search terms."
                  : "No analysis results available. Try a different product or check your API key."}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default OpenAIAnalysis;
