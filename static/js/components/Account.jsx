// Account component for user profile and settings

const Account = () => {
  // Since we're not implementing real authentication in this MVP,
  // we'll just show a placeholder account page
  
  return (
    <div className="account-page">
      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-body text-center">
              <div className="mb-3">
                <i className="fas fa-user-circle fa-5x text-primary"></i>
              </div>
              <h4 className="card-title">Demo User</h4>
              <p className="card-text text-muted">demo@example.com</p>
              <div className="d-grid gap-2">
                <button className="btn btn-outline-primary" disabled>
                  <i className="fas fa-edit me-1"></i>
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
          
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">Account Info</h5>
            </div>
            <ul className="list-group list-group-flush">
              <li className="list-group-item d-flex justify-content-between align-items-center">
                Member Since
                <span>{new Date().toLocaleDateString()}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                Subscription
                <span className="badge bg-success">Free Tier</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Saved Searches</h5>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                In the full version, you can save your searches here for quick access.
              </div>
              
              <div className="list-group">
                <div className="list-group-item list-group-item-action">
                  <div className="d-flex w-100 justify-content-between">
                    <h5 className="mb-1">Cursor Issues</h5>
                    <small className="text-muted">3 days ago</small>
                  </div>
                  <p className="mb-1">Subreddits: programming, webdev, coding</p>
                  <div className="d-flex justify-content-end">
                    <button className="btn btn-sm btn-outline-primary me-2" disabled>
                      <i className="fas fa-play me-1"></i>
                      Run
                    </button>
                    <button className="btn btn-sm btn-outline-danger" disabled>
                      <i className="fas fa-trash me-1"></i>
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="list-group-item list-group-item-action">
                  <div className="d-flex w-100 justify-content-between">
                    <h5 className="mb-1">Replit Performance</h5>
                    <small className="text-muted">1 week ago</small>
                  </div>
                  <p className="mb-1">Subreddits: learnprogramming, replit</p>
                  <div className="d-flex justify-content-end">
                    <button className="btn btn-sm btn-outline-primary me-2" disabled>
                      <i className="fas fa-play me-1"></i>
                      Run
                    </button>
                    <button className="btn btn-sm btn-outline-danger" disabled>
                      <i className="fas fa-trash me-1"></i>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Settings</h5>
            </div>
            <div className="card-body">
              <form>
                <div className="mb-3">
                  <label htmlFor="notificationSettings" className="form-label">Notification Preferences</label>
                  <select className="form-select" id="notificationSettings" disabled>
                    <option>Daily digest</option>
                    <option>Weekly summary</option>
                    <option>Only important alerts</option>
                    <option>None</option>
                  </select>
                </div>
                
                <div className="mb-3 form-check">
                  <input type="checkbox" className="form-check-input" id="emailAlerts" disabled checked />
                  <label className="form-check-label" htmlFor="emailAlerts">
                    Receive email alerts for new pain points
                  </label>
                </div>
                
                <div className="mb-3 form-check">
                  <input type="checkbox" className="form-check-input" id="darkMode" disabled checked />
                  <label className="form-check-label" htmlFor="darkMode">
                    Use dark mode
                  </label>
                </div>
                
                <div className="d-grid">
                  <button type="button" className="btn btn-primary" disabled>
                    <i className="fas fa-save me-1"></i>
                    Save Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">API Access</h5>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                In the full version, you can access the pain point data via our API.
              </div>
              
              <div className="input-group mb-3">
                <input 
                  type="text" 
                  className="form-control" 
                  value="xxxxx-xxxxx-xxxxx-xxxxx-xxxxx" 
                  aria-label="API Key" 
                  disabled 
                />
                <button className="btn btn-outline-secondary" type="button" disabled>
                  <i className="fas fa-copy"></i>
                </button>
                <button className="btn btn-outline-secondary" type="button" disabled>
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
              
              <div className="d-grid">
                <button type="button" className="btn btn-outline-primary" disabled>
                  <i className="fas fa-book me-1"></i>
                  View API Documentation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
