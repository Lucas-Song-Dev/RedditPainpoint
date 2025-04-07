import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const DEFAULT_LIMIT = 100;
const DEFAULT_TIME_FILTER = "month";

/**
 * Trigger a scraping job on Reddit
 * @param {{
 *   reddit_client_id: string,
 *   reddit_client_secret: string,
 *   openai_api_key?: string,
 *   products?: string[],
 *   limit?: number,
 *   subreddits?: string[],
 *   time_filter?: string,
 *   use_openai?: boolean
 * }} options
 */
export const triggerScrape = async (options) => {
  const {
    reddit_client_id,
    reddit_client_secret,
    openai_api_key,
    products = [],
    limit = DEFAULT_LIMIT,
    subreddits = [],
    time_filter = DEFAULT_TIME_FILTER,
    use_openai = false,
  } = options;

  const payload = {
    reddit_client_id,
    reddit_client_secret,
    openai_api_key: use_openai ? openai_api_key : undefined,
    products,
    limit,
    subreddits,
    time_filter,
    use_openai,
  };

  // eslint-disable-next-line no-useless-catch
  try {
    const res = await axios.post(`${API_BASE}/scrape`, payload);
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
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};

/**
 * Get recommendations for addressing pain points
 * @param {{
 *   product?: string | string[],
 *   min_severity?: number,
 *   openai_api_key: string
 * }} options
 */
export const fetchRecommendations = async ({
  product,
  min_severity,
  openai_api_key,
}) => {
  // eslint-disable-next-line no-useless-catch
  try {
    // Handle array of products
    let params = {};

    if (Array.isArray(product)) {
      params.products = product.join(",");
    } else if (product) {
      params.product = product;
    }

    if (min_severity !== undefined) {
      params.min_severity = min_severity;
    }

    const res = await axios.get(`${API_BASE}/recommendations`, {
      params: params,
      headers: {
        "X-OpenAI-API-Key": openai_api_key,
      },
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
 *   openai_api_key: string
 * }} options
 */
export const fetchOpenAIAnalysis = async ({ product, openai_api_key }) => {
  console.log("🚀 ~ fetchOpenAIAnalysis ~ product:", product);
  // eslint-disable-next-line no-useless-catch
  try {
    const res = await axios.get(`${API_BASE}/openai-analysis`, {
      params: { products: product },
      headers: {
        "X-OpenAI-API-Key": openai_api_key,
      },
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};

/**
 * Get scraper/status/connection info
 * @param {{
 *   reddit_client_id?: string,
 *   reddit_client_secret?: string,
 *   openai_api_key?: string
 * }} options
 */
export const fetchStatus = async ({
  reddit_client_id,
  reddit_client_secret,
  openai_api_key,
} = {}) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const res = await axios.get(`${API_BASE}/status`, {
      params: {
        reddit_client_id,
        reddit_client_secret,
        openai_api_key,
      },
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};
