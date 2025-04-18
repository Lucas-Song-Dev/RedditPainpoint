// components/Navbar.jsx
import { useState } from "react";
import "./navbar.scss";

const Navbar = ({ activePage, setActivePage, handleLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <button className="collapse-toggle" onClick={toggleCollapse}>
            {isCollapsed ? (
              <svg
                className="icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <polyline
                  points="9 18 15 12 9 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                className="icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <polyline
                  points="15 18 9 12 15 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          {!isCollapsed && <span className="app-name">Painpoint Analyzer</span>}
        </div>
      </div>

      <nav className="nav-menu">
        <ul>
          <li
            className={activePage === "home" ? "active" : ""}
            onClick={() => setActivePage("home")}
            title="Home"
          >
            <span className="menu-icon">🏠</span>
            {!isCollapsed && <span className="menu-text">Home</span>}
          </li>
          <li
            className={activePage === "scrapepage" ? "active" : ""}
            onClick={() => setActivePage("scrapepage")}
            title="Scrape"
          >
            <span className="menu-icon">🔍</span>
            {!isCollapsed && <span className="menu-text">Scrape</span>}
          </li>
          <li
            className={activePage === "post" ? "active" : ""}
            onClick={() => setActivePage("post")}
            title="Posts"
          >
            <span className="menu-icon">📝</span>
            {!isCollapsed && <span className="menu-text">Posts</span>}
          </li>
          <li
            className={activePage === "analysisPage" ? "active" : ""}
            onClick={() => setActivePage("analysisPage")}
            title="Analysis"
          >
            <span className="menu-icon">📊</span>
            {!isCollapsed && <span className="menu-text">Analysis</span>}
          </li>
          <li
            className={activePage === "recomendationPage" ? "active" : ""}
            onClick={() => setActivePage("recomendationPage")}
            title="Recommendation"
          >
            <span className="menu-icon">💡</span>
            {!isCollapsed && <span className="menu-text">Recommendation</span>}
          </li>
          {/* Logout button at the bottom of sidebar */}
          <li className="logout-item" onClick={handleLogout} title="Logout">
            <span className="menu-icon">🚪</span>
            {!isCollapsed && <span className="menu-text">Logout</span>}
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Navbar;
