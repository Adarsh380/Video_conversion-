/**
 * Stage D: Asset Fetching
 * 
 * Fetches video assets from stock video APIs (Pexels, Pixabay) with intelligent
 * caching and reuse from local asset library.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as https from 'https';
import { createWriteStream } from 'fs';

// Types for asset management
interface Scene {
  id: number;
  title: string;
  summary: string;
  narration: string;
  on_screen_text: string;
  visual_keywords: string;
  mood: string;
  duration_seconds: number;
}

interface VisualKeywordData {
  refined_visual_keywords: string[];
  pexels_query: string;
  pixabay_query: string;
  backup_queries: string[];
  matched_patterns: string[];
}

interface AssetLibraryEntry {
  id: string;
  url: string;
  local_path: string;
  query: string;
  source: 'pexels' | 'pixabay';
  duration: number;
  width: number;
  height: number;
  aspect_ratio: string;
  keywords: string[];
  embedding: number[];
  usage_count: number;
  created_at: string;
  metadata: any;
}

interface FetchedAsset {
  success: boolean;
  asset_path?: string;
  asset_url?: string;
  source: 'library' | 'pexels' | 'pixabay' | 'fallback';
  duration?: number;
  dimensions?: { width: number; height: number };
  metadata?: any;
  error?: string;
}

interface PexelsVideoResponse {
  videos: Array<{
    id: number;
    url: string;
    duration: number;
    width: number;
    height: number;
    video_files: Array<{
      id: number;
      quality: string;
      file_type: string;
      width: number;
      height: number;
      link: string;
    }>;
  }>;
}

interface PixabayVideoResponse {
  hits: Array<{
    id: number;
    pageURL: string;
    duration: number;
    videos: {
      large: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      small: { url: string; width: number; height: number };
    };
  }>;
}

/**
 * Asset Fetching Service
 * Handles video asset discovery, caching, and download management
 */
export class AssetFetchingService {
  private assetLibrary: AssetLibraryEntry[] = [];
  private dataPath: string;
  private tmpPath: string;
  private pexelsApiKey: string | null = null;
  private pixabayApiKey: string | null = null;

  constructor(dataPath: string = './data', tmpPath: string = './tmp') {
    this.dataPath = dataPath;
    this.tmpPath = tmpPath;
    
    // TODO: Add your API keys here
    this.pexelsApiKey = process.env.PEXELS_API_KEY || null;
    this.pixabayApiKey = process.env.PIXABAY_API_KEY || null;
  }

  /**
   * Initialize service by loading asset library and creating directories
   */
  async initialize(): Promise<void> {
    try {
      // Create tmp directory if it doesn't exist
      await this.ensureDirectoryExists(this.tmpPath);
      
      // Load existing asset library
      const libraryPath = path.join(this.dataPath, 'asset_library.json');
      try {
        const libraryData = await fs.readFile(libraryPath, 'utf-8');
        this.assetLibrary = JSON.parse(libraryData);
        console.log(`Loaded ${this.assetLibrary.length} assets from library`);
      } catch (error) {
        console.log('Asset library not found, starting with empty library');
        this.assetLibrary = [];
      }
      
      console.log('Asset fetching service initialized');
    } catch (error) {
      console.error('Failed to initialize asset fetching service:', error);
      throw error;
    }
  }

  /**
   * Main function: Fetch asset for a scene
   */
  async fetchAssetForScene(scene: Scene, queryData: VisualKeywordData): Promise<FetchedAsset> {
    try {
      console.log(`Fetching asset for scene ${scene.id}: ${scene.title}`);

      // Step 1: Try to reuse existing asset from library
      const reusedAsset = await this.tryReuseAssetFromLibrary(scene, queryData);
      if (reusedAsset.success) {
        console.log(`Reusing asset from library: ${reusedAsset.asset_path}`);
        return reusedAsset;
      }

      // Step 2: Search Pexels VIDEO API
      if (this.pexelsApiKey) {
        const pexelsAsset = await this.searchPexelsVideo(queryData.pexels_query, scene);
        if (pexelsAsset.success) {
          console.log(`Found asset from Pexels: ${pexelsAsset.asset_path}`);
          return pexelsAsset;
        }
      }

      // Step 3: Search Pixabay VIDEO API
      if (this.pixabayApiKey) {
        const pixabayAsset = await this.searchPixabayVideo(queryData.pixabay_query, scene);
        if (pixabayAsset.success) {
          console.log(`Found asset from Pixabay: ${pixabayAsset.asset_path}`);
          return pixabayAsset;
        }
      }

      // Step 4: Try backup queries
      for (const backupQuery of queryData.backup_queries) {
        if (this.pexelsApiKey) {
          const pexelsBackup = await this.searchPexelsVideo(backupQuery, scene);
          if (pexelsBackup.success) {
            console.log(`Found backup asset from Pexels: ${pexelsBackup.asset_path}`);
            return pexelsBackup;
          }
        }
      }

      // Step 5: Return fallback asset info
      console.log(`No suitable video asset found for scene ${scene.id}, using fallback`);
      return this.getFallbackAsset(scene);

    } catch (error) {
      console.error(`Failed to fetch asset for scene ${scene.id}:`, error);
      return {
        success: false,
        source: 'fallback',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Try to reuse an existing asset from the library using embedding similarity
   */
  private async tryReuseAssetFromLibrary(scene: Scene, queryData: VisualKeywordData): Promise<FetchedAsset> {
    if (this.assetLibrary.length === 0) {
      return { success: false, source: 'library' };
    }

    // Generate embedding for current scene
    const sceneEmbedding = this.generateSceneEmbedding(scene, queryData);

    // Find assets with similarity >= 0.8
    let bestMatch: AssetLibraryEntry | null = null;
    let bestSimilarity = 0;

    for (const asset of this.assetLibrary) {
      const similarity = this.calculateCosineSimilarity(sceneEmbedding, asset.embedding);
      if (similarity >= 0.8 && similarity > bestSimilarity) {
        // Check if asset file still exists
        try {
          await fs.access(asset.local_path);
          bestMatch = asset;
          bestSimilarity = similarity;
        } catch {
          console.log(`Asset file not found: ${asset.local_path}`);
        }
      }
    }

    if (bestMatch) {
      // Update usage count
      bestMatch.usage_count += 1;
      await this.saveAssetLibrary();

      return {
        success: true,
        asset_path: bestMatch.local_path,
        asset_url: bestMatch.url,
        source: 'library',
        duration: bestMatch.duration,
        dimensions: { width: bestMatch.width, height: bestMatch.height },
        metadata: { similarity: bestSimilarity, reused: true }
      };
    }

    return { success: false, source: 'library' };
  }

  /**
   * Search Pexels VIDEO API for assets
   */
  private async searchPexelsVideo(query: string, scene: Scene): Promise<FetchedAsset> {
    if (!this.pexelsApiKey) {
      return { success: false, source: 'pexels', error: 'Pexels API key not configured' };
    }

    try {
      console.log(`Searching Pexels for: "${query}"`);
      
      // TODO: Replace with actual Pexels API call
      // const response = await this.makePexelsRequest(query);
      
      // Simulate API response for development
      const mockResponse: PexelsVideoResponse = {
        videos: [
          {
            id: Math.floor(Math.random() * 10000),
            url: `https://www.pexels.com/video/${Math.floor(Math.random() * 10000)}/`,
            duration: scene.duration_seconds + (Math.random() * 4 - 2),
            width: 1920,
            height: 1080,
            video_files: [
              {
                id: 1,
                quality: 'hd',
                file_type: 'video/mp4',
                width: 1920,
                height: 1080,
                link: `https://example.com/pexels-video-${Math.floor(Math.random() * 10000)}.mp4`
              }
            ]
          }
        ]
      };

      const video = this.selectBestVideo(mockResponse.videos, scene);
      if (!video) {
        return { success: false, source: 'pexels', error: 'No suitable video found' };
      }

      // Download the video
      const assetPath = await this.downloadVideo(video.video_files[0].link, scene.id, 'pexels');
      
      // Add to asset library
      await this.addToAssetLibrary({
        query,
        source: 'pexels',
        url: video.url,
        local_path: assetPath,
        duration: video.duration,
        width: video.width,
        height: video.height,
        scene,
        videoData: video
      });

      return {
        success: true,
        asset_path: assetPath,
        asset_url: video.url,
        source: 'pexels',
        duration: video.duration,
        dimensions: { width: video.width, height: video.height },
        metadata: { query, video_id: video.id }
      };

    } catch (error) {
      console.error('Pexels search failed:', error);
      return {
        success: false,
        source: 'pexels',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search Pixabay VIDEO API for assets
   */
  private async searchPixabayVideo(query: string, scene: Scene): Promise<FetchedAsset> {
    if (!this.pixabayApiKey) {
      return { success: false, source: 'pixabay', error: 'Pixabay API key not configured' };
    }

    try {
      console.log(`Searching Pixabay for: "${query}"`);
      
      // TODO: Replace with actual Pixabay API call
      // const response = await this.makePixabayRequest(query);
      
      // Simulate API response for development
      const mockResponse: PixabayVideoResponse = {
        hits: [
          {
            id: Math.floor(Math.random() * 10000),
            pageURL: `https://pixabay.com/videos/${Math.floor(Math.random() * 10000)}/`,
            duration: scene.duration_seconds + (Math.random() * 4 - 2),
            videos: {
              large: {
                url: `https://example.com/pixabay-video-large-${Math.floor(Math.random() * 10000)}.mp4`,
                width: 1920,
                height: 1080
              },
              medium: {
                url: `https://example.com/pixabay-video-medium-${Math.floor(Math.random() * 10000)}.mp4`,
                width: 1280,
                height: 720
              },
              small: {
                url: `https://example.com/pixabay-video-small-${Math.floor(Math.random() * 10000)}.mp4`,
                width: 640,
                height: 360
              }
            }
          }
        ]
      };

      const video = this.selectBestPixabayVideo(mockResponse.hits, scene);
      if (!video) {
        return { success: false, source: 'pixabay', error: 'No suitable video found' };
      }

      // Select best quality
      const videoUrl = video.videos.large.url;
      const { width, height } = video.videos.large;

      // Download the video
      const assetPath = await this.downloadVideo(videoUrl, scene.id, 'pixabay');
      
      // Add to asset library
      await this.addToAssetLibrary({
        query,
        source: 'pixabay',
        url: video.pageURL,
        local_path: assetPath,
        duration: video.duration,
        width,
        height,
        scene,
        videoData: video
      });

      return {
        success: true,
        asset_path: assetPath,
        asset_url: video.pageURL,
        source: 'pixabay',
        duration: video.duration,
        dimensions: { width, height },
        metadata: { query, video_id: video.id }
      };

    } catch (error) {
      console.error('Pixabay search failed:', error);
      return {
        success: false,
        source: 'pixabay',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Select the best video from Pexels results based on scene requirements
   */
  private selectBestVideo(videos: any[], scene: Scene): any | null {
    if (videos.length === 0) return null;

    // Filter by duration (prefer videos close to scene duration)
    const targetDuration = scene.duration_seconds;
    
    const scoredVideos = videos.map(video => {
      const durationScore = 1 - Math.abs(video.duration - targetDuration) / Math.max(video.duration, targetDuration);
      const aspectRatioScore = this.calculateAspectRatioScore(video.width, video.height);
      
      return {
        video,
        score: durationScore * 0.7 + aspectRatioScore * 0.3
      };
    });

    scoredVideos.sort((a, b) => b.score - a.score);
    return scoredVideos[0].video;
  }

  /**
   * Select the best video from Pixabay results
   */
  private selectBestPixabayVideo(videos: any[], scene: Scene): any | null {
    if (videos.length === 0) return null;

    // Similar scoring logic as Pexels
    const targetDuration = scene.duration_seconds;
    
    const scoredVideos = videos.map(video => {
      const durationScore = 1 - Math.abs(video.duration - targetDuration) / Math.max(video.duration, targetDuration);
      const aspectRatioScore = this.calculateAspectRatioScore(video.videos.large.width, video.videos.large.height);
      
      return {
        video,
        score: durationScore * 0.7 + aspectRatioScore * 0.3
      };
    });

    scoredVideos.sort((a, b) => b.score - a.score);
    return scoredVideos[0].video;
  }

  /**
   * Calculate aspect ratio score (prefer 16:9)
   */
  private calculateAspectRatioScore(width: number, height: number): number {
    const aspectRatio = width / height;
    const targetRatio = 16 / 9; // Prefer 16:9 for video content
    
    return 1 - Math.abs(aspectRatio - targetRatio) / targetRatio;
  }

  /**
   * Download video from URL to local storage
   */
  private async downloadVideo(videoUrl: string, sceneId: number, source: string): Promise<string> {
    const filename = `scene_${sceneId}_${source}_${Date.now()}.mp4`;
    const assetPath = path.join(this.tmpPath, filename);

    // TODO: Implement actual video download
    // For development, create a placeholder file
    console.log(`[MOCK] Downloading video from ${videoUrl} to ${assetPath}`);
    
    // Create a mock video file
    await fs.writeFile(assetPath, `Mock video content for scene ${sceneId} from ${source}`);
    
    console.log(`Video downloaded successfully: ${assetPath}`);
    return assetPath;

    /* Actual implementation would be:
    return new Promise((resolve, reject) => {
      const file = createWriteStream(assetPath);
      https.get(videoUrl, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(assetPath);
        });
        file.on('error', (error) => {
          fs.unlink(assetPath);
          reject(error);
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
    */
  }

  /**
   * Add downloaded asset to the library for future reuse
   */
  private async addToAssetLibrary(assetData: any): Promise<void> {
    const { query, source, url, local_path, duration, width, height, scene, videoData } = assetData;

    // Generate embedding for the asset
    const embedding = this.generateAssetEmbedding(scene, query, videoData);

    const libraryEntry: AssetLibraryEntry = {
      id: `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      local_path,
      query,
      source,
      duration,
      width,
      height,
      aspect_ratio: `${width}:${height}`,
      keywords: query.split(/\\s+/),
      embedding,
      usage_count: 1,
      created_at: new Date().toISOString(),
      metadata: {
        scene_id: scene.id,
        scene_title: scene.title,
        mood: scene.mood,
        video_data: videoData
      }
    };

    this.assetLibrary.push(libraryEntry);
    await this.saveAssetLibrary();

    console.log(`Added asset to library: ${libraryEntry.id}`);
  }

  /**
   * Save asset library to disk
   */
  private async saveAssetLibrary(): Promise<void> {
    const libraryPath = path.join(this.dataPath, 'asset_library.json');
    await fs.writeFile(libraryPath, JSON.stringify(this.assetLibrary, null, 2));
  }

  /**
   * Generate embedding for scene content
   */
  private generateSceneEmbedding(scene: Scene, queryData: VisualKeywordData): number[] {
    // TODO: Replace with actual embedding service
    const content = `${scene.title} ${scene.summary} ${queryData.pexels_query} ${queryData.pixabay_query}`.toLowerCase();
    return this.generateSimpleEmbedding(content);
  }

  /**
   * Generate embedding for asset
   */
  private generateAssetEmbedding(scene: Scene, query: string, videoData: any): number[] {
    // TODO: Replace with actual embedding service
    const content = `${scene.title} ${query} ${scene.mood} ${scene.visual_keywords}`.toLowerCase();
    return this.generateSimpleEmbedding(content);
  }

  /**
   * Simple embedding generation (replace with actual service)
   */
  private generateSimpleEmbedding(content: string): number[] {
    const words = content.split(/\\s+/);
    const embedding = [0, 0, 0, 0, 0];
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      embedding[index % 5] += (hash % 100) / 100.0;
    });
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / (magnitude || 1));
  }

  /**
   * Calculate cosine similarity between embeddings
   */
  private calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
    const magnitude1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (magnitude1 * magnitude2) || 0;
  }

  /**
   * Get fallback asset when no suitable video is found
   */
  private getFallbackAsset(scene: Scene): FetchedAsset {
    return {
      success: false,
      source: 'fallback',
      metadata: {
        message: 'No suitable video asset found',
        scene_id: scene.id,
        suggested_action: 'Use text-based slide or placeholder video'
      }
    };
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

/**
 * Main export function for Stage D
 */
export async function fetchAssetForScene(scene: Scene, queryData: VisualKeywordData, dataPath?: string, tmpPath?: string): Promise<FetchedAsset> {
  const service = new AssetFetchingService(dataPath, tmpPath);
  await service.initialize();
  return service.fetchAssetForScene(scene, queryData);
}

/**
 * Batch processing for multiple scenes
 */
export async function fetchAssetsForScenes(scenes: Scene[], queryDataList: VisualKeywordData[], dataPath?: string, tmpPath?: string): Promise<FetchedAsset[]> {
  const service = new AssetFetchingService(dataPath, tmpPath);
  await service.initialize();
  
  const results = [];
  for (let i = 0; i < scenes.length; i++) {
    const result = await service.fetchAssetForScene(scenes[i], queryDataList[i]);
    results.push(result);
  }
  
  return results;
}