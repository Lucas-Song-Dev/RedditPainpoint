// Dashboard component for displaying pain points and visualizations

const Dashboard = () => {
  const [products, setProducts] = React.useState([]);
  const [selectedProduct, setSelectedProduct] = React.useState(null);
  const [painPoints, setPainPoints] = React.useState([]);
  const [stats, setStats] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [selectedPainPoint, setSelectedPainPoint] = React.useState(null);
  const [painPointPosts, setPainPointPosts] = React.useState([]);
  const [scrapeForm, setScrapeForm] = React.useState({
    productName: '',
    subreddits: '',
    isLoading: false,
    message: null
  });
  
  // Fetch products on component mount
  React.useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // Initialize default data
        await API.initializeData();
        
        // Get products
        const productsResponse = await API.getProducts();
        setProducts(productsResponse.products);
        
        // Get stats
        const statsResponse = await API.getStats();
        setStats(statsResponse.stats);
        
        // Select first product if available
        if (productsResponse.products.length > 0) {
          setSelectedProduct(productsResponse.products[0]);
          fetchPainPoints(productsResponse.products[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch initial data');
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Fetch pain points for a product
  const fetchPainPoints = async (productId) => {
    try {
      setLoading(true);
      const response = await API.getProductPainPoints(productId);
      setPainPoints(response.pain_points);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch pain points');
      setLoading(false);
    }
  };
  
  // Handle product selection change
  const handleProductChange = (e) => {
    const productId = parseInt(e.target.value, 10);
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product);
    setSelectedPainPoint(null);
    setPainPointPosts([]);
    fetchPainPoints(productId);
  };
  
  // View details of a pain point
  const handleViewPainPointDetails = async (painPointId) => {
    try {
      setLoading(true);
      // Find the selected pain point
      const painPoint = painPoints.find(pp => pp.id === painPointId);
      setSelectedPainPoint(painPoint);
      
      // Fetch related posts
      const response = await API.getPainPointPosts(painPointId);
      setPainPointPosts(response.posts);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch pain point details');
      setLoading(false);
    }
  };
  
  // Go back to pain point list
  const handleBackToList = () => {
    setSelectedPainPoint(null);
    setPainPointPosts([]);
  };
  
  // Handle form input changes
  const handleScrapeFormChange = (e) => {
    const { name, value } = e.target;
    setScrapeForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Submit scrape form
  const handleScrapeSubmit = async (e) => {
    e.preventDefault();
    try {
      setScrapeForm(prev => ({ ...prev, isLoading: true, message: null }));
      
      // Split subreddits by comma
      const subreddits = scrapeForm.subreddits
        .split(',')
        .map(s => s.trim())
        .filter(s => s);
      
      // Call API to scrape Reddit
      const response = await API.scrapeReddit(scrapeForm.productName, subreddits);
      
      // Update form with success message
      setScrapeForm(prev => ({
        ...prev,
        isLoading: false,
        message: { type: 'success', text: response.message }
      }));
      
      // Refresh products list
      const productsResponse = await API.getProducts();
      setProducts(productsResponse.products);
      
      // Refresh stats
      const statsResponse = await API.getStats();
      setStats(statsResponse.stats);
      
      // Select the product we just scraped
      const newProduct = productsResponse.products.find(p => p.name === scrapeForm.productName);
      if (newProduct) {
        setSelectedProduct(newProduct);
        fetchPainPoints(newProduct.id);
      }
      
    } catch (err) {
      setScrapeForm(prev => ({
        ...prev,
        isLoading: false,
        message: { type: 'danger', text: err.message || 'Failed to scrape Reddit' }
      }));
    }
  };
  
  // Filter stats for the selected product
  const getProductStats = () => {
    if (!selectedProduct) return [];
    return stats.filter(stat => stat.product_name === selectedProduct.name);
  };
  
  return (
    <div className="dashboard">
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </div>
      )}
      
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title mb-3">
                <i className="fas fa-chart-bar me-2"></i>
                Pain Point Dashboard
              </h4>
              
              <div className="form-group mb-4">
                <label htmlFor="productSelect" className="form-label">Select Product:</label>
                <select 
                  id="productSelect" 
                  className="form-select"
                  value={selectedProduct?.id || ''}
                  onChange={handleProductChange}
                  disabled={loading || products.length === 0}
                >
                  {products.length === 0 ? (
                    <option value="">No products available</option>
                  ) : (
                    products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading data...</p>
                </div>
              ) : selectedPainPoint ? (
                <PainPointDetail 
                  painPoint={selectedPainPoint}
                  posts={painPointPosts}
                  onBack={handleBackToList}
                />
              ) : (
                <div className="pain-points-list">
                  <h5 className="mb-3">
                    {selectedProduct ? `Pain Points for ${selectedProduct.name}` : 'Select a product to view pain points'}
                  </h5>
                  
                  {painPoints.length === 0 ? (
                    <div className="alert alert-info">
                      <i className="fas fa-info-circle me-2"></i>
                      No pain points found for this product. Use the scraper to collect data.
                    </div>
                  ) : (
                    <div className="row">
                      {painPoints.map(painPoint => (
                        <div key={painPoint.id} className="col-md-6">
                          <PainPointCard 
                            painPoint={painPoint}
                            onViewDetails={handleViewPainPointDetails}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-body">
              <h4 className="card-title mb-3">
                <i className="fas fa-search me-2"></i>
                Scrape Reddit
              </h4>
              
              <form onSubmit={handleScrapeSubmit}>
                <div className="mb-3">
                  <label htmlFor="productName" className="form-label">Product Name:</label>
                  <input
                    type="text"
                    id="productName"
                    name="productName"
                    className="form-control"
                    value={scrapeForm.productName}
                    onChange={handleScrapeFormChange}
                    placeholder="e.g., Cursor, Replit"
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="subreddits" className="form-label">Subreddits (comma-separated):</label>
                  <input
                    type="text"
                    id="subreddits"
                    name="subreddits"
                    className="form-control"
                    value={scrapeForm.subreddits}
                    onChange={handleScrapeFormChange}
                    placeholder="e.g., programming, webdev"
                  />
                  <div className="form-text">Leave empty to search across all of Reddit.</div>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary w-100"
                  disabled={scrapeForm.isLoading || !scrapeForm.productName}
                >
                  {scrapeForm.isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Scraping...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-spider me-2"></i>
                      Scrape Data
                    </>
                  )}
                </button>
              </form>
              
              {scrapeForm.message && (
                <div className={`alert alert-${scrapeForm.message.type} mt-3`}>
                  {scrapeForm.message.text}
                </div>
              )}
            </div>
          </div>
          
          <div className="card">
            <div className="card-body">
              <h4 className="card-title mb-3">
                <i className="fas fa-info-circle me-2"></i>
                Product Info
              </h4>
              
              {selectedProduct ? (
                <div>
                  <h5>{selectedProduct.name}</h5>
                  <p className="text-muted">{selectedProduct.description || 'No description available'}</p>
                  
                  <div className="mt-3">
                    <strong>Stats:</strong>
                    <ul className="list-group mt-2">
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        Pain Points
                        <span className="badge bg-primary rounded-pill">{painPoints.length}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        Total Mentions
                        <span className="badge bg-primary rounded-pill">
                          {painPoints.reduce((sum, pp) => sum + pp.frequency, 0)}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-muted">Select a product to view information</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title mb-3">
                <i className="fas fa-chart-pie me-2"></i>
                Data Visualization
              </h4>
              
              <ul className="nav nav-tabs mb-3" id="visualizationTabs" role="tablist">
                <li className="nav-item" role="presentation">
                  <button 
                    className="nav-link active" 
                    id="distribution-tab" 
                    data-bs-toggle="tab" 
                    data-bs-target="#distribution" 
                    type="button" 
                    role="tab" 
                    aria-controls="distribution" 
                    aria-selected="true"
                  >
                    Pain Point Distribution
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button 
                    className="nav-link" 
                    id="comparison-tab" 
                    data-bs-toggle="tab" 
                    data-bs-target="#comparison" 
                    type="button" 
                    role="tab" 
                    aria-controls="comparison" 
                    aria-selected="false"
                  >
                    Product Comparison
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button 
                    className="nav-link" 
                    id="timeline-tab" 
                    data-bs-toggle="tab" 
                    data-bs-target="#timeline" 
                    type="button" 
                    role="tab" 
                    aria-controls="timeline" 
                    aria-selected="false"
                  >
                    Timeline Trend
                  </button>
                </li>
              </ul>
              
              <div className="tab-content" id="visualizationTabContent">
                <div 
                  className="tab-pane fade show active" 
                  id="distribution" 
                  role="tabpanel" 
                  aria-labelledby="distribution-tab"
                >
                  <DataVisualization 
                    data={getProductStats()} 
                    type="painPointDistribution" 
                  />
                </div>
                <div 
                  className="tab-pane fade" 
                  id="comparison" 
                  role="tabpanel" 
                  aria-labelledby="comparison-tab"
                >
                  <DataVisualization 
                    data={stats} 
                    type="productComparison" 
                  />
                </div>
                <div 
                  className="tab-pane fade" 
                  id="timeline" 
                  role="tabpanel" 
                  aria-labelledby="timeline-tab"
                >
                  <DataVisualization 
                    data={[]} 
                    type="timelineTrend" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
