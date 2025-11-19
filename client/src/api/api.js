import axios from "axios";

// Get API base URL from environment, with fallback for local development
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const DEFAULT_LIMIT = 100;
const DEFAULT_TIME_FILTER = "month";

// Log API base URL in development to help debug
if (import.meta.env.DEV) {
  console.log("API Base URL:", API_BASE);
}

/**
 * Trigger a scraping job on Reddit
 * @param {{
 *   products?: string[],
 *   limit?: number,
 *   subreddits?: string[],
 *   time_filter?: string,
 *   use_openai?: boolean
 * }} options
 */
export const triggerScrape = async (options) => {
  const {
    products = [],
    limit = DEFAULT_LIMIT,
    subreddits = [],
    time_filter = DEFAULT_TIME_FILTER,
    use_openai = false,
  } = options;

  const payload = {
    products,
    limit,
    subreddits,
    time_filter,
    use_openai,
  };

  try {
    const res = await axios.post(`${API_BASE}/scrape`, payload, {
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    if (err.response?.data) {
      throw new Error(err.response.data.message || "Scraping failed");
    }
    throw err;
  }
};

/**
 * Get all scraped posts
 * @param {Object} filters - All optional query filters
 * @returns {Promise<Object>}
 */
export const fetchPosts = async (filters = {}) => {
  try {
    const res = await axios.get(`${API_BASE}/posts`, {
      params: filters,
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    if (err.response?.data) {
      throw new Error(err.response.data.message || "Failed to fetch posts");
    }
    throw err;
  }
};

/**
 * Register a new user
 * @param {{
 *   username: string,
 *   password: string,
 *   email?: string
 * }} userData
 */
export const registerUser = async (userData) => {
  try {
    const res = await axios.post(`${API_BASE}/register`, userData, {
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    // Return error response data if available, otherwise throw
    if (err.response?.data) {
      throw new Error(err.response.data.message || "Registration failed");
    }
    throw err;
  }
};

/**
 * Login to the application
 * @param {{
 *   username: string,
 *   password: string
 * }} credentials
 */
export const loginUser = async (credentials) => {
  try {
    const res = await axios.post(`${API_BASE}/login`, credentials, {
      withCredentials: true, // Important for cookies to be received
    });
    return res.data;
  } catch (err) {
    // Return error response data if available, otherwise throw
    if (err.response?.data) {
      throw new Error(err.response.data.message || "Login failed");
    }
    throw err;
  }
};

/**
 * Logout and clear credentials
 * @returns {Promise<Object>}
 */
export const logoutUser = async () => {
  try {
    const res = await axios.post(
      `${API_BASE}/logout`,
      {},
      {
        withCredentials: true, // Important for cookies to be sent
      }
    );
    return res.data;
  } catch (err) {
    // Even if logout fails on server, we should still clear local state
    // Return error response data if available, otherwise throw
    if (err.response?.data) {
      throw new Error(err.response.data.message || "Logout failed");
    }
    throw err;
  }
};

/**
 * Get saved recommendations without generating new ones
 * @param {{
 *   products?: string[]
 * }} options
 */
export const fetchSavedRecommendations = async ({ products }) => {
  try {
    let params = {};
    if (Array.isArray(products) && products.length > 0) {
      // Convert array to products[] format for query params
      products.forEach((product) => {
        params["products[]"] = params["products[]"] || [];
        params["products[]"].push(product);
      });
    }

    const res = await axios.get(`${API_BASE}/recommendations`, {
      params: params,
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    if (err.response?.data) {
      throw new Error(err.response.data.message || "Failed to fetch recommendations");
    }
    throw err;
  }
};

/**
 * Generate new recommendations using OpenAI
 * @param {{
 *   products?: string[]
 * }} options
 */
export const generateRecommendations = async ({ products }) => {
  try {
    const requestData = {
      products: Array.isArray(products) ? products : [],
    };

    const res = await axios.post(`${API_BASE}/recommendations`, requestData, {
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    if (err.response?.data) {
      throw new Error(err.response.data.message || "Failed to generate recommendations");
    }
    throw err;
  }
};

/**
 * Get pain points for a product
 * @param {Object} filters
 * @param {string} [filters.product]
 * @param {number} [filters.limit]
 * @param {number} [filters.min_severity]
 */
export const fetchPainPoints = async (filters = {}) => {
  try {
    const res = await axios.get(`${API_BASE}/pain-points`, {
      params: filters,
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    if (err.response?.data) {
      throw new Error(err.response.data.message || "Failed to fetch pain points");
    }
    throw err;
  }
};

/**
 * Get OpenAI-generated analysis of pain points
 * @param {{
 *   products?: string[]
 * }} options
 */
export const fetchOpenAIAnalysis = async ({ product }) => {
  try {
    const res = await axios.get(`${API_BASE}/openai-analysis`, {
      params: { products: product },
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    if (err.response?.data) {
      throw new Error(err.response.data.message || "Failed to fetch OpenAI analysis");
    }
    throw err;
  }
};

/**
 * Get list of all products that have posts (whether analyzed or not)
 */
export const fetchAllProducts = async () => {
  try {
    const res = await axios.get(`${API_BASE}/all-products`, {
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    if (err.response?.data) {
      throw new Error(err.response.data.message || "Failed to fetch all products");
    }
    throw err;
  }
};

/**
 * Run OpenAI analysis for a specific product
 * @param {{ product: string }} options
 */
export const runAnalysis = async ({ product }) => {
  try {
    const res = await axios.post(
      `${API_BASE}/run-analysis`,
      { product },
      {
        withCredentials: true,
      }
    );
    return res.data;
  } catch (err) {
    if (err.response?.data) {
      throw new Error(err.response.data.message || "Failed to run analysis");
    }
    throw err;
  }
};

/**
 * Get scraper/status/connection info
 */
export const fetchStatus = async () => {
  try {
    const res = await axios.get(`${API_BASE}/status`, {
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    // Don't throw for 401/403 - let AuthContext handle it
    if (err.response?.status === 401 || err.response?.status === 403) {
      throw err;
    }
    if (err.response?.data) {
      throw new Error(err.response.data.message || "Failed to fetch status");
    }
    throw err;
  }
};
