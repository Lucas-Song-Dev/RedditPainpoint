// API service to handle all backend requests

const API = {
  // Base URL for API endpoints
  baseURL: '/api',

  // Helper function to make API requests
  async request(endpoint, method = 'GET', data = null) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Something went wrong');
      }

      return responseData;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  },

  // Initialize default data
  initializeData() {
    return this.request('/init', 'POST');
  },

  // Get all products
  getProducts() {
    return this.request('/products');
  },

  // Get pain points for a specific product
  getProductPainPoints(productId) {
    return this.request(`/products/${productId}/pain-points`);
  },

  // Get Reddit posts for a specific pain point
  getPainPointPosts(painPointId) {
    return this.request(`/pain-points/${painPointId}/posts`);
  },

  // Get statistics
  getStats(productId = null) {
    const endpoint = productId ? `/stats?product_id=${productId}` : '/stats';
    return this.request(endpoint);
  },

  // Scrape Reddit for a product
  scrapeReddit(productName, subreddits = []) {
    return this.request('/scrape', 'POST', { product_name: productName, subreddits });
  }
};

// Export the API service
window.API = API;
