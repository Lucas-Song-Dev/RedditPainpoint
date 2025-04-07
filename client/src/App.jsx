import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.scss";
import Post from "./pages/postsPage/PostsPage";
import Scrape from "./pages/scrape/ScrapePage";
import AnalysisPage from "./pages/analysisPage/AnalysisPage";
import ScrapePage from "./pages/scrape/ScrapePage";
import RecomendationPage from "./pages/recomendationPage/Recomendation";
import StatusBar from "./components/StatusBar"; // Import the StatusBar component

function App() {
  const [activePage, setActivePage] = useState("home");

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
        <div className="logo-container">
          <a href="https://vite.dev" target="_blank" rel="noreferrer">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank" rel="noreferrer">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>

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
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <StatusBar />
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
