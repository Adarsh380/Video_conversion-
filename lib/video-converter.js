export var JobStatus;
(function (JobStatus) {
    JobStatus["PENDING"] = "pending";
    JobStatus["QUEUED"] = "queued";
    JobStatus["PROCESSING"] = "processing";
    JobStatus["COMPLETED"] = "completed";
    JobStatus["FAILED"] = "failed";
    JobStatus["CANCELLED"] = "cancelled";
    JobStatus["PAUSED"] = "paused";
})(JobStatus || (JobStatus = {}));
export var JobPriority;
(function (JobPriority) {
    JobPriority["LOW"] = "low";
    JobPriority["NORMAL"] = "normal";
    JobPriority["HIGH"] = "high";
    JobPriority["URGENT"] = "urgent";
})(JobPriority || (JobPriority = {}));
export var QualityPreset;
(function (QualityPreset) {
    QualityPreset["ULTRA_LOW"] = "ultra_low";
    QualityPreset["LOW"] = "low";
    QualityPreset["MEDIUM"] = "medium";
    QualityPreset["HIGH"] = "high";
    QualityPreset["ULTRA_HIGH"] = "ultra_high";
    QualityPreset["LOSSLESS"] = "lossless";
})(QualityPreset || (QualityPreset = {}));
export var WatermarkPosition;
(function (WatermarkPosition) {
    WatermarkPosition["TOP_LEFT"] = "top_left";
    WatermarkPosition["TOP_CENTER"] = "top_center";
    WatermarkPosition["TOP_RIGHT"] = "top_right";
    WatermarkPosition["CENTER_LEFT"] = "center_left";
    WatermarkPosition["CENTER"] = "center";
    WatermarkPosition["CENTER_RIGHT"] = "center_right";
    WatermarkPosition["BOTTOM_LEFT"] = "bottom_left";
    WatermarkPosition["BOTTOM_CENTER"] = "bottom_center";
    WatermarkPosition["BOTTOM_RIGHT"] = "bottom_right";
})(WatermarkPosition || (WatermarkPosition = {}));
export var PresetCategory;
(function (PresetCategory) {
    PresetCategory["SOCIAL_MEDIA"] = "social_media";
    PresetCategory["PROFESSIONAL"] = "professional";
    PresetCategory["DEVICE_SPECIFIC"] = "device_specific";
    PresetCategory["STREAMING"] = "streaming";
    PresetCategory["ARCHIVAL"] = "archival";
    PresetCategory["CUSTOM"] = "custom";
})(PresetCategory || (PresetCategory = {}));
export var BatchJobStatus;
(function (BatchJobStatus) {
    BatchJobStatus["CREATED"] = "created";
    BatchJobStatus["PROCESSING"] = "processing";
    BatchJobStatus["COMPLETED"] = "completed";
    BatchJobStatus["PARTIALLY_FAILED"] = "partially_failed";
    BatchJobStatus["FAILED"] = "failed";
    BatchJobStatus["CANCELLED"] = "cancelled";
})(BatchJobStatus || (BatchJobStatus = {}));
export var PlanTier;
(function (PlanTier) {
    PlanTier["FREE"] = "free";
    PlanTier["STARTER"] = "starter";
    PlanTier["PROFESSIONAL"] = "professional";
    PlanTier["ENTERPRISE"] = "enterprise";
})(PlanTier || (PlanTier = {}));
export var BillingPeriod;
(function (BillingPeriod) {
    BillingPeriod["MONTHLY"] = "monthly";
    BillingPeriod["YEARLY"] = "yearly";
})(BillingPeriod || (BillingPeriod = {}));
export var ApiPermission;
(function (ApiPermission) {
    ApiPermission["READ_FILES"] = "read_files";
    ApiPermission["WRITE_FILES"] = "write_files";
    ApiPermission["CREATE_JOBS"] = "create_jobs";
    ApiPermission["READ_JOBS"] = "read_jobs";
    ApiPermission["CANCEL_JOBS"] = "cancel_jobs";
    ApiPermission["READ_PRESETS"] = "read_presets";
    ApiPermission["WRITE_PRESETS"] = "write_presets";
    ApiPermission["READ_STATISTICS"] = "read_statistics";
})(ApiPermission || (ApiPermission = {}));
export var WebhookEvent;
(function (WebhookEvent) {
    WebhookEvent["JOB_STARTED"] = "job.started";
    WebhookEvent["JOB_PROGRESS"] = "job.progress";
    WebhookEvent["JOB_COMPLETED"] = "job.completed";
    WebhookEvent["JOB_FAILED"] = "job.failed";
    WebhookEvent["BATCH_STARTED"] = "batch.started";
    WebhookEvent["BATCH_COMPLETED"] = "batch.completed";
    WebhookEvent["FILE_UPLOADED"] = "file.uploaded";
    WebhookEvent["FILE_DELETED"] = "file.deleted";
})(WebhookEvent || (WebhookEvent = {}));
export var CloudProvider;
(function (CloudProvider) {
    CloudProvider["AWS_S3"] = "aws_s3";
    CloudProvider["GOOGLE_CLOUD"] = "google_cloud";
    CloudProvider["AZURE_BLOB"] = "azure_blob";
    CloudProvider["DROPBOX"] = "dropbox";
    CloudProvider["GOOGLE_DRIVE"] = "google_drive";
    CloudProvider["ONEDRIVE"] = "onedrive";
})(CloudProvider || (CloudProvider = {}));
export var RecommendationType;
(function (RecommendationType) {
    RecommendationType["CODEC_UPGRADE"] = "codec_upgrade";
    RecommendationType["RESOLUTION_OPTIMIZATION"] = "resolution_optimization";
    RecommendationType["BITRATE_ADJUSTMENT"] = "bitrate_adjustment";
    RecommendationType["FORMAT_CHANGE"] = "format_change";
    RecommendationType["FILTER_APPLICATION"] = "filter_application";
    RecommendationType["QUALITY_ENHANCEMENT"] = "quality_enhancement";
})(RecommendationType || (RecommendationType = {}));
export class VideoConverter {
    constructor(apiKey, baseUrl) {
        this.apiKey = apiKey;
        this.apiBaseUrl = baseUrl || 'https://api.videoconverter.com/v1';
        this.defaultOptions = {};
    }
    async uploadFile(file, onProgress) {
        const formData = new FormData();
        formData.append('file', file);
        const xhr = new XMLHttpRequest();
        return new Promise((resolve, reject) => {
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable && onProgress) {
                    const progress = (event.loaded / event.total) * 100;
                    onProgress(progress);
                }
            });
            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response.data);
                }
                else {
                    reject(new Error(`Upload failed: ${xhr.statusText}`));
                }
            });
            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });
            xhr.open('POST', `${this.apiBaseUrl}/files/upload`);
            xhr.setRequestHeader('Authorization', `Bearer ${this.apiKey}`);
            xhr.send(formData);
        });
    }
    async createConversionJob(sourceFileId, configuration) {
        const response = await this.makeRequest('POST', '/jobs', {
            sourceFileId,
            configuration: { ...this.defaultOptions, ...configuration }
        });
        return response.data;
    }
    async createBatchJob(fileIds, configuration, name) {
        const response = await this.makeRequest('POST', '/jobs/batch', {
            fileIds,
            configuration: { ...this.defaultOptions, ...configuration },
            name
        });
        return response.data;
    }
    async getJob(jobId) {
        const response = await this.makeRequest('GET', `/jobs/${jobId}`);
        return response.data;
    }
    async cancelJob(jobId) {
        const response = await this.makeRequest('DELETE', `/jobs/${jobId}`);
        return response.success;
    }
    async getJobs(status, limit, offset) {
        const params = new URLSearchParams();
        if (status)
            params.append('status', status);
        if (limit)
            params.append('limit', limit.toString());
        if (offset)
            params.append('offset', offset.toString());
        const response = await this.makeRequest('GET', `/jobs?${params.toString()}`);
        return response.data;
    }
    async getPresets(category) {
        const params = category ? `?category=${category}` : '';
        const response = await this.makeRequest('GET', `/presets${params}`);
        return response.data;
    }
    async createPreset(preset) {
        const response = await this.makeRequest('POST', '/presets', preset);
        return response.data;
    }
    async analyzeVideo(fileId) {
        const response = await this.makeRequest('POST', `/files/${fileId}/analyze`);
        return response.data;
    }
    async getCapabilities() {
        const response = await this.makeRequest('GET', '/capabilities');
        return response.data;
    }
    async getStatistics() {
        const response = await this.makeRequest('GET', '/statistics');
        return response.data;
    }
    async makeRequest(method, endpoint, data) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
        };
        if (data) {
            options.body = JSON.stringify(data);
        }
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }
        return response.json();
    }
    setDefaultOptions(options) {
        this.defaultOptions = { ...this.defaultOptions, ...options };
    }
    getDefaultOptions() {
        return { ...this.defaultOptions };
    }
}
// Utility functions for common conversions
export class ConversionUtils {
    static createMP4Config(quality = QualityPreset.HIGH) {
        return {
            outputFormat: 'mp4',
            videoCodec: 'h264',
            audioCodec: 'aac',
            quality,
            videoOptions: {
                deinterlace: true,
                stabilization: false,
                colorCorrection: false,
                noiseReduction: false,
                sharpening: false
            }
        };
    }
    static createWebMConfig(quality = QualityPreset.HIGH) {
        return {
            outputFormat: 'webm',
            videoCodec: 'vp9',
            audioCodec: 'opus',
            quality,
            videoOptions: {
                deinterlace: true,
                stabilization: false,
                colorCorrection: false,
                noiseReduction: false,
                sharpening: false
            }
        };
    }
    static createSocialMediaConfig(platform) {
        const baseConfig = this.createMP4Config(QualityPreset.HIGH);
        switch (platform) {
            case 'instagram':
                return {
                    ...baseConfig,
                    resolution: { width: 1080, height: 1920 },
                    frameRate: 30,
                    videoBitRate: 2000000
                };
            case 'youtube':
                return {
                    ...baseConfig,
                    resolution: { width: 1920, height: 1080 },
                    frameRate: 60,
                    videoBitRate: 8000000
                };
            case 'tiktok':
                return {
                    ...baseConfig,
                    resolution: { width: 1080, height: 1920 },
                    frameRate: 30,
                    videoBitRate: 1500000
                };
            case 'facebook':
                return {
                    ...baseConfig,
                    resolution: { width: 1920, height: 1080 },
                    frameRate: 30,
                    videoBitRate: 3000000
                };
            default:
                return baseConfig;
        }
    }
    static calculateOptimalBitrate(width, height, frameRate, quality) {
        const pixels = width * height;
        const pixelsPerSecond = pixels * frameRate;
        let bitsPerPixel;
        switch (quality) {
            case QualityPreset.ULTRA_LOW:
                bitsPerPixel = 0.05;
                break;
            case QualityPreset.LOW:
                bitsPerPixel = 0.1;
                break;
            case QualityPreset.MEDIUM:
                bitsPerPixel = 0.2;
                break;
            case QualityPreset.HIGH:
                bitsPerPixel = 0.4;
                break;
            case QualityPreset.ULTRA_HIGH:
                bitsPerPixel = 0.8;
                break;
            default:
                bitsPerPixel = 0.2;
        }
        return Math.round(pixelsPerSecond * bitsPerPixel);
    }
    static estimateFileSize(duration, videoBitrate, audioBitrate = 128000) {
        const totalBitrate = videoBitrate + audioBitrate;
        return Math.round((totalBitrate * duration) / 8); // Convert bits to bytes
    }
    static estimateProcessingTime(fileSize, outputFormat, hardwareAcceleration = false) {
        // Base processing speed in MB/second
        let baseSpeed = hardwareAcceleration ? 5 : 2;
        // Adjust speed based on format complexity
        const formatMultipliers = {
            'mp4': 1.0,
            'webm': 1.2,
            'avi': 0.8,
            'mov': 1.1,
            'mkv': 1.3
        };
        const multiplier = formatMultipliers[outputFormat] || 1.0;
        const adjustedSpeed = baseSpeed * multiplier;
        return Math.round((fileSize / 1024 / 1024) / adjustedSpeed);
    }
}
export default VideoConverter;
