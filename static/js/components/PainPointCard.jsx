// PainPointCard component for displaying individual pain points

const PainPointCard = ({ painPoint, onViewDetails }) => {
  return (
    <div className="card mb-3">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{painPoint.title}</h5>
        <span className="badge bg-primary rounded-pill">
          {painPoint.frequency} mentions
        </span>
      </div>
      
      <div className="card-body">
        <p className="card-text">
          {painPoint.description || `Issues related to "${painPoint.title}"`}
        </p>
        
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">
            Identified: {new Date(painPoint.date_identified).toLocaleDateString()}
          </small>
          
          <button 
            className="btn btn-sm btn-outline-primary"
            onClick={() => onViewDetails(painPoint.id)}
          >
            <i className="fas fa-eye me-1"></i>
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

// PainPointDetail component for showing detailed information and related posts
const PainPointDetail = ({ painPoint, posts, onBack }) => {
  return (
    <div className="pain-point-detail">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>{painPoint.title}</h3>
        <button className="btn btn-outline-secondary" onClick={onBack}>
          <i className="fas fa-arrow-left me-1"></i>
          Back to List
        </button>
      </div>
      
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Overview</h5>
          <p className="card-text">{painPoint.description || `Issues related to "${painPoint.title}"`}</p>
          <div className="d-flex gap-3 mt-3">
            <div className="text-center">
              <h6>Frequency</h6>
              <span className="fs-4 fw-bold text-primary">{painPoint.frequency}</span>
            </div>
            <div className="text-center">
              <h6>Related Posts</h6>
              <span className="fs-4 fw-bold text-primary">{posts.length}</span>
            </div>
          </div>
        </div>
      </div>
      
      <h4 className="mb-3">Related Reddit Posts</h4>
      {posts.length === 0 ? (
        <div className="alert alert-info">No related posts found.</div>
      ) : (
        <div className="list-group">
          {posts.map((post) => (
            <a 
              key={post.id} 
              href={post.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="list-group-item list-group-item-action"
            >
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">{post.title}</h5>
                <small>Score: {post.score}</small>
              </div>
              <p className="mb-1">{post.content ? post.content.substring(0, 150) + '...' : '[No content]'}</p>
              <small>
                Posted by u/{post.author} in r/{post.subreddit} on {new Date(post.created_utc).toLocaleDateString()}
              </small>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
