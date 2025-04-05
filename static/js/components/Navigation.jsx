// Navigation component for the application

const Navigation = ({ activePage, setActivePage }) => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container-fluid">
        <a className="navbar-brand" href="#">
          <i className="fas fa-chart-pie me-2"></i>
          Software Pain Point Analyzer
        </a>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav" 
          aria-controls="navbarNav" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <a 
                className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`} 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActivePage('dashboard');
                }}
              >
                <i className="fas fa-tachometer-alt me-1"></i>
                Dashboard
              </a>
            </li>
            <li className="nav-item">
              <a 
                className={`nav-link ${activePage === 'account' ? 'active' : ''}`} 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActivePage('account');
                }}
              >
                <i className="fas fa-user me-1"></i>
                Account
              </a>
            </li>
          </ul>
          
          <span className="navbar-text">
            <i className="fas fa-info-circle me-1"></i>
            Analyze software pain points from Reddit
          </span>
        </div>
      </div>
    </nav>
  );
};
