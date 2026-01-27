// QR Manager JavaScript
// Handles QR code creation, listing, and management

const API_BASE_URL = 'http://localhost:8000/api'; // Update for production

// Load QR codes on page load
document.addEventListener('DOMContentLoaded', () => {
  loadQRCodes();
  setupFormHandler();
});

// Setup form submission
function setupFormHandler() {
  const form = document.getElementById('createQRForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await createQRCode();
  });
}

// Create new QR code
async function createQRCode() {
  const campaignName = document.getElementById('campaignName').value;
  const journeyState = document.getElementById('journeyState').value;
  const eventType = document.getElementById('eventType').value;
  const defaultUrl = document.getElementById('defaultUrl').value;
  const tagsInput = document.getElementById('tags').value;

  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];

  const requestData = {
    campaign_name: campaignName,
    journey_state: journeyState,
    event_type: eventType,
    default_redirect_url: defaultUrl,
    tags: tags,
    version_name: 'Initial Version',
    redirect_rules: []
  };

  try {
    const response = await fetch(`${API_BASE_URL}/qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create QR code');
    }

    const qrCode = await response.json();
    alert(`QR Code created successfully! Code: ${qrCode.code}`);

    // Reset form
    document.getElementById('createQRForm').reset();

    // Reload list
    await loadQRCodes();

    // Show details
    showQRDetails(qrCode.qr_id);

  } catch (error) {
    console.error('Error creating QR code:', error);
    alert(`Error: ${error.message}`);
  }
}

// Load QR codes from API
async function loadQRCodes() {
  const listContainer = document.getElementById('qrCodeList');
  const filterJourney = document.getElementById('filterJourney').value;

  listContainer.innerHTML = '<p class="loading">Loading QR codes...</p>';

  try {
    let url = `${API_BASE_URL}/qr?limit=50`;
    if (filterJourney) {
      url += `&journey_state=${filterJourney}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to load QR codes');
    }

    const qrCodes = await response.json();

    if (qrCodes.length === 0) {
      listContainer.innerHTML = '<p class="loading">No QR codes found. Create your first one above!</p>';
      return;
    }

    // Render QR cards
    listContainer.innerHTML = qrCodes.map(qr => createQRCard(qr)).join('');

  } catch (error) {
    console.error('Error loading QR codes:', error);
    listContainer.innerHTML = `<div class="error">Error loading QR codes: ${error.message}</div>`;
  }
}

// Create QR card HTML
function createQRCard(qr) {
  const stateClass = qr.state.toLowerCase();
  const stateBadge = `<span class="qr-badge ${stateClass}">${qr.state.toUpperCase()}</span>`;

  const journeyLabel = qr.journey_state.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return `
    <div class="qr-card" onclick="showQRDetails('${qr.qr_id}')">
      <div class="qr-card-header">
        <h3>${qr.campaign_name || qr.code}</h3>
        ${stateBadge}
      </div>
      <div class="qr-card-body">
        <div class="qr-stat">
          <span class="qr-stat-label">Journey:</span>
          <span class="qr-stat-value">${journeyLabel}</span>
        </div>
        <div class="qr-stat">
          <span class="qr-stat-label">Total Scans:</span>
          <span class="qr-stat-value">${qr.total_scans}</span>
        </div>
        <div class="qr-stat">
          <span class="qr-stat-label">Unique Contacts:</span>
          <span class="qr-stat-value">${qr.unique_contacts}</span>
        </div>
        <div class="qr-stat">
          <span class="qr-stat-label">Code:</span>
          <span class="qr-stat-value">${qr.code}</span>
        </div>
      </div>
      <div class="qr-actions" onclick="event.stopPropagation()">
        ${qr.state === 'created' ?
          `<button class="btn-primary" onclick="activateQR('${qr.qr_id}')">Activate</button>` :
          ''}
        ${qr.state === 'active' ?
          `<button class="btn-secondary" onclick="downloadQR('${qr.qr_id}')">Download</button>` :
          ''}
      </div>
    </div>
  `;
}

// Show QR details in modal
async function showQRDetails(qrId) {
  const modal = document.getElementById('qrModal');
  const detailsContainer = document.getElementById('qrDetails');

  modal.style.display = 'flex';
  detailsContainer.innerHTML = '<p class="loading">Loading details...</p>';

  try {
    // Fetch QR details
    const qrResponse = await fetch(`${API_BASE_URL}/qr/${qrId}`);
    if (!qrResponse.ok) throw new Error('Failed to load QR details');
    const qr = await qrResponse.json();

    // Fetch analytics
    const analyticsResponse = await fetch(`${API_BASE_URL}/qr/${qrId}/analytics`);
    if (!analyticsResponse.ok) throw new Error('Failed to load analytics');
    const analytics = await analyticsResponse.json();

    // Render details
    detailsContainer.innerHTML = renderQRDetails(qr, analytics);

  } catch (error) {
    console.error('Error loading QR details:', error);
    detailsContainer.innerHTML = `<div class="error">Error: ${error.message}</div>`;
  }
}

// Render QR details HTML
function renderQRDetails(qr, analytics) {
  const journeyLabel = qr.journey_state.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const eventLabel = qr.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return `
    <div class="qr-detail-section">
      <h2>${qr.campaign_name || qr.code}</h2>
      <p style="color: rgba(245, 222, 179, 0.7);">Created: ${new Date(qr.created_at).toLocaleString()}</p>
    </div>

    <div class="qr-detail-section">
      <h3>QR Code Image</h3>
      <div class="qr-image-container">
        <img src="${API_BASE_URL}/qr/${qr.qr_id}/image" alt="QR Code" />
        <p style="margin-top: 10px; color: #00264d; font-weight: bold;">${qr.code}</p>
      </div>
      <div style="text-align: center;">
        <button class="btn-primary" onclick="downloadQR('${qr.qr_id}')">Download Image</button>
      </div>
    </div>

    <div class="qr-detail-section">
      <h3>Analytics</h3>
      <div class="analytics-grid">
        <div class="analytics-card">
          <div class="analytics-label">Total Scans</div>
          <div class="analytics-value">${analytics.total_scans}</div>
        </div>
        <div class="analytics-card">
          <div class="analytics-label">Unique Contacts</div>
          <div class="analytics-value">${analytics.unique_contacts}</div>
        </div>
        <div class="analytics-card">
          <div class="analytics-label">Returning Visitors</div>
          <div class="analytics-value">${analytics.contact_breakdown.returning}</div>
        </div>
        <div class="analytics-card">
          <div class="analytics-label">New Visitors</div>
          <div class="analytics-value">${analytics.contact_breakdown.total - analytics.contact_breakdown.returning}</div>
        </div>
      </div>
    </div>

    <div class="qr-detail-section">
      <h3>Configuration</h3>
      <div class="qr-stat">
        <span class="qr-stat-label">State:</span>
        <span class="qr-stat-value">${qr.state.toUpperCase()}</span>
      </div>
      <div class="qr-stat">
        <span class="qr-stat-label">Journey State:</span>
        <span class="qr-stat-value">${journeyLabel}</span>
      </div>
      <div class="qr-stat">
        <span class="qr-stat-label">Event Type:</span>
        <span class="qr-stat-value">${eventLabel}</span>
      </div>
      <div class="qr-stat">
        <span class="qr-stat-label">Default URL:</span>
        <span class="qr-stat-value" style="word-break: break-all; font-size: 12px;">${qr.default_redirect_url}</span>
      </div>
      <div class="qr-stat">
        <span class="qr-stat-label">Version:</span>
        <span class="qr-stat-value">${qr.current_version.name} (v${qr.current_version.version_number})</span>
      </div>
    </div>

    ${qr.tags.length > 0 ? `
      <div class="qr-detail-section">
        <h3>Tags</h3>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${qr.tags.map(tag => `<span class="qr-badge active">${tag}</span>`).join('')}
        </div>
      </div>
    ` : ''}

    <div class="qr-detail-section">
      <h3>Actions</h3>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        ${qr.state === 'created' ?
          `<button class="btn-primary" onclick="activateQR('${qr.qr_id}')">Activate QR Code</button>` :
          ''}
        ${qr.state === 'active' ?
          `<button class="btn-secondary" onclick="pauseQR('${qr.qr_id}')">Pause QR Code</button>` :
          ''}
        <button class="btn-secondary" onclick="copyQRURL('${qr.code}')">Copy Scan URL</button>
      </div>
    </div>
  `;
}

// Close modal
function closeModal() {
  document.getElementById('qrModal').style.display = 'none';
}

// Activate QR code
async function activateQR(qrId) {
  try {
    const response = await fetch(`${API_BASE_URL}/qr/${qrId}/activate`, {
      method: 'POST'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to activate QR code');
    }

    alert('QR code activated successfully!');
    await loadQRCodes();
    closeModal();

  } catch (error) {
    console.error('Error activating QR code:', error);
    alert(`Error: ${error.message}`);
  }
}

// Pause QR code
async function pauseQR(qrId) {
  try {
    const response = await fetch(`${API_BASE_URL}/qr/${qrId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ state: 'paused' })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to pause QR code');
    }

    alert('QR code paused successfully!');
    await loadQRCodes();
    closeModal();

  } catch (error) {
    console.error('Error pausing QR code:', error);
    alert(`Error: ${error.message}`);
  }
}

// Download QR image
function downloadQR(qrId) {
  const url = `${API_BASE_URL}/qr/${qrId}/image?size=600&format=PNG`;
  window.open(url, '_blank');
}

// Copy QR scan URL
function copyQRURL(code) {
  const url = `http://localhost:8000/qr/${code}`; // Update for production
  navigator.clipboard.writeText(url).then(() => {
    alert('Scan URL copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy URL:', err);
    alert(`URL: ${url}`);
  });
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('qrModal');
  if (event.target === modal) {
    closeModal();
  }
}
