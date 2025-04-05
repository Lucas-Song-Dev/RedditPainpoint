// DataVisualization component for creating charts with Chart.js

const DataVisualization = ({ data, type }) => {
  const chartRef = React.useRef(null);
  const [chart, setChart] = React.useState(null);
  
  React.useEffect(() => {
    // Clean up any existing chart
    if (chart) {
      chart.destroy();
    }
    
    // Create a new chart if we have data
    if (data && data.length > 0 && chartRef.current) {
      createChart();
    }
    
    return () => {
      if (chart) {
        chart.destroy();
      }
    };
  }, [data, type]);
  
  const createChart = () => {
    const ctx = chartRef.current.getContext('2d');
    
    let newChart;
    
    if (type === 'productComparison') {
      // For comparing pain points across products
      const products = [...new Set(data.map(item => item.product_name))];
      const datasets = products.map(product => {
        const productData = data.filter(item => item.product_name === product);
        return {
          label: product,
          data: productData.map(item => item.frequency),
          backgroundColor: getRandomColor(),
        };
      });
      
      const labels = [...new Set(data.map(item => item.pain_point))];
      
      newChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Pain Points by Product',
              font: {
                size: 16,
              },
            },
            legend: {
              position: 'top',
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Frequency',
              },
            },
            x: {
              title: {
                display: true,
                text: 'Pain Point',
              },
            },
          },
        },
      });
    } else if (type === 'painPointDistribution') {
      // For showing distribution of pain points for a single product
      const painPoints = data.map(item => item.pain_point);
      const frequencies = data.map(item => item.frequency);
      
      newChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: painPoints,
          datasets: [
            {
              data: frequencies,
              backgroundColor: painPoints.map(() => getRandomColor()),
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: `Pain Point Distribution for ${data[0]?.product_name || 'Product'}`,
              font: {
                size: 16,
              },
            },
            legend: {
              position: 'right',
            },
          },
        },
      });
    } else if (type === 'timelineTrend') {
      // Placeholder for timeline trend (would need date-based data)
      newChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [
            {
              label: 'Number of Issues',
              data: [12, 19, 3, 5],
              borderColor: getRandomColor(),
              tension: 0.1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Issues Over Time',
              font: {
                size: 16,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Issues',
              },
            },
            x: {
              title: {
                display: true,
                text: 'Time Period',
              },
            },
          },
        },
      });
    }
    
    setChart(newChart);
  };
  
  // Helper function to generate random colors
  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };
  
  return (
    <div className="chart-container" style={{ position: 'relative', height: '400px', width: '100%' }}>
      {data && data.length > 0 ? (
        <canvas ref={chartRef}></canvas>
      ) : (
        <div className="d-flex justify-content-center align-items-center h-100">
          <div className="text-center text-muted">
            <i className="fas fa-chart-pie fa-3x mb-3"></i>
            <p>No data available for visualization</p>
          </div>
        </div>
      )}
    </div>
  );
};
