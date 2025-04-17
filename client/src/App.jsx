import { useState, useEffect } from "react";
import "./App.scss";
import Post from "./pages/postsPage/PostsPage";
import Scrape from "./pages/scrape/ScrapePage";
import AnalysisPage from "./pages/analysisPage/AnalysisPage";
import ScrapePage from "./pages/scrape/ScrapePage";
import RecomendationPage from "./pages/recomendationPage/Recomendation";
import StatusBar from "./components/StatusBar";
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
          <>
            <h1>Reddit Scraper Dashboard</h1>
            <p>
              Select a page from the sidebar to navigate through the
              application.
            </p>
          </>
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
      {/* Sidebar */}
      <div className="sidebar">
        <nav className="nav-menu">
          <ul>
            <li
              className={activePage === "home" ? "active" : ""}
              onClick={() => setActivePage("home")}
            >
              Home
            </li>
            <li
              className={activePage === "post" ? "active" : ""}
              onClick={() => setActivePage("post")}
            >
              Posts
            </li>
            <li
              className={activePage === "scrapepage" ? "active" : ""}
              onClick={() => setActivePage("scrapepage")}
            >
              Advanced Scrape
            </li>
            <li
              className={activePage === "analysisPage" ? "active" : ""}
              onClick={() => setActivePage("analysisPage")}
            >
              Analysis
            </li>
            <li
              className={activePage === "recomendationPage" ? "active" : ""}
              onClick={() => setActivePage("recomendationPage")}
            >
              Recomendation
            </li>
            {/* Logout button at the bottom of sidebar */}
            <li className="logout-item" onClick={handleLogout}>
              Logout
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <StatusBar />
        {renderContent()}
        <Notification />
      </div>
    </div>
  );
}

export default App;
