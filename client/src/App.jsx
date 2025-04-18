import { useState, useEffect } from "react";
import "./App.scss";
import Post from "./pages/postsPage/PostsPage";
import AnalysisPage from "./pages/analysisPage/AnalysisPage";
import ScrapePage from "./pages/scrape/ScrapePage";
import RecomendationPage from "./pages/recomendationPage/Recomendation";
import StatusBar from "./components/StatusBar";
import Navbar from "./components/NavBar"; // Import the Navbar component
import LoginPage from "./pages/auth/LoginPage";
import { useAuth } from "./context/AuthContext";
import { logoutUser } from "./api/api";
import Notification from "./components/Notification";

function App() {
  const [activePage, setActivePage] = useState("home");
  const { isAuthenticated, isLoading, login, logout } = useAuth();

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
                <h3>Scrape Reddit</h3>
                <p>
                  Collect posts mentioning specific products across multiple
                  subreddits to identify common pain points.
                </p>
                <button
                  className="feature-button"
                  onClick={() => setActivePage("scrapepage")}
                >
                  Start Scraping
                </button>
              </div>

              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>Analyze Data</h3>
                <p>
                  Use NLP and sentiment analysis to categorize and prioritize
                  user pain points by severity.
                </p>
                <button
                  className="feature-button"
                  onClick={() => setActivePage("analysisPage")}
                >
                  View Analysis
                </button>
              </div>

              <div className="feature-card">
                <div className="feature-icon">💡</div>
                <h3>Get Recommendations</h3>
                <p>
                  Generate AI-powered recommendations for addressing the
                  identified pain points.
                </p>
                <button
                  className="feature-button"
                  onClick={() => setActivePage("recomendationPage")}
                >
                  See Recommendations
                </button>
              </div>

              <div className="feature-card">
                <div className="feature-icon">📝</div>
                <h3>Browse Posts</h3>
                <p>
                  Explore all collected posts with filtering and sorting options
                  to gain deeper insights.
                </p>
                <button
                  className="feature-button"
                  onClick={() => setActivePage("post")}
                >
                  Browse Posts
                </button>
              </div>
            </div>

            <div className="usage-guide">
              <h2>How to Use This App</h2>
              <ol className="steps-list">
                <li>
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <h4>Configure and Run a Scrape</h4>
                    <p>
                      Start with the Advanced Scrape page to collect data about
                      your products from Reddit. Set your target products,
                      subreddits, and time range.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <h4>Explore Collected Posts</h4>
                    <p>
                      Visit the Posts page to see all scraped content. Use
                      filters to focus on specific products, subreddits, or
                      posts with high sentiment scores.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <h4>Review Pain Point Analysis</h4>
                    <p>
                      Check the Analysis page to see identified pain points
                      categorized by severity, frequency, and sentiment.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="step-number">4</span>
                  <div className="step-content">
                    <h4>Generate Recommendations</h4>
                    <p>
                      Use the Recommendation page to get AI-generated ideas for
                      addressing the most critical pain points.
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
      case "post":
        return <Post />;
      case "scrapepage":
        return <ScrapePage />;
      case "analysisPage":
        return <AnalysisPage />;
      case "recomendationPage":
        return <RecomendationPage />;
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
      <Navbar
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
