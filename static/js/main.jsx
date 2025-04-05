// Main React application component

// Define main App component
const App = () => {
  const [activePage, setActivePage] = React.useState('dashboard');
  
  return (
    <div className="container py-4">
      {/* Navigation */}
      <Navigation activePage={activePage} setActivePage={setActivePage} />
      
      {/* Main content */}
      <main>
        {activePage === 'dashboard' && <Dashboard />}
        {activePage === 'account' && <Account />}
      </main>
      
      {/* Footer */}
      <footer className="mt-5 pt-3 border-top text-center text-muted">
        <p>
          <small>
            Software Pain Point Analyzer &copy; {new Date().getFullYear()} |
            <i className="fas fa-code ms-2 me-1"></i>
            Built with Flask + React
          </small>
        </p>
      </footer>
    </div>
  );
};

// Render the App
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
