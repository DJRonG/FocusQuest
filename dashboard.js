// Dashboard JavaScript - Analytics & Visualizations

const API_BASE_URL = 'http://localhost:8000/api';
let charts = {};
let refreshInterval = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
  await loadDashboardData();
  initializeCharts();
  startAutoRefresh();
});

// Load all dashboard data
async function loadDashboardData() {
  try {
    await Promise.all([
      loadKPIs(),
      loadActivityFeed(),
      loadTopPerforming(),
      loadJourneyStats()
    ]);
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

// Load KPI metrics
async function loadKPIs() {
  try {
    const response = await fetch(`${API_BASE_URL}/qr`);
    const qrCodes = await response.json();

    // Calculate KPIs
    const totalScans = qrCodes.reduce((sum, qr) => sum + qr.total_scans, 0);
    const activeQR = qrCodes.filter(qr => qr.state === 'active').length;
    const uniqueContacts = qrCodes.reduce((sum, qr) => sum + qr.unique_contacts, 0);

    // Calculate average conversion (mock for now)
    const avgConversion = activeQR > 0 ? ((uniqueContacts / Math.max(totalScans, 1)) * 100).toFixed(1) : 0;

    // Update KPI cards
    document.getElementById('kpi-total-scans').textContent = formatNumber(totalScans);
    document.getElementById('kpi-active-qr').textContent = activeQR;
    document.getElementById('kpi-unique-contacts').textContent = formatNumber(uniqueContacts);
    document.getElementById('kpi-conversion').textContent = avgConversion + '%';

    // Update change indicators (mock growth for demo)
    document.getElementById('kpi-scans-change').textContent = '+12.5% vs last period';
    document.getElementById('kpi-qr-change').textContent = `${activeQR} active now`;
    document.getElementById('kpi-contacts-change').textContent = '+8.3% growth';
    document.getElementById('kpi-conversion-change').textContent = 'Across all journeys';

  } catch (error) {
    console.error('Error loading KPIs:', error);
  }
}

// Load activity feed
async function loadActivityFeed() {
  try {
    const response = await fetch(`${API_BASE_URL}/qr`);
    const qrCodes = await response.json();

    const feed = document.getElementById('activity-feed');

    // Create activity items from recent QR codes
    const activities = [];

    // Add scans as activities
    qrCodes.forEach(qr => {
      if (qr.last_scanned_at) {
        activities.push({
          icon: '📊',
          text: `New scan: ${qr.campaign_name || qr.code}`,
          time: getRelativeTime(qr.last_scanned_at),
          timestamp: new Date(qr.last_scanned_at)
        });
      }

      if (qr.activated_at) {
        activities.push({
          icon: '✅',
          text: `QR activated: ${qr.campaign_name || qr.code}`,
          time: getRelativeTime(qr.activated_at),
          timestamp: new Date(qr.activated_at)
        });
      }
    });

    // Sort by most recent
    activities.sort((a, b) => b.timestamp - a.timestamp);

    // Take top 10
    const recentActivities = activities.slice(0, 10);

    if (recentActivities.length === 0) {
      feed.innerHTML = '<div class="activity-item"><span class="activity-icon">💤</span><div class="activity-content"><div class="activity-text">No recent activity</div><div class="activity-time">Create your first QR code to see activity</div></div></div>';
      return;
    }

    feed.innerHTML = recentActivities.map(activity => `
      <div class="activity-item">
        <span class="activity-icon">${activity.icon}</span>
        <div class="activity-content">
          <div class="activity-text">${activity.text}</div>
          <div class="activity-time">${activity.time}</div>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error loading activity feed:', error);
  }
}

// Load top performing QR codes
async function loadTopPerforming() {
  try {
    const response = await fetch(`${API_BASE_URL}/qr`);
    const qrCodes = await response.json();

    // Sort by total scans
    const topQRs = qrCodes
      .sort((a, b) => b.total_scans - a.total_scans)
      .slice(0, 5);

    const container = document.getElementById('top-qr-list');

    if (topQRs.length === 0) {
      container.innerHTML = '<div class="loading-state">No QR codes yet</div>';
      return;
    }

    container.innerHTML = topQRs.map(qr => `
      <div class="top-qr-item" onclick="window.location.href='qr-manager.html'">
        <div class="top-qr-info">
          <div class="top-qr-name">${qr.campaign_name || 'Unnamed Campaign'}</div>
          <div class="top-qr-code">${qr.code}</div>
        </div>
        <div class="top-qr-scans">${formatNumber(qr.total_scans)}</div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error loading top performing:', error);
  }
}

// Load journey statistics
async function loadJourneyStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/qr`);
    const qrCodes = await response.json();

    // Count by journey state
    const journeyCount = {};
    qrCodes.forEach(qr => {
      const journey = qr.journey_state;
      journeyCount[journey] = (journeyCount[journey] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(journeyCount), 1);

    const container = document.getElementById('journey-stats');

    const journeyLabels = {
      'lead_capture': 'Lead Capture',
      'event_checkin': 'Event Check-in',
      'nurture': 'Nurture',
      'conversion': 'Conversion',
      'retention': 'Retention',
      'reactivation': 'Reactivation'
    };

    container.innerHTML = Object.entries(journeyLabels).map(([key, label]) => {
      const count = journeyCount[key] || 0;
      const percentage = (count / maxCount) * 100;

      return `
        <div class="journey-stat-item">
          <span class="journey-label">${label}</span>
          <span class="journey-bar">
            <span class="journey-bar-fill" style="width: ${percentage}%"></span>
          </span>
          <span class="journey-value">${count}</span>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading journey stats:', error);
  }
}

// Initialize charts
function initializeCharts() {
  initScanActivityChart();
  initJourneyFunnelChart();
  initDeviceChart();
}

// Scan Activity Chart (Line Chart)
function initScanActivityChart() {
  const ctx = document.getElementById('scanActivityChart');
  if (!ctx) return;

  // Generate mock data for last 30 days
  const labels = [];
  const data = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    data.push(Math.floor(Math.random() * 100) + 50);
  }

  charts.scanActivity = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Scans',
        data: data,
        borderColor: '#ffcc33',
        backgroundColor: 'rgba(255, 204, 51, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#ffcc33',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 38, 77, 0.9)',
          titleColor: '#ffcc33',
          bodyColor: '#f5deb3',
          borderColor: '#ffcc33',
          borderWidth: 1,
          padding: 12,
          displayColors: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 204, 51, 0.1)'
          },
          ticks: {
            color: '#f5deb3'
          }
        },
        x: {
          grid: {
            color: 'rgba(255, 204, 51, 0.1)'
          },
          ticks: {
            color: '#f5deb3',
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    }
  });
}

// Journey Funnel Chart (Bar Chart)
function initJourneyFunnelChart() {
  const ctx = document.getElementById('journeyFunnelChart');
  if (!ctx) return;

  charts.journeyFunnel = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Lead Capture', 'Engagement', 'Nurture', 'Conversion', 'Retention'],
      datasets: [{
        label: 'Contacts',
        data: [10000, 8500, 6200, 3100, 1500],
        backgroundColor: [
          'rgba(255, 204, 51, 0.8)',
          'rgba(0, 191, 255, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          '#ffcc33',
          '#00bfff',
          '#22c55e',
          '#fbbf24',
          '#ef4444'
        ],
        borderWidth: 2
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 38, 77, 0.9)',
          titleColor: '#ffcc33',
          bodyColor: '#f5deb3',
          borderColor: '#ffcc33',
          borderWidth: 1,
          padding: 12
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 204, 51, 0.1)'
          },
          ticks: {
            color: '#f5deb3',
            callback: function(value) {
              return formatNumber(value);
            }
          }
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            color: '#f5deb3'
          }
        }
      }
    }
  });
}

// Device Chart (Doughnut Chart)
function initDeviceChart() {
  const ctx = document.getElementById('deviceChart');
  if (!ctx) return;

  charts.device = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Mobile', 'Desktop', 'Tablet'],
      datasets: [{
        data: [68, 28, 4],
        backgroundColor: [
          'rgba(255, 204, 51, 0.8)',
          'rgba(0, 191, 255, 0.8)',
          'rgba(34, 197, 94, 0.8)'
        ],
        borderColor: [
          '#ffcc33',
          '#00bfff',
          '#22c55e'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#f5deb3',
            padding: 15,
            font: {
              size: 14
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 38, 77, 0.9)',
          titleColor: '#ffcc33',
          bodyColor: '#f5deb3',
          borderColor: '#ffcc33',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              return context.label + ': ' + context.parsed + '%';
            }
          }
        }
      }
    }
  });
}

// Update chart based on timeframe
async function updateChart() {
  const timeframe = document.getElementById('chart-timeframe').value;
  // In a real implementation, fetch new data based on timeframe
  console.log('Update chart for timeframe:', timeframe);
  // For now, just re-initialize with the same data
  if (charts.scanActivity) {
    charts.scanActivity.destroy();
  }
  initScanActivityChart();
}

// Refresh dashboard
async function refreshDashboard() {
  const refreshIcon = document.getElementById('refresh-icon');
  refreshIcon.classList.add('refreshing');

  await loadDashboardData();

  setTimeout(() => {
    refreshIcon.classList.remove('refreshing');
  }, 1000);
}

// Start auto-refresh (every 30 seconds)
function startAutoRefresh() {
  refreshInterval = setInterval(async () => {
    await loadKPIs();
    await loadActivityFeed();
  }, 30000);
}

// Stop auto-refresh when page is hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (refreshInterval) clearInterval(refreshInterval);
  } else {
    startAutoRefresh();
  }
});

// Helper Functions
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}
