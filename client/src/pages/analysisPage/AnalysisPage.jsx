// OpenAIAnalysis.jsx
import { useEffect, useState } from "react";
import { fetchOpenAIAnalysis } from "@/api/api.js";
import "./analysisPage.scss";

const OpenAIAnalysis = () => {
  // Load initial products from localStorage or use default "Cursor"
  const [analysis, setAnalysis] = useState([]);
  const [filteredAnalysis, setFilteredAnalysis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters and sorting state
  const [products, setProducts] = useState(() => {
    try {
      const savedProducts = localStorage.getItem("analysis_products");
      return savedProducts ? JSON.parse(savedProducts) : ["Cursor"];
    } catch (err) {
      console.error("Error parsing products from localStorage:", err);
      return ["Cursor"];
    }
  });
  const [productInput, setProductInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [sortCriteria, setSortCriteria] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  // UI state
  const [expandedPainPoints, setExpandedPainPoints] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // Save products to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("analysis_products", JSON.stringify(products));
  }, [products]);

  // Fetch analysis from API
  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchOpenAIAnalysis({
        product: products, // Send array of products
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

  // Filter and sort analysis based on all criteria
  useEffect(() => {
    if (!analysis.length) return;

    let filtered = [...analysis];

    // Apply search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) => {
        // Search in product name
        if (item.product?.toLowerCase().includes(term)) return true;

        // Search in analysis summary
        if (item.analysis_summary?.toLowerCase().includes(term)) return true;

        // Search in pain points
        const painPointMatch = item.common_pain_points?.some(
          (point) =>
            point.name?.toLowerCase().includes(term) ||
            point.description?.toLowerCase().includes(term) ||
            (point.related_keywords &&
              point.related_keywords.some((kw) =>
                kw.toLowerCase().includes(term)
              ))
        );

        return painPointMatch;
      });
    }

    // Apply severity filter to pain points within each analysis
    if (severityFilter !== "all") {
      filtered = filtered
        .map((item) => ({
          ...item,
          common_pain_points: item.common_pain_points.filter(
            (point) => point.severity?.toLowerCase() === severityFilter
          ),
        }))
        .filter((item) => item.common_pain_points.length > 0);
    }

    // Sort the pain points within each analysis
    filtered = filtered.map((item) => {
      const sortedPainPoints = [...item.common_pain_points].sort((a, b) => {
        let valueA, valueB;

        // Determine sorting values based on criteria
        switch (sortCriteria) {
          case "name":
            valueA = a.name?.toLowerCase() || "";
            valueB = b.name?.toLowerCase() || "";
            break;
          case "severity": {
            const severityMap = { high: 3, medium: 2, low: 1 };
            valueA = severityMap[a.severity?.toLowerCase()] || 0;
            valueB = severityMap[b.severity?.toLowerCase()] || 0;
            break;
          }
          default:
            valueA = a.name?.toLowerCase() || "";
            valueB = b.name?.toLowerCase() || "";
        }

        // Apply sort direction
        return sortDirection === "asc"
          ? valueA > valueB
            ? 1
            : -1
          : valueA < valueB
          ? 1
          : -1;
      });

      return {
        ...item,
        common_pain_points: sortedPainPoints,
      };
    });

    setFilteredAnalysis(filtered);
  }, [analysis, searchTerm, severityFilter, sortCriteria, sortDirection]);

  // Toggle pain point expansion
  const togglePainPoint = (analysisIndex, pointIndex) => {
    const key = `${analysisIndex}-${pointIndex}`;
    setExpandedPainPoints((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle product input change
  const handleProductInputChange = (e) => {
    setProductInput(e.target.value);
  };

  // Add a product to the products array
  const addProduct = (e) => {
    e.preventDefault();
    if (productInput.trim() && !products.includes(productInput.trim())) {
      setProducts((prev) => [...prev, productInput.trim()]);
      setProductInput("");
    }
  };

  // Remove a product from the products array
  const removeProduct = (productToRemove) => {
    setProducts((prev) => prev.filter((p) => p !== productToRemove));
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

  // Handle sort criteria change
  const handleSortChange = (e) => {
    setSortCriteria(e.target.value);
  };

  // Handle sort direction change
  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  // Handle severity filter change
  const handleSeverityChange = (e) => {
    setSeverityFilter(e.target.value);
  };

  // Toggle advanced filters visibility
  const toggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  // Get severity badge class
  const getSeverityClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "severity-high";
      case "medium":
        return "severity-medium";
      case "low":
        return "severity-low";
      default:
        return "severity-unknown";
    }
  };

  return (
    <div className="analysis-container">
      <div className="analysis-header">
        <h2>OpenAI Analysis</h2>
        <p>AI-generated insights about pain points from Reddit discussions</p>
      </div>

      {/* Products Selection */}
      <div className="products-section">
        <form onSubmit={addProduct} className="product-form">
          <div className="input-group">
            <label>Add Product</label>
            <div className="product-input-container">
              <input
                type="text"
                value={productInput}
                onChange={handleProductInputChange}
                placeholder="Enter product name"
              />
              <button type="submit">Add</button>
            </div>
          </div>
        </form>

        <div className="selected-products">
          <label>Selected Products</label>
          <div className="product-tags">
            {products.map((prod, index) => (
              <div key={index} className="product-tag">
                <span>{prod}</span>
                <button
                  className="remove-product"
                  onClick={() => removeProduct(prod)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || products.length === 0}
          className="analyze-button"
        >
          {loading ? "Loading..." : "Analyze Products"}
        </button>
      </div>

      {/* Search */}
      <div className="search-section">
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

      {/* Advanced Filters Button */}
      <button className="toggle-filters-button" onClick={toggleFilters}>
        {showFilters ? "Hide Advanced Filters" : "Show Advanced Filters"}
      </button>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="advanced-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Severity Filter</label>
              <select
                value={severityFilter}
                onChange={handleSeverityChange}
                className="filter-select"
              >
                <option value="all">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sort By</label>
              <select
                value={sortCriteria}
                onChange={handleSortChange}
                className="filter-select"
              >
                <option value="name">Pain Point Name</option>
                <option value="severity">Severity</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sort Direction</label>
              <button
                className="sort-direction-button"
                onClick={toggleSortDirection}
              >
                {sortDirection === "asc" ? "Ascending ↑" : "Descending ↓"}
              </button>
            </div>
          </div>
        </div>
      )}

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
              {/* Pain points count */}
              {filteredAnalysis.reduce(
                (total, item) => total + item.common_pain_points.length,
                0
              ) > 0 && (
                <span className="pain-points-count">
                  {" "}
                  with{" "}
                  {filteredAnalysis.reduce(
                    (total, item) => total + item.common_pain_points.length,
                    0
                  )}{" "}
                  pain points
                </span>
              )}
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
                    {item.common_pain_points.length > 0 ? (
                      <div className="pain-points-list">
                        {item.common_pain_points.map((point, pointIndex) => {
                          const isExpanded =
                            expandedPainPoints[
                              `${analysisIndex}-${pointIndex}`
                            ];

                          return (
                            <div className="pain-point-item" key={pointIndex}>
                              <div className="pain-point-header">
                                <div className="pain-point-title">
                                  <h5>{point.name}</h5>
                                  <span
                                    className={`severity-badge ${getSeverityClass(
                                      point.severity
                                    )}`}
                                  >
                                    {point.severity || "Unknown"}
                                  </span>
                                </div>
                                <button
                                  className="expand-button"
                                  onClick={() =>
                                    togglePainPoint(analysisIndex, pointIndex)
                                  }
                                >
                                  {isExpanded ? "Show Less" : "Show More"}
                                </button>
                              </div>

                              <div
                                className={`pain-point-content ${
                                  isExpanded ? "expanded" : ""
                                }`}
                              >
                                <div className="pain-point-section">
                                  <h6>Description</h6>
                                  <p className="pain-point-description">
                                    {point.description}
                                  </p>
                                </div>

                                {point.potential_solutions && (
                                  <div className="pain-point-section">
                                    <h6>Potential Solutions</h6>
                                    <p className="pain-point-solutions">
                                      {point.potential_solutions}
                                    </p>
                                  </div>
                                )}

                                {point.related_keywords &&
                                  point.related_keywords.length > 0 && (
                                    <div className="pain-point-section">
                                      <h6>Related Keywords</h6>
                                      <div className="keywords-list">
                                        {point.related_keywords.map(
                                          (keyword, keywordIndex) => (
                                            <span
                                              key={keywordIndex}
                                              className="keyword-tag"
                                            >
                                              {keyword}
                                            </span>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="no-pain-points">
                        No pain points match your current filters.
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                {analysis.length > 0
                  ? "No analysis results match your search. Try different search terms or filters."
                  : "No analysis results available. Try selecting different products or check your API key."}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default OpenAIAnalysis;
