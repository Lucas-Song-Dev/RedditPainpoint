import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const DEFAULT_LIMIT = 100;
const DEFAULT_TIME_FILTER = "month";

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

  // eslint-disable-next-line no-useless-catch
  try {
    const res = await axios.post(`${API_BASE}/scrape`, payload, {
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};

/**
 * Get all scraped posts
 * @param {Object} filters - All optional query filters
 * @returns {Promise<Object>}
 */
export const fetchPosts = async (filters = {}) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const res = await axios.get(`${API_BASE}/posts`, {
      params: filters,
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
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
  // eslint-disable-next-line no-useless-catch
  try {
    const res = await axios.post(`${API_BASE}/register`, userData, {
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
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
  // eslint-disable-next-line no-useless-catch
  try {
    const res = await axios.post(`${API_BASE}/login`, credentials, {
      withCredentials: true, // Important for cookies to be received
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};

/**
 * Logout and clear credentials
 * @returns {Promise<Object>}
 */
export const logoutUser = async () => {
  // eslint-disable-next-line no-useless-catch
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
  // eslint-disable-next-line no-useless-catch
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
  // eslint-disable-next-line no-useless-catch
  try {
    const requestData = {
      products: Array.isArray(products) ? products : [],
    };

    const res = await axios.post(`${API_BASE}/recommendations`, requestData, {
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
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
  // eslint-disable-next-line no-useless-catch
  try {
    const res = await axios.get(`${API_BASE}/pain-points`, {
      params: filters,
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
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
  console.log("🚀 ~ fetchOpenAIAnalysis ~ product:", product);
  // eslint-disable-next-line no-useless-catch
  try {
    const res = await axios.get(`${API_BASE}/openai-analysis`, {
      params: { products: product },
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};

/**
 * Get scraper/status/connection info
 */
export const fetchStatus = async () => {
  // eslint-disable-next-line no-useless-catch
  try {
    const res = await axios.get(`${API_BASE}/status`, {
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};
