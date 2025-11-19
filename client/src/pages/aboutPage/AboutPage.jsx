import "./aboutPage.scss";

const AboutPage = () => {
  return (
    <div className="about-container">
      <div className="about-header">
        <h1>About Reddit Painpoint Analyzer</h1>
        <p className="subtitle">Advanced NLP-Powered User Feedback Analysis Platform</p>
      </div>

      <section className="about-section">
        <h2>Overview</h2>
        <p>
          The Reddit Painpoint Analyzer is a comprehensive platform designed to extract, 
          analyze, and generate actionable insights from user feedback across Reddit. 
          By leveraging advanced Natural Language Processing (NLP) techniques and machine 
          learning algorithms, we process millions of words of user feedback to identify 
          common pain points, sentiment trends, and improvement opportunities for products 
          and services.
        </p>
        <p>
          Our system combines automated data collection, sophisticated sentiment analysis 
          with 94% classification accuracy, and AI-powered recommendation generation to 
          help product teams make data-driven decisions based on real user experiences.
        </p>
      </section>

      <section className="about-section">
        <h2>Technology Stack</h2>
        <div className="tech-grid">
          <div className="tech-category">
            <h3>Frontend</h3>
            <ul>
              <li><strong>React 18</strong> - Modern UI framework with hooks and context API</li>
              <li><strong>Vite</strong> - Fast build tool and development server</li>
              <li><strong>SCSS</strong> - Terminal/hardware aesthetic styling</li>
              <li><strong>Axios</strong> - HTTP client for API communication</li>
            </ul>
          </div>
          <div className="tech-category">
            <h3>Backend</h3>
            <ul>
              <li><strong>Flask 3.0</strong> - Python web framework</li>
              <li><strong>Flask-RESTful</strong> - RESTful API architecture</li>
              <li><strong>MongoDB</strong> - NoSQL database for scalable data storage</li>
              <li><strong>JWT Authentication</strong> - Secure token-based authentication</li>
            </ul>
          </div>
          <div className="tech-category">
            <h3>NLP & Machine Learning</h3>
            <ul>
              <li><strong>NLTK</strong> - Natural language processing toolkit</li>
              <li><strong>VADER Sentiment</strong> - Rule-based sentiment analysis</li>
              <li><strong>scikit-learn</strong> - Machine learning models (Naive Bayes, Logistic Regression)</li>
              <li><strong>TF-IDF Vectorization</strong> - Text feature extraction</li>
              <li><strong>Ensemble Methods</strong> - Combined ML models for higher accuracy</li>
            </ul>
          </div>
          <div className="tech-category">
            <h3>External APIs</h3>
            <ul>
              <li><strong>Reddit API (PRAW)</strong> - Reddit data collection</li>
              <li><strong>OpenAI API</strong> - Advanced analysis and recommendations</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>NLP Pipeline Architecture</h2>
        <p>
          Our advanced NLP pipeline processes over 3.2 million words of user feedback with 
          a target accuracy of 94% for sentiment classification. The pipeline consists of 
          multiple stages:
        </p>
        
        <div className="pipeline-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Data Collection</h4>
              <p>
                Automated scraping of Reddit posts mentioning target products across 
                multiple subreddits. Supports filtering by time period, subreddit, 
                and product keywords.
              </p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Text Preprocessing</h4>
              <p>
                Cleaning and normalization of text data: URL removal, Reddit-specific 
                formatting cleanup, tokenization, and stop word filtering. Ensures 
                high-quality input for analysis.
              </p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Feature Extraction</h4>
              <p>
                Extraction of linguistic features including word counts, sentence structure, 
                punctuation patterns, negation detection, and intensifier identification. 
                These features inform sentiment classification.
              </p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Ensemble Sentiment Analysis</h4>
              <p>
                Multi-method sentiment classification combining:
              </p>
              <ul>
                <li><strong>VADER Sentiment:</strong> Rule-based analysis optimized for social media</li>
                <li><strong>Machine Learning Models:</strong> Trained classifiers using TF-IDF features</li>
                <li><strong>Rule-Based Adjustments:</strong> Pain point indicator weighting</li>
              </ul>
              <p>
                The ensemble approach achieves 94% accuracy by leveraging the strengths 
                of each method.
              </p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">5</div>
            <div className="step-content">
              <h4>Pain Point Identification</h4>
              <p>
                Categorization of issues by severity (critical, high, medium, low) and 
                type (performance, UI, functionality, compatibility, reliability, usability). 
                Frequency analysis and sentiment correlation identify the most impactful issues.
              </p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">6</div>
            <div className="step-content">
              <h4>Topic Extraction</h4>
              <p>
                Identification of key topics and themes using frequency analysis and 
                relevance scoring. Helps understand what users are discussing most frequently.
              </p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">7</div>
            <div className="step-content">
              <h4>Insight Generation</h4>
              <p>
                Automated generation of actionable insights based on sentiment distribution, 
                pain point severity, and topic analysis. Provides high-level summaries 
                for quick decision-making.
              </p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">8</div>
            <div className="step-content">
              <h4>Data Storage & Retrieval</h4>
              <p>
                All analysis results are stored in MongoDB with proper indexing for fast 
                retrieval. Supports querying by product, sentiment, pain point category, 
                and time period.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>Security Features</h2>
        <p>
          Security is a top priority. Our platform implements multiple layers of protection:
        </p>
        <ul className="security-list">
          <li>
            <strong>JWT Authentication:</strong> Secure token-based authentication with 
            HTTP-only cookies. Tokens are never exposed in response bodies or client-side 
            storage.
          </li>
          <li>
            <strong>Password Security:</strong> Bcrypt hashing with salt for all user passwords. 
            Password strength validation enforces minimum requirements.
          </li>
          <li>
            <strong>Input Validation:</strong> Comprehensive input sanitization and validation 
            to prevent injection attacks and malicious input.
          </li>
          <li>
            <strong>Rate Limiting:</strong> Protection against brute force attacks with 
            configurable rate limits on authentication endpoints.
          </li>
          <li>
            <strong>Security Headers:</strong> X-Frame-Options, X-Content-Type-Options, 
            X-XSS-Protection, and Content-Security-Policy headers on all responses.
          </li>
          <li>
            <strong>CORS Configuration:</strong> Restricted cross-origin resource sharing 
            to approved domains only.
          </li>
          <li>
            <strong>Error Sanitization:</strong> Error messages are sanitized to prevent 
            information leakage in production environments.
          </li>
        </ul>
      </section>

      <section className="about-section">
        <h2>Automation & CI/CD</h2>
        <p>
          The platform includes automated workflows for continuous analysis:
        </p>
        <ul>
          <li>
            <strong>GitHub Actions:</strong> Automated NLP pipeline runs daily to process 
            new data and generate insights. Includes testing at each step to ensure data quality.
          </li>
          <li>
            <strong>Automated Testing:</strong> Comprehensive test suite covering sentiment 
            analysis accuracy, pain point identification, topic extraction, and large-scale 
            processing capabilities.
          </li>
          <li>
            <strong>Result Verification:</strong> Automated verification of analysis results, 
            accuracy metrics, and data integrity.
          </li>
          <li>
            <strong>Reporting:</strong> Automated generation of analysis reports with metrics, 
            insights, and recommendations.
          </li>
        </ul>
      </section>

      <section className="about-section">
        <h2>Performance Metrics</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-value">3.2M+</div>
            <div className="metric-label">Words Processed</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">94%</div>
            <div className="metric-label">Sentiment Accuracy</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">100+</div>
            <div className="metric-label">Pain Points Identified</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">20+</div>
            <div className="metric-label">Top Topics Extracted</div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>Application Workflow</h2>
        <p>
          The platform follows a streamlined workflow designed for efficient product analysis:
        </p>
        <div className="workflow-steps">
          <div className="workflow-step">
            <div className="workflow-icon">🔍</div>
            <div className="workflow-content">
              <h4>1. Scrape & Analysis</h4>
              <p>
                Configure scraping jobs by selecting products, subreddits, and time ranges.
                The system automatically collects Reddit posts and runs advanced NLP analysis
                to identify pain points with 94% sentiment accuracy.
              </p>
            </div>
          </div>
          <div className="workflow-step">
            <div className="workflow-icon">📋</div>
            <div className="workflow-content">
              <h4>2. Results Dashboard</h4>
              <p>
                View all analyzed products in a centralized Results page. Search and filter
                to quickly find products of interest. Each product shows available data types
                (Posts, Analysis, Recommendations).
              </p>
            </div>
          </div>
          <div className="workflow-step">
            <div className="workflow-icon">📊</div>
            <div className="workflow-content">
              <h4>3. Product Detail View</h4>
              <p>
                Click any product to access its comprehensive detail page with three integrated tabs:
                <strong>Posts</strong> for browsing collected Reddit content,
                <strong>Analysis</strong> for pain point insights, and
                <strong>Recommendations</strong> for AI-generated solutions.
              </p>
            </div>
          </div>
          <div className="workflow-step">
            <div className="workflow-icon">👥</div>
            <div className="workflow-content">
              <h4>4. Shared Insights</h4>
              <p>
                All analysis data is shared across users, enabling team collaboration on the same
                insights. No need to duplicate scraping efforts - work together on unified data.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>Use Cases</h2>
        <div className="use-cases">
          <div className="use-case">
            <h3>Product Development</h3>
            <p>
              Identify the most critical user pain points to prioritize in development 
              roadmaps. Understand which issues affect the most users and have the highest 
              negative sentiment.
            </p>
          </div>
          <div className="use-case">
            <h3>Customer Support</h3>
            <p>
              Proactively address common issues before they become support tickets. 
              Understand user sentiment trends to gauge overall product satisfaction.
            </p>
          </div>
          <div className="use-case">
            <h3>Competitive Analysis</h3>
            <p>
              Compare pain points across multiple products to identify market opportunities 
              and competitive advantages.
            </p>
          </div>
          <div className="use-case">
            <h3>Feature Prioritization</h3>
            <p>
              Use data-driven insights to prioritize feature development based on user 
              demand and pain point severity.
            </p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>Data Privacy & Ethics</h2>
        <p>
          We are committed to responsible data usage:
        </p>
        <ul>
          <li>Only public Reddit posts are collected (no private messages or deleted content)</li>
          <li>User anonymity is preserved - usernames are stored but not exposed in analysis</li>
          <li>Data is stored securely in MongoDB with proper access controls</li>
          <li>All analysis is performed on aggregated data to protect individual privacy</li>
          <li>Users can request data deletion in compliance with privacy regulations</li>
        </ul>
      </section>

      <section className="about-section">
        <h2>Future Enhancements</h2>
        <p>Planned improvements include:</p>
        <ul>
          <li>Real-time sentiment monitoring and alerts</li>
          <li>Multi-language support for global product analysis</li>
          <li>Advanced visualization dashboards</li>
          <li>Custom ML model training on domain-specific data</li>
          <li>Integration with additional data sources (Twitter, forums, reviews)</li>
          <li>Predictive analytics for emerging pain points</li>
        </ul>
      </section>

      <section className="about-section">
        <h2>Contributing & Support</h2>
        <p>
          This platform is designed to be extensible and maintainable. The codebase follows 
          best practices for security, code quality, and documentation. For questions, 
          issues, or contributions, please refer to the project repository.
        </p>
      </section>

      <div className="about-footer">
        <p>Built with ❤️ for data-driven product development</p>
        <p className="version">Version 2.0 - Advanced NLP Pipeline</p>
      </div>
    </div>
  );
};

export default AboutPage;

