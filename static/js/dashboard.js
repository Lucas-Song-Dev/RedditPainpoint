// Dashboard JavaScript for Reddit Pain Point Analyzer

// Global state
let painPointsData = [];
let postsData = [];
let openaiAnalysisData = [];
let severityChart = null;
let categoryChart = null;
let statusPollingInterval = null;

// Initialize the dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize charts
    initCharts();
    
    // Load initial data
    refreshAllData();
    
    // Set up event listeners
    document.getElementById('refresh-btn').addEventListener('click', refreshAllData);
    document.getElementById('start-scrape-btn').addEventListener('click', startScraping);
    document.getElementById('export-btn').addEventListener('click', exportPainPoints);
    document.getElementById('product-filter').addEventListener('change', filterPainPointsByProduct);
    document.getElementById('openai-product-filter').addEventListener('change', fetchOpenAIAnalysis);
    
    // Start status polling
    startStatusPolling();
});

// Poll for status updates
function startStatusPolling() {
    // Cancel existing interval if it exists
    if (statusPollingInterval) {
        clearInterval(statusPollingInterval);
    }
    
    // Poll every 5 seconds
    statusPollingInterval = setInterval(checkStatus, 5000);
    
    // Initial check
    checkStatus();
}

// Check the current status of the scraper
function checkStatus() {
    fetch('/api/status')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                updateStatusIndicators(data);
                
                // If scraping is complete, refresh data
                if (data.scrape_in_progress === false && document.getElementById('scrape-btn').disabled) {
                    setTimeout(() => {
                        document.getElementById('scrape-btn').disabled = false;
                        refreshAllData();
                        showToast('Scraping Complete', 'The Reddit scraping has completed successfully!', 'success');
                    }, 1000);
                }
            }
        })
        .catch(error => {
            console.error('Error checking status:', error);
        });
}

// Update status indicators on the dashboard
function updateStatusIndicators(data) {
    // Update status indicator
    const statusElement = document.getElementById('status-indicator');
    if (data.scrape_in_progress) {
        statusElement.textContent = 'Scraping...';
        statusElement.className = 'badge bg-warning';
    } else {
        statusElement.textContent = 'Idle';
        statusElement.className = 'badge bg-success';
    }
    
    // Update counters
    document.getElementById('posts-count').textContent = data.raw_posts_count;
    document.getElementById('pain-points-count').textContent = data.pain_points_count;
    document.getElementById('subreddits-count').textContent = data.subreddits_scraped.length;
    
    // Update last updated time
    if (data.last_scrape_time) {
        const lastUpdateDate = new Date(data.last_scrape_time);
        document.getElementById('last-updated').textContent = lastUpdateDate.toLocaleString();
    }
}

// Start the Reddit scraping process
function startScraping() {
    // Gather selected products
    const productsToScrape = [];
    if (document.getElementById('product-cursor').checked) productsToScrape.push('cursor');
    if (document.getElementById('product-replit').checked) productsToScrape.push('replit');
    
    // If no products selected, show error
    if (productsToScrape.length === 0) {
        showToast('Error', 'Please select at least one product to scrape.', 'error');
        return;
    }
    
    // Get other parameters
    const limit = parseInt(document.getElementById('scrape-limit').value) || 100;
    const timeFilter = document.getElementById('time-filter').value;
    const useOpenAI = document.getElementById('use-openai').checked;
    
    // Parse subreddits
    const subredditsInput = document.getElementById('subreddits').value.trim();
    const subreddits = subredditsInput ? subredditsInput.split(',').map(s => s.trim()) : [];
    
    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('scrapeModal'));
    modal.hide();
    
    // Disable the button to prevent multiple clicks
    document.getElementById('scrape-btn').disabled = true;
    
    // Show loading toast
    showToast('Scraping Started', 'Scraping Reddit for pain points...', 'info');
    
    // Make API request to start scraping
    fetch('/api/scrape', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            products: productsToScrape,
            limit: limit,
            subreddits: subreddits.length > 0 ? subreddits : null,
            time_filter: timeFilter,
            use_openai: useOpenAI
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Update status indicator
            const statusElement = document.getElementById('status-indicator');
            statusElement.textContent = 'Scraping...';
            statusElement.className = 'badge bg-warning';
            
            // Start status polling if it's not already running
            startStatusPolling();
        } else {
            // Show error message
            showToast('Error', data.message || 'Failed to start scraping.', 'error');
            
            // Re-enable the button
            document.getElementById('scrape-btn').disabled = false;
        }
    })
    .catch(error => {
        console.error('Error starting scraping:', error);
        showToast('Error', 'An error occurred while trying to start scraping.', 'error');
        
        // Re-enable the button
        document.getElementById('scrape-btn').disabled = false;
    });
}

// Refresh all data on the dashboard
function refreshAllData() {
    // Show loading indicators
    document.getElementById('pain-points-table').innerHTML = `
        <tr>
            <td colspan="6" class="text-center">
                <i class="fas fa-spinner fa-pulse"></i> Loading pain points...
            </td>
        </tr>
    `;
    
    document.getElementById('posts-container').innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-spinner fa-pulse fa-3x"></i>
            <p class="mt-3">Loading posts...</p>
        </div>
    `;
    
    // Fetch pain points data
    fetchPainPoints();
    
    // Fetch posts data
    fetchPosts();
    
    // Fetch OpenAI analysis
    fetchOpenAIAnalysis();
    
    // Update status
    checkStatus();
}

// Fetch pain points from the API
function fetchPainPoints() {
    fetch('/api/pain-points')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Store data globally
                painPointsData = data.pain_points;
                
                // Render the table
                renderPainPointsTable(painPointsData);
                
                // Update the charts
                updateCharts(painPointsData);
            } else {
                document.getElementById('pain-points-table').innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-muted">
                            No pain points data available
                        </td>
                    </tr>
                `;
            }
        })
        .catch(error => {
            console.error('Error fetching pain points:', error);
            document.getElementById('pain-points-table').innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">
                        Error loading pain points
                    </td>
                </tr>
            `;
        });
}

// Fetch posts from the API
function fetchPosts() {
    fetch('/api/posts?limit=20')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Store data globally
                postsData = data.posts;
                
                // Render the list
                renderPostsList(postsData);
            } else {
                document.getElementById('posts-container').innerHTML = `
                    <div class="text-center py-5 text-muted">
                        <p>No posts data available</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error fetching posts:', error);
            document.getElementById('posts-container').innerHTML = `
                <div class="text-center py-5 text-danger">
                    <p>Error loading posts</p>
                </div>
            `;
        });
}

// Fetch OpenAI Analysis Data
function fetchOpenAIAnalysis() {
    const productFilter = document.getElementById('openai-product-filter').value;
    const url = '/api/openai-analysis' + (productFilter ? `?product=${encodeURIComponent(productFilter)}` : '');
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'error') {
                document.getElementById('openai-status-message').textContent = data.message;
                document.getElementById('openai-status-message').classList.remove('d-none');
                document.getElementById('openai-analysis-container').classList.add('d-none');
                return;
            }
            
            if (data.status === 'info' || data.analyses.length === 0) {
                document.getElementById('openai-status-message').textContent = data.message || 'No OpenAI analyses available. Use the "Start Scraping" button with the OpenAI option.';
                document.getElementById('openai-status-message').classList.remove('d-none');
                document.getElementById('openai-analysis-container').classList.add('d-none');
                return;
            }
            
            // Hide the status message and show the analysis container
            document.getElementById('openai-status-message').classList.add('d-none');
            document.getElementById('openai-analysis-container').classList.remove('d-none');
            
            // Store the data globally
            openaiAnalysisData = data.analyses;
            
            // Display the analysis for the first product or the selected one
            const analysis = openaiAnalysisData[0];
            renderOpenAIAnalysis(analysis);
        })
        .catch(error => {
            console.error('Error fetching OpenAI analysis:', error);
            document.getElementById('openai-status-message').textContent = 'Error fetching OpenAI analysis data.';
            document.getElementById('openai-status-message').classList.remove('d-none');
            document.getElementById('openai-analysis-container').classList.add('d-none');
        });
}

// Render OpenAI Analysis
function renderOpenAIAnalysis(analysis) {
    // Set the summary
    document.getElementById('openai-summary').textContent = analysis.summary || 'No summary available';
    
    // Render pain points
    const painPointsContainer = document.getElementById('openai-pain-points-container');
    painPointsContainer.innerHTML = '';
    
    if (analysis.pain_points && analysis.pain_points.length > 0) {
        analysis.pain_points.forEach(point => {
            const card = document.createElement('div');
            card.className = 'col-md-6 col-lg-4 mb-3';
            card.innerHTML = `
                <div class="card h-100">
                    <div class="card-body">
                        <h6 class="card-title">${point.name}</h6>
                        <p class="card-text">${point.description}</p>
                        <div class="d-flex justify-content-between">
                            <span class="badge bg-info">Frequency: ${point.frequency || 'N/A'}</span>
                            <span class="badge bg-${getSentimentBadgeColor(point.sentiment)}">
                                Sentiment: ${point.sentiment ? point.sentiment.toFixed(2) : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
            `;
            painPointsContainer.appendChild(card);
        });
    } else {
        painPointsContainer.innerHTML = '<div class="col-12"><p class="text-muted">No pain points identified</p></div>';
    }
    
    // Render recommendations
    const recommendationsTable = document.getElementById('openai-recommendations-table');
    recommendationsTable.innerHTML = '';
    
    if (analysis.recommendations && analysis.recommendations.length > 0) {
        analysis.recommendations.forEach(rec => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${rec.title || 'N/A'}</td>
                <td>${rec.description || 'N/A'}</td>
                <td><span class="badge bg-${getComplexityBadgeColor(rec.complexity)}">${rec.complexity || 'N/A'}</span></td>
                <td><span class="badge bg-${getImpactBadgeColor(rec.impact)}">${rec.impact || 'N/A'}</span></td>
            `;
            recommendationsTable.appendChild(row);
        });
    } else {
        recommendationsTable.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No recommendations available</td></tr>';
    }
}

// Helper functions for styling
function getSentimentBadgeColor(sentiment) {
    if (sentiment === undefined || sentiment === null) return 'secondary';
    if (sentiment < -0.5) return 'danger';
    if (sentiment < 0) return 'warning';
    if (sentiment < 0.5) return 'info';
    return 'success';
}

function getComplexityBadgeColor(complexity) {
    if (!complexity) return 'secondary';
    switch(complexity.toLowerCase()) {
        case 'high': return 'danger';
        case 'medium': return 'warning';
        case 'low': return 'success';
        default: return 'secondary';
    }
}

function getImpactBadgeColor(impact) {
    if (!impact) return 'secondary';
    switch(impact.toLowerCase()) {
        case 'high': return 'success';
        case 'medium': return 'info';
        case 'low': return 'secondary';
        default: return 'secondary';
    }
}

// Render the pain points table
function renderPainPointsTable(painPoints) {
    const tableBody = document.getElementById('pain-points-table');
    tableBody.innerHTML = '';
    
    // Display message if no data
    if (!painPoints || painPoints.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">
                    No pain points available. Try scraping data first.
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort by severity (highest first)
    painPoints.sort((a, b) => b.severity - a.severity);
    
    // Render each pain point
    painPoints.forEach(point => {
        const row = document.createElement('tr');
        
        // Determine severity class
        let severityClass = 'bg-success';
        if (point.severity > 0.7) {
            severityClass = 'bg-danger';
        } else if (point.severity > 0.4) {
            severityClass = 'bg-warning';
        }
        
        // Format sentiment
        const sentimentValue = point.avg_sentiment || 0;
        let sentimentText = sentimentValue.toFixed(2);
        let sentimentClass = 'text-info';
        
        if (sentimentValue < -0.3) {
            sentimentClass = 'text-danger';
        } else if (sentimentValue < 0) {
            sentimentClass = 'text-warning';
        } else if (sentimentValue > 0.3) {
            sentimentClass = 'text-success';
        }
        
        // Create row HTML
        row.innerHTML = `
            <td><strong>${point.name}</strong></td>
            <td>${point.description}</td>
            <td>${point.product || 'N/A'}</td>
            <td>${point.frequency}</td>
            <td class="${sentimentClass}">${sentimentText}</td>
            <td>
                <div class="progress">
                    <div class="progress-bar ${severityClass}" role="progressbar" 
                        style="width: ${point.severity * 100}%" 
                        aria-valuenow="${point.severity * 100}" 
                        aria-valuemin="0" aria-valuemax="100">
                        ${(point.severity * 100).toFixed(0)}%
                    </div>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Render posts list
function renderPostsList(posts) {
    const container = document.getElementById('posts-container');
    container.innerHTML = '';
    
    // Display message if no data
    if (!posts || posts.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5 text-muted">
                <p>No posts available. Try scraping data first.</p>
            </div>
        `;
        return;
    }
    
    // Render each post
    posts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'card mb-3';
        
        // Format date
        const postDate = new Date(post.created_utc);
        const dateString = postDate.toLocaleDateString();
        
        // Create HTML for pain points if available
        let painPointsHtml = '';
        if (post.pain_points && post.pain_points.length > 0) {
            painPointsHtml = `
                <div class="mt-2">
                    <strong>Pain Points:</strong>
                    <ul class="mb-0">
                        ${post.pain_points.map(point => `<li>${point}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Create HTML for sentiment if available
        let sentimentHtml = '';
        if (post.sentiment !== undefined && post.sentiment !== null) {
            let sentimentClass = 'text-info';
            if (post.sentiment < -0.3) {
                sentimentClass = 'text-danger';
            } else if (post.sentiment < 0) {
                sentimentClass = 'text-warning';
            } else if (post.sentiment > 0.3) {
                sentimentClass = 'text-success';
            }
            
            sentimentHtml = `
                <span class="${sentimentClass}">
                    <i class="fas fa-heart mr-1"></i> 
                    Sentiment: ${post.sentiment.toFixed(2)}
                </span>
            `;
        }
        
        // Assemble the card HTML
        card.innerHTML = `
            <div class="card-header d-flex justify-content-between align-items-center">
                <div>
                    <i class="fab fa-reddit mr-1"></i>
                    <strong>/r/${post.subreddit}</strong>
                </div>
                <div>
                    <span class="badge bg-primary">${post.score} points</span>
                    <span class="badge bg-secondary">${post.num_comments} comments</span>
                </div>
            </div>
            <div class="card-body">
                <h5 class="card-title">${post.title}</h5>
                <h6 class="card-subtitle mb-2 text-muted">
                    Posted by ${post.author} on ${dateString}
                </h6>
                <div class="d-flex justify-content-between mb-2">
                    <a href="${post.url}" target="_blank" class="card-link">
                        <i class="fas fa-external-link-alt mr-1"></i> View on Reddit
                    </a>
                    ${sentimentHtml}
                </div>
                ${painPointsHtml}
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Initialize the charts
function initCharts() {
    // Severity chart
    const severityCtx = document.getElementById('severity-chart').getContext('2d');
    severityChart = new Chart(severityCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Severity Score',
                data: [],
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Pain Points by Severity'
                }
            }
        }
    });
    
    // Category chart
    const categoryCtx = document.getElementById('category-chart').getContext('2d');
    categoryChart = new Chart(categoryCtx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                label: 'Pain Points by Category',
                data: [],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Pain Points by Category'
                }
            }
        }
    });
}

// Update the charts with new data
function updateCharts(painPoints) {
    if (!painPoints || painPoints.length === 0) {
        return;
    }
    
    // Prepare data for severity chart
    const topPainPoints = [...painPoints].sort((a, b) => b.severity - a.severity).slice(0, 10);
    const severityLabels = topPainPoints.map(p => p.name);
    const severityData = topPainPoints.map(p => p.severity);
    
    // Update severity chart
    severityChart.data.labels = severityLabels;
    severityChart.data.datasets[0].data = severityData;
    severityChart.update();
    
    // Prepare data for category chart
    const categories = {};
    painPoints.forEach(point => {
        const category = point.product || 'Uncategorized';
        categories[category] = (categories[category] || 0) + 1;
    });
    
    const categoryLabels = Object.keys(categories);
    const categoryData = Object.values(categories);
    
    // Update category chart
    categoryChart.data.labels = categoryLabels;
    categoryChart.data.datasets[0].data = categoryData;
    categoryChart.update();
}

// Filter pain points by product
function filterPainPointsByProduct() {
    const productFilter = document.getElementById('product-filter').value;
    
    if (productFilter === '') {
        // No filter, show all
        renderPainPointsTable(painPointsData);
    } else {
        // Filter by product
        const filteredPoints = painPointsData.filter(p => p.product === productFilter);
        renderPainPointsTable(filteredPoints);
    }
}

// Export pain points to CSV
function exportPainPoints() {
    if (!painPointsData || painPointsData.length === 0) {
        showToast('Export Error', 'No pain points data to export.', 'error');
        return;
    }
    
    // Create CSV header
    let csv = 'Name,Description,Product,Frequency,Sentiment,Severity\n';
    
    // Add rows
    painPointsData.forEach(point => {
        const row = [
            `"${point.name.replace(/"/g, '""')}"`,
            `"${point.description.replace(/"/g, '""')}"`,
            `"${(point.product || 'N/A').replace(/"/g, '""')}"`,
            point.frequency,
            point.avg_sentiment || 0,
            point.severity
        ];
        
        csv += row.join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'pain_points_export.csv');
    document.body.appendChild(a);
    
    // Trigger download
    a.click();
    document.body.removeChild(a);
    
    showToast('Export Success', 'Pain points exported to CSV successfully.', 'success');
}

// Show a toast notification
function showToast(title, message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Determine toast color based on type
    let bgClass = 'bg-info';
    if (type === 'success') bgClass = 'bg-success';
    if (type === 'error' || type === 'danger') bgClass = 'bg-danger';
    if (type === 'warning') bgClass = 'bg-warning';
    
    // Create toast HTML
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${bgClass} text-white">
                <strong class="me-auto">${title}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    // Add toast to container
    toastContainer.innerHTML += toastHtml;
    
    // Initialize and show toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 5000
    });
    toast.show();
    
    // Remove toast after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}
