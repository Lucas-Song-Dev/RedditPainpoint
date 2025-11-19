import { useState, useEffect } from "react";
import "./App.scss";
import Post from "./pages/postsPage/PostsPage";
import AnalysisPage from "./pages/analysisPage/AnalysisPage";
import ScrapePage from "./pages/scrapePage/ScrapePage";
import RecomendationPage from "./pages/recommendationPage/RecomendationPage";
import AboutPage from "./pages/aboutPage/AboutPage";
import ResultsPage from "./pages/resultsPage/ResultsPage";
import ProductDetailPage from "./pages/productDetailPage/ProductDetailPage";
import StatusBar from "./components/StatusBar/StatusBar";
import NavBar from "./components/NavBar/NavBar";
import LoginPage from "./pages/auth/LoginPage";
import { useAuth } from "./context/AuthContext";
import { logoutUser, fetchPosts, fetchOpenAIAnalysis, fetchAllProducts } from "./api/api";
import Notification from "./components/Notification/Notification";

function App() {
  const [activePage, setActivePage] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { isAuthenticated, isLoading, login, logout } = useAuth();

  // Periodic API polling for debugging - logs posts and analysis data
  useEffect(() => {
    if (!isAuthenticated) return;

    const pollAPIs = async () => {
      const timestamp = new Date().toISOString();
      console.log(`\n[${timestamp}] === FRONTEND API POLL ===`);

      // Fetch posts
      try {
        console.log("[POLL] Fetching posts...");
        const postsData = await fetchPosts({ limit: 10 });
        console.log("[POLL] Posts API Response:", {
          status: postsData.status,
          postsCount: postsData.posts?.length || 0,
          totalPosts: postsData.total || 0,
          samplePost: postsData.posts?.[0] ? {
            title: postsData.posts[0].title?.substring(0, 50),
            product: postsData.posts[0].product,
            subreddit: postsData.posts[0].subreddit
          } : null
        });
      } catch (err) {
        console.error("[POLL] Posts API Error:", err.message || err);
      }

      // Fetch all products
      try {
        console.log("[POLL] Fetching all products...");
        const productsData = await fetchAllProducts();
        console.log("[POLL] All Products API Response:", {
          status: productsData.status,
          productsCount: productsData.products?.length || 0,
          products: productsData.products || []
        });

        // If we have products with analysis, fetch analysis for the first one
        const productsWithAnalysis = (productsData.products || [])
          .filter(p => typeof p === 'object' ? p.has_analysis : false);
        
        if (productsWithAnalysis.length > 0) {
          const firstProduct = typeof productsWithAnalysis[0] === 'object' 
            ? productsWithAnalysis[0].name 
            : productsWithAnalysis[0];
          try {
            console.log(`[POLL] Fetching analysis for product: ${firstProduct}...`);
            const analysisData = await fetchOpenAIAnalysis({ product: [firstProduct] });
            console.log("[POLL] Analysis API Response:", {
              status: analysisData.status,
              analysesCount: analysisData.analyses?.length || 0,
              hasAnalysis: analysisData.analyses && analysisData.analyses.length > 0,
              painPointsCount: analysisData.analyses?.[0]?.common_pain_points?.length || 0,
              samplePainPoint: analysisData.analyses?.[0]?.common_pain_points?.[0] ? {
                category: analysisData.analyses[0].common_pain_points[0].category,
                indicator: analysisData.analyses[0].common_pain_points[0].indicator,
                severity: analysisData.analyses[0].common_pain_points[0].severity
              } : null
            });
          } catch (analysisErr) {
            console.error(`[POLL] Analysis API Error for ${firstProduct}:`, analysisErr.message || analysisErr);
          }
        }
      } catch (err) {
        console.error("[POLL] All Products API Error:", err.message || err);
      }

      console.log(`[${timestamp}] === END API POLL ===\n`);
    };

    // Poll immediately on mount
    pollAPIs();

    // Then poll every 30 seconds
    const intervalId = setInterval(pollAPIs, 30000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  // Handle logout click
  const handleLogout = async () => {
    try {
      await logoutUser();
      logout(); // Update auth context
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // If auth is still loading, you can show a loading spinner
  if (isLoading) {
    return <div className="loading-container">Loading...</div>;
  }

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={login} />;
  }

  // Define the content to render based on active page
  const renderContent = () => {
    switch (activePage) {
      case "home":
        return (
          <div className="home-container">
            <div className="welcome-header">
              <h1>Product Painpoint Analyzer</h1>
              <p className="tagline">
                Discover user pain points and generate actionable
                recommendations
              </p>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🔍</div>
                <h3>Scrape & Analysis</h3>
                <p>
                  Configure scraping jobs to collect Reddit posts about your products.
                  Set target products, subreddits, and time ranges. Analysis runs automatically.
                </p>
                <button
                  className="feature-button"
                  onClick={() => setActivePage("scrapepage")}
                >
                  Go to Scrape & Analysis
                </button>
              </div>

              <div className="feature-card">
                <div className="feature-icon">📋</div>
                <h3>View Results</h3>
                <p>
                  Browse all analyzed products in one place. Click any product to view
                  its posts, pain point analysis, and AI-generated recommendations.
                </p>
                <button
                  className="feature-button"
                  onClick={() => setActivePage("results")}
                >
                  View Results
                </button>
              </div>

              <div className="feature-card">
                <div className="feature-icon">ℹ️</div>
                <h3>Learn More</h3>
                <p>
                  Discover how the platform works, its technology stack, and the
                  advanced NLP pipeline that powers the analysis.
                </p>
                <button
                  className="feature-button"
                  onClick={() => setActivePage("about")}
                >
                  About This App
                </button>
              </div>
            </div>

            <div className="usage-guide">
              <h2>How to Use This App</h2>
              <ol className="steps-list">
                <li>
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <h4>Scrape & Analyze Products</h4>
                    <p>
                      Go to <strong>Scrape & Analysis</strong> to configure and run scraping jobs.
                      Select your target products, choose subreddits (or use the random generator),
                      set time ranges and limits. The system automatically analyzes posts using
                      advanced NLP with 94% sentiment accuracy, generates OpenAI analysis, and
                      creates product recommendations - all in one automated flow.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <h4>View All Results</h4>
                    <p>
                      Navigate to <strong>Results</strong> to see all products that have been analyzed.
                      Use the search bar to quickly find specific products. Each product card shows
                      what data is available (Posts, Analysis, Recommendations).
                    </p>
                  </div>
                </li>
                <li>
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <h4>Explore Product Details</h4>
                    <p>
                      Click any product from the Results page to open its detail view. Here you can
                      navigate between three tabs: <strong>Posts</strong> (all collected Reddit posts),
                      <strong>Analysis</strong> (pain points with severity and sentiment), and
                      <strong>Recommendations</strong> (AI-generated solutions).
                    </p>
                  </div>
                </li>
                <li>
                  <span className="step-number">4</span>
                  <div className="step-content">
                    <h4>Take Action</h4>
                    <p>
                      Use the insights from analysis and recommendations to prioritize product improvements.
                      All data is shared across users, so your team can collaborate on the same insights.
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            <div className="app-footer">
              <p>
                Need help? Check the documentation or contact the administrator.
              </p>
            </div>
          </div>
        );
      case "scrapepage":
        return <ScrapePage />;
      case "analysisPage":
        return <AnalysisPage />;
      case "results":
        return (
          <ResultsPage
            setActivePage={setActivePage}
            setSelectedProduct={setSelectedProduct}
          />
        );
      case "productDetail":
        return (
          <ProductDetailPage
            selectedProduct={selectedProduct}
            setActivePage={setActivePage}
          />
        );
      case "about":
        return <AboutPage />;
      default:
        return (
          <div>
            <h1>Page not found</h1>
            <p>The requested page does not exist.</p>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      {/* Use the Navbar component */}
      <NavBar
        activePage={activePage}
        setActivePage={setActivePage}
        handleLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="main-content" data-testid="main-content">
        <StatusBar />
        {renderContent()}
        <Notification />
      </div>
    </div>
  );
}

export default App;
