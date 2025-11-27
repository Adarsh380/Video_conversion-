// Dashboard functionality and interactive features
class DashboardManager {
  constructor() {
    this.init();
    this.bindEvents();
    this.loadData();
  }

  init() {
    this.sidebar = document.querySelector('.sidebar');
    this.sidebarToggle = document.querySelector('.sidebar-toggle');
    this.searchInput = document.querySelector('.search-input');
    this.quickActionCards = document.querySelectorAll('.quick-action-card');
    this.activityList = document.querySelector('.activity-list');
    this.queueList = document.querySelector('.queue-list');
    this.usageChart = document.getElementById('usageChart');
    
    this.stats = {
      videosConverted: 1247,
      dataProcessed: 47.2,
      avgProcessingTime: 154,
      successRate: 98.7
    };

    this.initializeChart();
  }

  bindEvents() {
    // Sidebar toggle
    if (this.sidebarToggle) {
      this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
    }

    // Search functionality
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    }

    // Quick action cards
    this.quickActionCards.forEach(card => {
      card.addEventListener('click', (e) => this.handleQuickAction(e.currentTarget));
    });

    // Queue management
    this.bindQueueEvents();

    // Real-time updates
    this.startRealTimeUpdates();

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
  }

  toggleSidebar() {
    this.sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', this.sidebar.classList.contains('collapsed'));
  }

  handleSearch(query) {
    if (query.length < 2) {
      this.clearSearchResults();
      return;
    }

    // Simulate search results
    const results = this.performSearch(query);
    this.displaySearchResults(results);
  }

  performSearch(query) {
    const mockResults = [
      { type: 'file', name: 'marketing_video.mp4', size: '45 MB', status: 'completed' },
      { type: 'file', name: 'presentation.avi', size: '120 MB', status: 'processing' },
      { type: 'preset', name: 'YouTube HD', category: 'social_media' },
      { type: 'job', id: 'job_12345', status: 'queued' }
    ];

    return mockResults.filter(item => 
      item.name?.toLowerCase().includes(query.toLowerCase()) ||
      item.id?.toLowerCase().includes(query.toLowerCase())
    );
  }

  displaySearchResults(results) {
    // Create search results dropdown
    let dropdown = document.querySelector('.search-results');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.className = 'search-results';
      this.searchInput.parentNode.appendChild(dropdown);
    }

    dropdown.innerHTML = results.map(result => `
      <div class="search-result-item" data-type="${result.type}">
        <div class="result-icon">
          ${this.getResultIcon(result.type)}
        </div>
        <div class="result-content">
          <div class="result-title">${result.name || result.id}</div>
          <div class="result-meta">${this.getResultMeta(result)}</div>
        </div>
      </div>
    `).join('');

    dropdown.style.display = results.length > 0 ? 'block' : 'none';
  }

  clearSearchResults() {
    const dropdown = document.querySelector('.search-results');
    if (dropdown) {
      dropdown.style.display = 'none';
    }
  }

  getResultIcon(type) {
    const icons = {
      file: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>',
      preset: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
      job: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>'
    };
    return icons[type] || icons.file;
  }

  getResultMeta(result) {
    switch (result.type) {
      case 'file':
        return `${result.size} • ${result.status}`;
      case 'preset':
        return result.category;
      case 'job':
        return result.status;
      default:
        return '';
    }
  }

  handleQuickAction(card) {
    const action = card.querySelector('.action-title').textContent.trim().toLowerCase();
    
    switch (action) {
      case 'upload video':
        this.openUploadModal();
        break;
      case 'batch convert':
        this.openBatchConverter();
        break;
      case 'create preset':
        this.openPresetCreator();
        break;
      case 'view library':
        this.navigateToLibrary();
        break;
    }
  }

  openUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
      modal.style.display = 'flex';
      this.initializeUploadArea();
    }
  }

  initializeUploadArea() {
    const uploadZone = document.querySelector('.upload-zone');
    if (!uploadZone) return;

    // Drag and drop functionality
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      
      const files = Array.from(e.dataTransfer.files);
      this.handleFileUpload(files);
    });

    uploadZone.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'video/*';
      input.onchange = (e) => this.handleFileUpload(Array.from(e.target.files));
      input.click();
    });
  }

  handleFileUpload(files) {
    const processor = new VideoProcessor();
    
    files.forEach(async (file) => {
      try {
        const fileData = await processor.uploadFile(file, (progress) => {
          this.updateUploadProgress(file.name, progress);
        });
        
        this.addFileToQueue(fileData);
      } catch (error) {
        this.showError(`Failed to upload ${file.name}: ${error.message}`);
      }
    });
  }

  updateUploadProgress(fileName, progress) {
    // Update upload progress in UI
    console.log(`Upload progress for ${fileName}: ${progress}%`);
  }

  addFileToQueue(fileData) {
    const queueItem = this.createQueueItem(fileData);
    this.queueList.appendChild(queueItem);
    this.updateQueueStats();
  }

  createQueueItem(fileData) {
    const item = document.createElement('div');
    item.className = 'queue-item waiting';
    item.innerHTML = `
      <div class="file-info">
        <div class="file-thumbnail">
          <svg viewBox="0 0 24 24">
            <path d="M23 7l-7 5 7 5V7z"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </div>
        <div class="file-details">
          <h4 class="file-name">${fileData.name}</h4>
          <p class="file-specs">${this.formatFileSize(fileData.size)} • Waiting for conversion</p>
        </div>
      </div>
      <div class="conversion-status">
        <span class="status-badge waiting">Waiting</span>
      </div>
      <div class="queue-actions">
        <button class="btn btn-sm btn-outline" onclick="dashboard.prioritizeJob('${fileData.id}')">Priority</button>
        <button class="btn btn-sm btn-ghost" onclick="dashboard.removeFromQueue('${fileData.id}')">Remove</button>
      </div>
    `;
    return item;
  }

  bindQueueEvents() {
    // Queue control buttons
    const pauseAllBtn = document.querySelector('[onclick*="pauseAll"]');
    const addFilesBtn = document.querySelector('[onclick*="addFiles"]');

    if (pauseAllBtn) {
      pauseAllBtn.addEventListener('click', () => this.pauseAllJobs());
    }

    if (addFilesBtn) {
      addFilesBtn.addEventListener('click', () => this.openUploadModal());
    }

    // Individual queue item actions are handled via onclick attributes for simplicity
  }

  prioritizeJob(jobId) {
    // Move job to front of queue
    const queueItem = document.querySelector(`[data-job-id="${jobId}"]`);
    if (queueItem && this.queueList.firstChild) {
      this.queueList.insertBefore(queueItem, this.queueList.firstChild);
    }
    this.showNotification('Job moved to priority queue');
  }

  removeFromQueue(jobId) {
    const queueItem = document.querySelector(`[data-job-id="${jobId}"]`);
    if (queueItem) {
      queueItem.remove();
      this.updateQueueStats();
      this.showNotification('Job removed from queue');
    }
  }

  pauseAllJobs() {
    const processingItems = document.querySelectorAll('.queue-item.processing');
    processingItems.forEach(item => {
      item.classList.remove('processing');
      item.classList.add('paused');
      
      const statusBadge = item.querySelector('.status-badge');
      statusBadge.textContent = 'Paused';
      statusBadge.className = 'status-badge paused';
    });
    
    this.showNotification('All jobs paused');
  }

  updateQueueStats() {
    const stats = {
      waiting: document.querySelectorAll('.queue-item.waiting').length,
      processing: document.querySelectorAll('.queue-item.processing').length,
      completed: document.querySelectorAll('.queue-item.completed').length,
      failed: document.querySelectorAll('.queue-item.failed').length
    };

    // Update stats display (if exists)
    const statsContainer = document.querySelector('.queue-stats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat">Waiting: ${stats.waiting}</div>
        <div class="stat">Processing: ${stats.processing}</div>
        <div class="stat">Completed: ${stats.completed}</div>
        <div class="stat">Failed: ${stats.failed}</div>
      `;
    }
  }

  initializeChart() {
    if (!this.usageChart) return;

    // Mock chart data
    const chartData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Conversions',
        data: [65, 78, 90, 81, 56, 45, 120],
        borderColor: '#e91e63',
        backgroundColor: 'rgba(233, 30, 99, 0.1)',
        tension: 0.4
      }, {
        label: 'Data Processed (GB)',
        data: [2.1, 2.8, 3.2, 2.9, 1.9, 1.5, 4.1],
        borderColor: '#f8bbd9',
        backgroundColor: 'rgba(248, 187, 217, 0.1)',
        tension: 0.4
      }]
    };

    // Simple chart rendering (replace with actual chart library)
    this.renderSimpleChart(chartData);
  }

  renderSimpleChart(data) {
    // Simplified chart rendering for demonstration
    const canvas = this.usageChart;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw simple line chart
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Draw axes
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();
    
    // Draw data points
    const dataPoints = data.datasets[0].data;
    const stepX = chartWidth / (dataPoints.length - 1);
    const maxY = Math.max(...dataPoints);
    
    ctx.strokeStyle = data.datasets[0].borderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    dataPoints.forEach((point, index) => {
      const x = padding + index * stepX;
      const y = height - padding - (point / maxY) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
  }

  loadData() {
    this.loadRecentActivity();
    this.updateStatCards();
    this.loadQueueItems();
  }

  loadRecentActivity() {
    // Mock recent activity data
    const activities = [
      {
        type: 'success',
        title: 'Video conversion completed',
        description: 'marketing_video.mp4 → marketing_video.webm',
        time: '2 minutes ago'
      },
      {
        type: 'processing',
        title: 'Batch conversion in progress',
        description: 'Processing 5 videos (73% complete)',
        time: '5 minutes ago'
      },
      {
        type: 'upload',
        title: 'New files uploaded',
        description: '3 files ready for conversion',
        time: '12 minutes ago'
      }
    ];

    // Update activity list (activities are already in HTML, this is for dynamic updates)
    this.scheduleActivityUpdate();
  }

  scheduleActivityUpdate() {
    // Simulate real-time activity updates
    setInterval(() => {
      const activities = document.querySelectorAll('.activity-item');
      if (activities.length > 0) {
        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        this.updateActivityTime(randomActivity);
      }
    }, 30000); // Update every 30 seconds
  }

  updateActivityTime(activityElement) {
    const timeElement = activityElement.querySelector('.activity-time');
    if (timeElement) {
      const currentTime = timeElement.textContent;
      const minutes = parseInt(currentTime.match(/\d+/)?.[0] || '0');
      timeElement.textContent = `${minutes + 1} minutes ago`;
    }
  }

  updateStatCards() {
    // Animate stat numbers
    this.animateStatCard('.stat-number', this.stats.videosConverted, '1,247');
    
    // Update trends
    this.updateTrends();
  }

  animateStatCard(selector, targetValue, displayValue) {
    const element = document.querySelector(selector);
    if (!element) return;

    let current = 0;
    const increment = targetValue / 50;
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetValue) {
        current = targetValue;
        clearInterval(timer);
      }
      element.textContent = displayValue;
    }, 20);
  }

  updateTrends() {
    const trends = document.querySelectorAll('.stat-trend');
    trends.forEach(trend => {
      // Add subtle animation to trend indicators
      trend.style.opacity = '0.7';
      setTimeout(() => {
        trend.style.opacity = '1';
      }, Math.random() * 1000);
    });
  }

  loadQueueItems() {
    // Queue items are already in HTML, this handles dynamic updates
    this.simulateQueueProgress();
  }

  simulateQueueProgress() {
    const processingItems = document.querySelectorAll('.queue-item.processing');
    
    processingItems.forEach(item => {
      const progressBar = item.querySelector('.progress-fill');
      const progressText = item.querySelector('.progress-text');
      
      if (progressBar && progressText) {
        setInterval(() => {
          let current = parseInt(progressText.textContent) || 0;
          if (current < 100) {
            current += Math.random() * 5;
            current = Math.min(current, 100);
            
            progressBar.style.width = `${current}%`;
            progressText.textContent = `${Math.round(current)}%`;
            
            if (current >= 100) {
              item.classList.remove('processing');
              item.classList.add('completed');
              
              const statusBadge = item.querySelector('.status-badge');
              statusBadge.textContent = 'Completed';
              statusBadge.className = 'status-badge completed';
            }
          }
        }, 2000 + Math.random() * 3000);
      }
    });
  }

  startRealTimeUpdates() {
    // Simulate real-time dashboard updates
    setInterval(() => {
      this.updateStatCards();
      this.checkForNewActivity();
    }, 10000); // Update every 10 seconds
  }

  checkForNewActivity() {
    // Randomly add new activity items
    if (Math.random() < 0.1) { // 10% chance every 10 seconds
      this.addNewActivity();
    }
  }

  addNewActivity() {
    const newActivities = [
      {
        type: 'success',
        title: 'Conversion completed',
        description: 'training_video.avi → training_video.mp4',
        time: 'just now'
      },
      {
        type: 'upload',
        title: 'File uploaded',
        description: 'new_project.mov ready for processing',
        time: 'just now'
      }
    ];

    const activity = newActivities[Math.floor(Math.random() * newActivities.length)];
    const activityHTML = this.createActivityHTML(activity);
    
    this.activityList.insertAdjacentHTML('afterbegin', activityHTML);
    
    // Remove oldest activity to maintain list size
    const activities = this.activityList.querySelectorAll('.activity-item');
    if (activities.length > 5) {
      activities[activities.length - 1].remove();
    }
  }

  createActivityHTML(activity) {
    const icons = {
      success: '<polyline points="20,6 9,17 4,12"/>',
      processing: '<circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>',
      upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/>',
      error: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
    };

    return `
      <div class="activity-item">
        <div class="activity-icon ${activity.type}">
          <svg viewBox="0 0 24 24">${icons[activity.type]}</svg>
        </div>
        <div class="activity-content">
          <h4 class="activity-title">${activity.title}</h4>
          <p class="activity-description">${activity.description}</p>
          <span class="activity-time">${activity.time}</span>
        </div>
        <div class="activity-actions">
          <button class="btn btn-sm btn-outline">View</button>
        </div>
      </div>
    `;
  }

  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + U: Upload files
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      this.openUploadModal();
    }
    
    // Ctrl/Cmd + S: Search
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      this.searchInput?.focus();
    }
    
    // Escape: Close modals
    if (e.key === 'Escape') {
      this.closeAllModals();
    }
  }

  closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
      modal.style.display = 'none';
    });
  }

  // Utility methods
  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  // Navigation methods
  openBatchConverter() {
    window.location.href = '#batch-converter';
  }

  openPresetCreator() {
    window.location.href = '#preset-creator';
  }

  navigateToLibrary() {
    window.location.href = '#library';
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new DashboardManager();
});

// Modal close functionality
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close')) {
    e.target.closest('.modal-overlay').style.display = 'none';
  }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DashboardManager;
}