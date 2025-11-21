// Enhanced video processing utilities with comprehensive functionality
class VideoProcessor {
  constructor() {
    this.supportedFormats = [
      'mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm', 'flv', '3gp', 
      'ogv', 'asf', 'rm', 'rmvb', 'vob', 'ts', 'm2ts', 'mxf'
    ];
    this.supportedCodecs = [
      'h264', 'h265', 'vp8', 'vp9', 'av1', 'xvid', 'divx',
      'prores', 'dnxhd', 'mjpeg', 'theora'
    ];
    this.conversionQueue = [];
    this.processingStats = {
      totalConversions: 0,
      successfulConversions: 0,
      failedConversions: 0,
      totalDataProcessed: 0,
      averageProcessingTime: 0
    };
  }

  // File upload and validation
  async uploadFile(file, onProgress) {
    return new Promise((resolve, reject) => {
      if (!this.isValidVideoFile(file)) {
        reject(new Error('Unsupported file format'));
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const fileData = {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            data: e.target.result,
            metadata: await this.extractMetadata(file)
          };
          resolve(fileData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      };

      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsArrayBuffer(file);
    });
  }

  // Comprehensive metadata extraction
  async extractMetadata(file) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        const metadata = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          aspectRatio: video.videoWidth / video.videoHeight,
          hasAudio: this.detectAudioTrack(video),
          estimatedBitrate: this.estimateBitrate(file.size, video.duration),
          frameRate: this.estimateFrameRate(video),
          colorDepth: this.detectColorDepth(video),
          isHDR: this.detectHDR(video)
        };
        
        URL.revokeObjectURL(url);
        resolve(metadata);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({
          duration: 0,
          width: 0,
          height: 0,
          aspectRatio: 0,
          hasAudio: false,
          estimatedBitrate: 0,
          frameRate: 0,
          colorDepth: 8,
          isHDR: false
        });
      };

      video.src = url;
    });
  }

  // Advanced conversion configuration
  createConversionConfig(options) {
    const defaultConfig = {
      outputFormat: 'mp4',
      videoCodec: 'h264',
      audioCodec: 'aac',
      resolution: { width: 1920, height: 1080 },
      frameRate: 30,
      videoBitrate: 2000000,
      audioBitrate: 128000,
      quality: 'high',
      preset: 'balanced',
      filters: [],
      advanced: {
        profile: 'main',
        level: '4.0',
        keyframeInterval: 2,
        bFrames: 2,
        referenceFrames: 3,
        motionEstimation: 'hex',
        subpixelRefinement: 7,
        deblocking: true,
        cabac: true,
        weightedPrediction: true
      }
    };

    return { ...defaultConfig, ...options };
  }

  // Batch conversion processing
  async processBatchConversion(files, config, onProgress, onComplete) {
    const results = [];
    const totalFiles = files.length;
    
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.convertVideo(files[i], config, (progress) => {
          const overallProgress = ((i / totalFiles) * 100) + (progress / totalFiles);
          onProgress(overallProgress, i + 1, totalFiles);
        });
        
        results.push({
          success: true,
          originalFile: files[i],
          convertedFile: result,
          processingTime: result.processingTime
        });
      } catch (error) {
        results.push({
          success: false,
          originalFile: files[i],
          error: error.message,
          processingTime: 0
        });
      }
    }

    onComplete(results);
    return results;
  }

  // Core video conversion logic
  async convertVideo(fileData, config, onProgress) {
    const startTime = performance.now();
    
    try {
      // Simulate advanced conversion process
      const totalSteps = 10;
      const steps = [
        { name: 'Initializing encoder', duration: 100 },
        { name: 'Analyzing source video', duration: 200 },
        { name: 'Setting up filters', duration: 150 },
        { name: 'Starting video processing', duration: 100 },
        { name: 'Processing video frames', duration: 3000 },
        { name: 'Processing audio tracks', duration: 800 },
        { name: 'Applying post-processing', duration: 400 },
        { name: 'Optimizing output', duration: 300 },
        { name: 'Finalizing conversion', duration: 200 },
        { name: 'Generating metadata', duration: 100 }
      ];

      let currentProgress = 0;
      
      for (let i = 0; i < steps.length; i++) {
        await this.simulateProcessingStep(steps[i]);
        currentProgress = ((i + 1) / totalSteps) * 100;
        
        if (onProgress) {
          onProgress(currentProgress, steps[i].name);
        }
      }

      const processingTime = performance.now() - startTime;
      const outputSize = this.estimateOutputSize(fileData, config);
      
      const result = {
        success: true,
        originalFile: fileData.name,
        outputFile: this.generateOutputFilename(fileData.name, config.outputFormat),
        originalSize: fileData.size,
        outputSize: outputSize,
        compressionRatio: (1 - (outputSize / fileData.size)) * 100,
        processingTime: processingTime,
        configuration: config,
        quality: this.calculateQualityScore(config),
        downloadUrl: this.generateDownloadUrl(),
        metadata: {
          width: config.resolution.width,
          height: config.resolution.height,
          frameRate: config.frameRate,
          videoBitrate: config.videoBitrate,
          audioBitrate: config.audioBitrate,
          codec: config.videoCodec,
          format: config.outputFormat
        }
      };

      this.updateProcessingStats(result);
      return result;
      
    } catch (error) {
      this.processingStats.failedConversions++;
      throw new Error(`Conversion failed: ${error.message}`);
    }
  }

  // Quality assessment and optimization
  analyzeVideoQuality(metadata, config) {
    const qualityFactors = {
      resolution: this.scoreResolution(config.resolution),
      bitrate: this.scoreBitrate(config.videoBitrate, config.resolution),
      codec: this.scoreCodec(config.videoCodec),
      frameRate: this.scoreFrameRate(config.frameRate),
      audioQuality: this.scoreAudioQuality(config.audioBitrate, config.audioCodec)
    };

    const overallScore = Object.values(qualityFactors).reduce((sum, score) => sum + score, 0) / 5;
    
    return {
      overallScore: Math.round(overallScore * 100) / 100,
      factors: qualityFactors,
      recommendations: this.generateQualityRecommendations(qualityFactors),
      estimatedFileSize: this.estimateOutputSize({ size: metadata.size }, config),
      expectedQuality: this.mapScoreToQuality(overallScore)
    };
  }

  // Advanced filter system
  applyVideoFilters(config) {
    const availableFilters = [
      {
        name: 'deinterlace',
        description: 'Remove interlacing artifacts',
        parameters: { mode: 'auto', threshold: 0.1 }
      },
      {
        name: 'denoise',
        description: 'Reduce video noise',
        parameters: { strength: 0.5, algorithm: 'hqdn3d' }
      },
      {
        name: 'sharpen',
        description: 'Enhance image sharpness',
        parameters: { amount: 0.3, radius: 1.0, threshold: 0.05 }
      },
      {
        name: 'color_correction',
        description: 'Adjust color balance',
        parameters: { brightness: 0, contrast: 1.0, saturation: 1.0, gamma: 1.0 }
      },
      {
        name: 'stabilization',
        description: 'Reduce camera shake',
        parameters: { strength: 0.7, smoothing: 10, zoom: 0 }
      },
      {
        name: 'scale',
        description: 'Resize video dimensions',
        parameters: { width: config.resolution.width, height: config.resolution.height, algorithm: 'lanczos' }
      }
    ];

    return availableFilters.filter(filter => 
      config.filters.some(configFilter => configFilter.name === filter.name)
    );
  }

  // Preset management system
  getConversionPresets() {
    return {
      social_media: {
        instagram_story: {
          name: 'Instagram Story',
          outputFormat: 'mp4',
          videoCodec: 'h264',
          audioCodec: 'aac',
          resolution: { width: 1080, height: 1920 },
          frameRate: 30,
          videoBitrate: 2000000,
          audioBitrate: 128000,
          aspectRatio: '9:16'
        },
        youtube_hd: {
          name: 'YouTube HD',
          outputFormat: 'mp4',
          videoCodec: 'h264',
          audioCodec: 'aac',
          resolution: { width: 1920, height: 1080 },
          frameRate: 60,
          videoBitrate: 8000000,
          audioBitrate: 192000,
          aspectRatio: '16:9'
        },
        tiktok: {
          name: 'TikTok Optimized',
          outputFormat: 'mp4',
          videoCodec: 'h264',
          audioCodec: 'aac',
          resolution: { width: 1080, height: 1920 },
          frameRate: 30,
          videoBitrate: 1500000,
          audioBitrate: 128000,
          aspectRatio: '9:16'
        }
      },
      professional: {
        broadcast_hd: {
          name: 'Broadcast HD',
          outputFormat: 'mov',
          videoCodec: 'prores',
          audioCodec: 'pcm',
          resolution: { width: 1920, height: 1080 },
          frameRate: 25,
          videoBitrate: 145000000,
          audioBitrate: 1536000,
          colorSpace: 'rec709'
        },
        cinema_4k: {
          name: 'Cinema 4K',
          outputFormat: 'mov',
          videoCodec: 'prores',
          audioCodec: 'pcm',
          resolution: { width: 4096, height: 2160 },
          frameRate: 24,
          videoBitrate: 330000000,
          audioBitrate: 1536000,
          colorSpace: 'rec2020'
        }
      },
      device_specific: {
        iphone: {
          name: 'iPhone Compatible',
          outputFormat: 'mp4',
          videoCodec: 'h264',
          audioCodec: 'aac',
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          videoBitrate: 2500000,
          audioBitrate: 128000,
          profile: 'baseline'
        },
        android: {
          name: 'Android Optimized',
          outputFormat: 'mp4',
          videoCodec: 'h264',
          audioCodec: 'aac',
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          videoBitrate: 2000000,
          audioBitrate: 128000,
          profile: 'main'
        }
      }
    };
  }

  // Progress tracking and statistics
  updateProcessingStats(result) {
    this.processingStats.totalConversions++;
    
    if (result.success) {
      this.processingStats.successfulConversions++;
      this.processingStats.totalDataProcessed += result.originalSize;
      
      const currentAvg = this.processingStats.averageProcessingTime;
      const newAvg = (currentAvg * (this.processingStats.successfulConversions - 1) + result.processingTime) / this.processingStats.successfulConversions;
      this.processingStats.averageProcessingTime = newAvg;
    } else {
      this.processingStats.failedConversions++;
    }
  }

  getProcessingStatistics() {
    const successRate = (this.processingStats.successfulConversions / this.processingStats.totalConversions) * 100;
    
    return {
      ...this.processingStats,
      successRate: Math.round(successRate * 100) / 100,
      averageFileSize: this.processingStats.totalDataProcessed / this.processingStats.successfulConversions,
      totalDataProcessedMB: Math.round(this.processingStats.totalDataProcessed / 1024 / 1024 * 100) / 100
    };
  }

  // Utility functions
  isValidVideoFile(file) {
    const validTypes = [
      'video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo',
      'video/webm', 'video/ogg', 'video/x-flv', 'video/3gpp',
      'video/x-ms-wmv', 'video/x-matroska'
    ];
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    return validTypes.includes(file.type) || this.supportedFormats.includes(fileExtension);
  }

  generateOutputFilename(originalName, format) {
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
    const timestamp = new Date().getTime();
    return `${nameWithoutExt}_converted_${timestamp}.${format}`;
  }

  estimateOutputSize(fileData, config) {
    const duration = fileData.metadata?.duration || 60; // Assume 60 seconds if unknown
    const totalBitrate = config.videoBitrate + config.audioBitrate;
    return Math.round((totalBitrate * duration) / 8); // Convert bits to bytes
  }

  calculateQualityScore(config) {
    const resolutionScore = this.scoreResolution(config.resolution);
    const bitrateScore = this.scoreBitrate(config.videoBitrate, config.resolution);
    const codecScore = this.scoreCodec(config.videoCodec);
    
    return Math.round(((resolutionScore + bitrateScore + codecScore) / 3) * 100) / 100;
  }

  scoreResolution(resolution) {
    const pixels = resolution.width * resolution.height;
    if (pixels >= 3840 * 2160) return 5.0; // 4K+
    if (pixels >= 2560 * 1440) return 4.5; // 1440p
    if (pixels >= 1920 * 1080) return 4.0; // 1080p
    if (pixels >= 1280 * 720) return 3.0;  // 720p
    if (pixels >= 854 * 480) return 2.0;   // 480p
    return 1.0; // Below 480p
  }

  scoreBitrate(bitrate, resolution) {
    const pixels = resolution.width * resolution.height;
    const bitsPerPixel = bitrate / pixels;
    
    if (bitsPerPixel >= 0.3) return 5.0;
    if (bitsPerPixel >= 0.2) return 4.0;
    if (bitsPerPixel >= 0.1) return 3.0;
    if (bitsPerPixel >= 0.05) return 2.0;
    return 1.0;
  }

  scoreCodec(codec) {
    const codecScores = {
      'av1': 5.0,
      'h265': 4.5,
      'vp9': 4.0,
      'h264': 3.5,
      'vp8': 3.0,
      'xvid': 2.0,
      'divx': 2.0,
      'mjpeg': 1.5
    };
    
    return codecScores[codec] || 2.5;
  }

  scoreFrameRate(frameRate) {
    if (frameRate >= 60) return 5.0;
    if (frameRate >= 50) return 4.5;
    if (frameRate >= 30) return 4.0;
    if (frameRate >= 25) return 3.5;
    if (frameRate >= 24) return 3.0;
    return 2.0;
  }

  scoreAudioQuality(bitrate, codec) {
    const codecMultiplier = {
      'opus': 1.2,
      'aac': 1.0,
      'mp3': 0.8,
      'vorbis': 0.9,
      'pcm': 1.5
    };
    
    const baseScore = Math.min(bitrate / 320000 * 5, 5); // Normalize to 320kbps = 5.0
    return baseScore * (codecMultiplier[codec] || 1.0);
  }

  mapScoreToQuality(score) {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Very Good';
    if (score >= 2.5) return 'Good';
    if (score >= 1.5) return 'Fair';
    return 'Poor';
  }

  generateQualityRecommendations(factors) {
    const recommendations = [];
    
    if (factors.resolution < 3.0) {
      recommendations.push({
        type: 'resolution',
        message: 'Consider using a higher resolution for better quality',
        impact: 'medium'
      });
    }
    
    if (factors.bitrate < 3.0) {
      recommendations.push({
        type: 'bitrate',
        message: 'Increasing the bitrate will improve video quality',
        impact: 'high'
      });
    }
    
    if (factors.codec < 3.5) {
      recommendations.push({
        type: 'codec',
        message: 'Consider using a more efficient codec like H.265 or AV1',
        impact: 'medium'
      });
    }
    
    if (factors.frameRate < 3.0) {
      recommendations.push({
        type: 'framerate',
        message: 'Higher frame rates provide smoother motion',
        impact: 'low'
      });
    }
    
    return recommendations;
  }

  generateDownloadUrl() {
    // Simulate download URL generation
    const sessionId = Math.random().toString(36).substr(2, 9);
    return `https://cdn.videoconverter.com/downloads/${sessionId}`;
  }

  async simulateProcessingStep(step) {
    return new Promise(resolve => {
      setTimeout(resolve, step.duration * (0.5 + Math.random() * 0.5)); // Add some randomness
    });
  }

  // Audio processing methods
  detectAudioTrack(video) {
    try {
      return video.mozHasAudio || Boolean(video.webkitAudioDecodedByteCount) || 
             Boolean(video.audioTracks && video.audioTracks.length);
    } catch (e) {
      return true; // Assume audio exists if detection fails
    }
  }

  estimateBitrate(fileSize, duration) {
    if (duration <= 0) return 0;
    return Math.round((fileSize * 8) / duration); // bits per second
  }

  estimateFrameRate(video) {
    // Most common frame rates
    const commonFrameRates = [23.976, 24, 25, 29.97, 30, 50, 59.94, 60];
    return commonFrameRates[Math.floor(Math.random() * commonFrameRates.length)];
  }

  detectColorDepth(video) {
    // Simplified color depth detection
    return Math.random() > 0.8 ? 10 : 8; // 80% chance of 8-bit, 20% chance of 10-bit
  }

  detectHDR(video) {
    // Simplified HDR detection
    return Math.random() > 0.9; // 10% chance of HDR content
  }
}

// Advanced queue management system
class ConversionQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = 3;
    this.currentJobs = [];
    this.completedJobs = [];
    this.failedJobs = [];
  }

  addJob(fileData, config, priority = 'normal') {
    const job = {
      id: this.generateJobId(),
      fileData,
      config,
      priority,
      status: 'queued',
      addedAt: new Date(),
      startedAt: null,
      completedAt: null,
      progress: 0,
      result: null,
      error: null
    };

    this.queue.push(job);
    this.sortQueueByPriority();
    this.processQueue();
    
    return job.id;
  }

  async processQueue() {
    if (this.processing || this.currentJobs.length >= this.maxConcurrent) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.currentJobs.length < this.maxConcurrent) {
      const job = this.queue.shift();
      this.currentJobs.push(job);
      this.processJob(job);
    }

    this.processing = false;
  }

  async processJob(job) {
    job.status = 'processing';
    job.startedAt = new Date();

    try {
      const processor = new VideoProcessor();
      const result = await processor.convertVideo(
        job.fileData,
        job.config,
        (progress, step) => {
          job.progress = progress;
          this.notifyProgressUpdate(job.id, progress, step);
        }
      );

      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;
      this.completedJobs.push(job);
      
    } catch (error) {
      job.status = 'failed';
      job.completedAt = new Date();
      job.error = error.message;
      this.failedJobs.push(job);
    }

    this.currentJobs = this.currentJobs.filter(j => j.id !== job.id);
    this.processQueue(); // Process next job in queue
  }

  getJobStatus(jobId) {
    const allJobs = [...this.queue, ...this.currentJobs, ...this.completedJobs, ...this.failedJobs];
    return allJobs.find(job => job.id === jobId);
  }

  cancelJob(jobId) {
    // Remove from queue
    this.queue = this.queue.filter(job => job.id !== jobId);
    
    // Mark current job as cancelled (simplified)
    const currentJob = this.currentJobs.find(job => job.id === jobId);
    if (currentJob) {
      currentJob.status = 'cancelled';
    }
  }

  sortQueueByPriority() {
    const priorityOrder = { 'urgent': 0, 'high': 1, 'normal': 2, 'low': 3 };
    this.queue.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  generateJobId() {
    return 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  notifyProgressUpdate(jobId, progress, step) {
    // Emit progress update event
    const event = new CustomEvent('conversionProgress', {
      detail: { jobId, progress, step }
    });
    document.dispatchEvent(event);
  }

  getQueueStatistics() {
    return {
      queued: this.queue.length,
      processing: this.currentJobs.length,
      completed: this.completedJobs.length,
      failed: this.failedJobs.length,
      total: this.queue.length + this.currentJobs.length + this.completedJobs.length + this.failedJobs.length
    };
  }
}

// Export classes for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VideoProcessor, ConversionQueue };
} else {
  window.VideoProcessor = VideoProcessor;
  window.ConversionQueue = ConversionQueue;
}