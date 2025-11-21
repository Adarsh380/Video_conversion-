export interface VideoFile {
  id: string;
  name: string;
  size: number;
  duration: number;
  format: string;
  codec: string;
  resolution: {
    width: number;
    height: number;
  };
  frameRate: number;
  bitRate: number;
  audioChannels: number;
  audioCodec: string;
  audioBitRate: number;
  createdAt: Date;
  updatedAt: Date;
  metadata: VideoMetadata;
}

export interface VideoMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  thumbnail?: string;
  chapters?: Chapter[];
  subtitles?: SubtitleTrack[];
  audioTracks?: AudioTrack[];
  videoTracks?: VideoTrack[];
}

export interface Chapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  description?: string;
  thumbnail?: string;
}

export interface SubtitleTrack {
  id: string;
  language: string;
  languageCode: string;
  format: 'srt' | 'vtt' | 'ass' | 'ssa';
  url?: string;
  content?: string;
  isDefault: boolean;
  isForced: boolean;
}

export interface AudioTrack {
  id: string;
  language: string;
  languageCode: string;
  codec: string;
  bitRate: number;
  channels: number;
  sampleRate: number;
  isDefault: boolean;
  title?: string;
}

export interface VideoTrack {
  id: string;
  codec: string;
  width: number;
  height: number;
  frameRate: number;
  bitRate: number;
  pixelFormat: string;
  colorSpace?: string;
  isDefault: boolean;
  rotation?: number;
}

export interface ConversionJob {
  id: string;
  sourceFile: VideoFile;
  targetFormat: string;
  status: JobStatus;
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  outputFile?: VideoFile;
  configuration: ConversionConfiguration;
  estimatedDuration?: number;
  actualDuration?: number;
  priority: JobPriority;
  retryCount: number;
  maxRetries: number;
}

export enum JobStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused'
}

export enum JobPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface ConversionConfiguration {
  outputFormat: string;
  videoCodec: string;
  audioCodec: string;
  resolution?: {
    width: number;
    height: number;
  };
  frameRate?: number;
  videoBitRate?: number;
  audioBitRate?: number;
  quality?: QualityPreset;
  customSettings?: Record<string, any>;
  filters?: VideoFilter[];
  trimming?: {
    startTime: number;
    endTime: number;
  };
  watermark?: WatermarkSettings;
  subtitleOptions?: SubtitleOptions;
  audioOptions?: AudioOptions;
  videoOptions?: VideoOptions;
}

export enum QualityPreset {
  ULTRA_LOW = 'ultra_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA_HIGH = 'ultra_high',
  LOSSLESS = 'lossless'
}

export interface VideoFilter {
  name: string;
  parameters: Record<string, any>;
  enabled: boolean;
  order: number;
}

export interface WatermarkSettings {
  enabled: boolean;
  type: 'text' | 'image';
  content: string;
  position: WatermarkPosition;
  opacity: number;
  scale: number;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  padding?: number;
}

export enum WatermarkPosition {
  TOP_LEFT = 'top_left',
  TOP_CENTER = 'top_center',
  TOP_RIGHT = 'top_right',
  CENTER_LEFT = 'center_left',
  CENTER = 'center',
  CENTER_RIGHT = 'center_right',
  BOTTOM_LEFT = 'bottom_left',
  BOTTOM_CENTER = 'bottom_center',
  BOTTOM_RIGHT = 'bottom_right'
}

export interface SubtitleOptions {
  includeSubtitles: boolean;
  subtitleTracks: string[];
  burnIn: boolean;
  defaultLanguage?: string;
  styling?: SubtitleStyling;
}

export interface SubtitleStyling {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  outlineColor: string;
  outlineWidth: number;
  position: 'top' | 'center' | 'bottom';
  alignment: 'left' | 'center' | 'right';
}

export interface AudioOptions {
  includeAudio: boolean;
  audioTracks: string[];
  normalize: boolean;
  noiseReduction: boolean;
  volumeAdjustment: number;
  fadeIn?: number;
  fadeOut?: number;
}

export interface VideoOptions {
  deinterlace: boolean;
  stabilization: boolean;
  colorCorrection: boolean;
  noiseReduction: boolean;
  sharpening: boolean;
  cropSettings?: CropSettings;
  rotationAngle?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
}

export interface CropSettings {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ConversionPreset {
  id: string;
  name: string;
  description: string;
  category: PresetCategory;
  configuration: ConversionConfiguration;
  isCustom: boolean;
  isPublic: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  tags: string[];
}

export enum PresetCategory {
  SOCIAL_MEDIA = 'social_media',
  PROFESSIONAL = 'professional',
  DEVICE_SPECIFIC = 'device_specific',
  STREAMING = 'streaming',
  ARCHIVAL = 'archival',
  CUSTOM = 'custom'
}

export interface BatchConversionJob {
  id: string;
  name: string;
  files: VideoFile[];
  configuration: ConversionConfiguration;
  status: BatchJobStatus;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedTotalDuration?: number;
  actualTotalDuration?: number;
  individualJobs: ConversionJob[];
}

export enum BatchJobStatus {
  CREATED = 'created',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  PARTIALLY_FAILED = 'partially_failed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface QueueManagement {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
  estimatedWaitTime: number;
  serverLoad: number;
  availableWorkers: number;
  busyWorkers: number;
}

export interface ConversionStatistics {
  totalConversions: number;
  successRate: number;
  averageFileSize: number;
  averageProcessingTime: number;
  mostUsedFormats: FormatUsage[];
  mostUsedPresets: PresetUsage[];
  dailyStats: DailyStats[];
  monthlyStats: MonthlyStats[];
}

export interface FormatUsage {
  format: string;
  count: number;
  percentage: number;
}

export interface PresetUsage {
  presetId: string;
  presetName: string;
  count: number;
  percentage: number;
}

export interface DailyStats {
  date: Date;
  conversions: number;
  dataProcessed: number;
  averageTime: number;
  successRate: number;
}

export interface MonthlyStats {
  month: Date;
  conversions: number;
  dataProcessed: number;
  averageTime: number;
  successRate: number;
  topFormats: FormatUsage[];
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  plan: SubscriptionPlan;
  usage: UsageStatistics;
  preferences: UserPreferences;
  apiKeys: ApiKey[];
  createdAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: PlanTier;
  features: PlanFeature[];
  limits: PlanLimits;
  price: number;
  billingPeriod: BillingPeriod;
  isActive: boolean;
  expiresAt?: Date;
}

export enum PlanTier {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise'
}

export interface PlanFeature {
  name: string;
  enabled: boolean;
  limit?: number;
}

export interface PlanLimits {
  maxFileSize: number;
  maxConcurrentJobs: number;
  maxMonthlyConversions: number;
  maxStorageDuration: number;
  apiCallsPerDay: number;
}

export enum BillingPeriod {
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export interface UsageStatistics {
  currentPeriod: {
    conversions: number;
    dataProcessed: number;
    storageUsed: number;
    apiCalls: number;
  };
  limits: {
    conversions: number;
    dataProcessed: number;
    storageUsed: number;
    apiCalls: number;
  };
  resetDate: Date;
}

export interface UserPreferences {
  defaultOutputFormat: string;
  defaultQuality: QualityPreset;
  autoDeleteFiles: boolean;
  emailNotifications: boolean;
  webhookNotifications: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: ApiPermission[];
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
}

export enum ApiPermission {
  READ_FILES = 'read_files',
  WRITE_FILES = 'write_files',
  CREATE_JOBS = 'create_jobs',
  READ_JOBS = 'read_jobs',
  CANCEL_JOBS = 'cancel_jobs',
  READ_PRESETS = 'read_presets',
  WRITE_PRESETS = 'write_presets',
  READ_STATISTICS = 'read_statistics'
}

export interface WebhookConfiguration {
  id: string;
  url: string;
  events: WebhookEvent[];
  isActive: boolean;
  secret?: string;
  headers?: Record<string, string>;
  retryPolicy: RetryPolicy;
  createdAt: Date;
  updatedAt: Date;
}

export enum WebhookEvent {
  JOB_STARTED = 'job.started',
  JOB_PROGRESS = 'job.progress',
  JOB_COMPLETED = 'job.completed',
  JOB_FAILED = 'job.failed',
  BATCH_STARTED = 'batch.started',
  BATCH_COMPLETED = 'batch.completed',
  FILE_UPLOADED = 'file.uploaded',
  FILE_DELETED = 'file.deleted'
}

export interface RetryPolicy {
  maxRetries: number;
  initialDelay: number;
  backoffMultiplier: number;
  maxDelay: number;
}

export interface CloudStorageIntegration {
  id: string;
  provider: CloudProvider;
  name: string;
  credentials: CloudCredentials;
  isActive: boolean;
  defaultBucket?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum CloudProvider {
  AWS_S3 = 'aws_s3',
  GOOGLE_CLOUD = 'google_cloud',
  AZURE_BLOB = 'azure_blob',
  DROPBOX = 'dropbox',
  GOOGLE_DRIVE = 'google_drive',
  ONEDRIVE = 'onedrive'
}

export interface CloudCredentials {
  accessKey?: string;
  secretKey?: string;
  region?: string;
  bucket?: string;
  projectId?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  [key: string]: any;
}

export interface VideoAnalysisResult {
  file: VideoFile;
  technicalAnalysis: TechnicalAnalysis;
  contentAnalysis: ContentAnalysis;
  qualityMetrics: QualityMetrics;
  recommendations: ConversionRecommendation[];
  analyzedAt: Date;
}

export interface TechnicalAnalysis {
  isCorrupted: boolean;
  hasErrors: boolean;
  errors: string[];
  warnings: string[];
  containerFormat: string;
  videoCodecs: string[];
  audioCodecs: string[];
  streamCount: number;
  hasVideo: boolean;
  hasAudio: boolean;
  hasSubtitles: boolean;
}

export interface ContentAnalysis {
  sceneCount: number;
  motionLevel: 'low' | 'medium' | 'high';
  complexityScore: number;
  colorProfile: string;
  dynamicRange: 'sdr' | 'hdr10' | 'dolby_vision';
  audioProfile: string;
  hasTransparency: boolean;
  isAnimated: boolean;
}

export interface QualityMetrics {
  psnr?: number;
  ssim?: number;
  vmaf?: number;
  msssim?: number;
  overall_score: number;
  artifacts: ArtifactDetection;
}

export interface ArtifactDetection {
  blockiness: number;
  blur: number;
  noise: number;
  ringing: number;
  mosquito: number;
}

export interface ConversionRecommendation {
  type: RecommendationType;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  category: 'quality' | 'size' | 'compatibility' | 'performance';
  suggestedSettings?: Partial<ConversionConfiguration>;
}

export enum RecommendationType {
  CODEC_UPGRADE = 'codec_upgrade',
  RESOLUTION_OPTIMIZATION = 'resolution_optimization',
  BITRATE_ADJUSTMENT = 'bitrate_adjustment',
  FORMAT_CHANGE = 'format_change',
  FILTER_APPLICATION = 'filter_application',
  QUALITY_ENHANCEMENT = 'quality_enhancement'
}

export interface ProcessingCapabilities {
  supportedInputFormats: string[];
  supportedOutputFormats: string[];
  supportedVideoCodecs: string[];
  supportedAudioCodecs: string[];
  maxResolution: {
    width: number;
    height: number;
  };
  maxFileSize: number;
  maxDuration: number;
  hardwareAcceleration: HardwareAcceleration[];
  availableFilters: FilterDefinition[];
}

export interface HardwareAcceleration {
  type: 'cpu' | 'gpu' | 'fpga';
  vendor: string;
  model: string;
  isAvailable: boolean;
  supportedCodecs: string[];
}

export interface FilterDefinition {
  name: string;
  description: string;
  category: string;
  parameters: FilterParameter[];
  presets: FilterPreset[];
}

export interface FilterParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'enum';
  required: boolean;
  defaultValue: any;
  minValue?: number;
  maxValue?: number;
  enumValues?: string[];
  description: string;
}

export interface FilterPreset {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export class VideoConverter {
  private apiBaseUrl: string;
  private apiKey: string;
  private defaultOptions: Partial<ConversionConfiguration>;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.apiBaseUrl = baseUrl || 'https://api.videoconverter.com/v1';
    this.defaultOptions = {};
  }

  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<VideoFile> {
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
        } else {
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

  async createConversionJob(
    sourceFileId: string, 
    configuration: ConversionConfiguration
  ): Promise<ConversionJob> {
    const response = await this.makeRequest('POST', '/jobs', {
      sourceFileId,
      configuration: { ...this.defaultOptions, ...configuration }
    });
    
    return response.data;
  }

  async createBatchJob(
    fileIds: string[],
    configuration: ConversionConfiguration,
    name?: string
  ): Promise<BatchConversionJob> {
    const response = await this.makeRequest('POST', '/jobs/batch', {
      fileIds,
      configuration: { ...this.defaultOptions, ...configuration },
      name
    });
    
    return response.data;
  }

  async getJob(jobId: string): Promise<ConversionJob> {
    const response = await this.makeRequest('GET', `/jobs/${jobId}`);
    return response.data;
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const response = await this.makeRequest('DELETE', `/jobs/${jobId}`);
    return response.success;
  }

  async getJobs(
    status?: JobStatus,
    limit?: number,
    offset?: number
  ): Promise<{ jobs: ConversionJob[]; total: number }> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const response = await this.makeRequest('GET', `/jobs?${params.toString()}`);
    return response.data;
  }

  async getPresets(category?: PresetCategory): Promise<ConversionPreset[]> {
    const params = category ? `?category=${category}` : '';
    const response = await this.makeRequest('GET', `/presets${params}`);
    return response.data;
  }

  async createPreset(preset: Omit<ConversionPreset, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConversionPreset> {
    const response = await this.makeRequest('POST', '/presets', preset);
    return response.data;
  }

  async analyzeVideo(fileId: string): Promise<VideoAnalysisResult> {
    const response = await this.makeRequest('POST', `/files/${fileId}/analyze`);
    return response.data;
  }

  async getCapabilities(): Promise<ProcessingCapabilities> {
    const response = await this.makeRequest('GET', '/capabilities');
    return response.data;
  }

  async getStatistics(): Promise<ConversionStatistics> {
    const response = await this.makeRequest('GET', '/statistics');
    return response.data;
  }

  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    const url = `${this.apiBaseUrl}${endpoint}`;
    const options: RequestInit = {
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

  setDefaultOptions(options: Partial<ConversionConfiguration>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  getDefaultOptions(): Partial<ConversionConfiguration> {
    return { ...this.defaultOptions };
  }
}

// Utility functions for common conversions
export class ConversionUtils {
  static createMP4Config(quality: QualityPreset = QualityPreset.HIGH): ConversionConfiguration {
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

  static createWebMConfig(quality: QualityPreset = QualityPreset.HIGH): ConversionConfiguration {
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

  static createSocialMediaConfig(platform: 'instagram' | 'youtube' | 'tiktok' | 'facebook'): ConversionConfiguration {
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

  static calculateOptimalBitrate(
    width: number,
    height: number,
    frameRate: number,
    quality: QualityPreset
  ): number {
    const pixels = width * height;
    const pixelsPerSecond = pixels * frameRate;
    
    let bitsPerPixel: number;
    
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

  static estimateFileSize(
    duration: number,
    videoBitrate: number,
    audioBitrate: number = 128000
  ): number {
    const totalBitrate = videoBitrate + audioBitrate;
    return Math.round((totalBitrate * duration) / 8); // Convert bits to bytes
  }

  static estimateProcessingTime(
    fileSize: number,
    outputFormat: string,
    hardwareAcceleration: boolean = false
  ): number {
    // Base processing speed in MB/second
    let baseSpeed = hardwareAcceleration ? 5 : 2;
    
    // Adjust speed based on format complexity
    const formatMultipliers: Record<string, number> = {
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