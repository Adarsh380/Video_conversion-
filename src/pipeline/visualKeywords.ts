/**
 * Stage C: Visual Keywords Refinement
 * 
 * Refines scene visual keywords and generates optimized video search queries
 * using pattern matching and LLM enhancement.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// Types for visual patterns and scene data
interface VisualPattern {
  id: string;
  keywords: string[];
  mood: string;
  embedding: number[];
  video_queries: string[];
}

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

/**
 * Visual Keywords Service
 * Handles pattern matching and query generation for video asset discovery
 */
export class VisualKeywordsService {
  private visualPatterns: VisualPattern[] = [];
  private dataPath: string;

  constructor(dataPath: string = './data') {
    this.dataPath = dataPath;
  }

  /**
   * Initialize service by loading visual patterns
   */
  async initialize(): Promise<void> {
    try {
      const patternsPath = path.join(this.dataPath, 'visual_patterns.json');
      const patternsData = await fs.readFile(patternsPath, 'utf-8');
      this.visualPatterns = JSON.parse(patternsData);
      console.log(`Loaded ${this.visualPatterns.length} visual patterns`);
    } catch (error) {
      console.error('Failed to load visual patterns:', error);
      // Use fallback patterns if file not found
      this.visualPatterns = this.getFallbackPatterns();
    }
  }

  /**
   * Main function: Refine visual data for a scene
   */
  async refineVisualDataForScene(scene: Scene): Promise<VisualKeywordData> {
    try {
      console.log(`Refining visual data for scene ${scene.id}: ${scene.title}`);

      // Step 1: Find best matching patterns using embeddings
      const matchedPatterns = this.findBestMatchingPatterns(scene, 3);
      
      // Step 2: Generate embeddings for scene content
      const sceneEmbedding = this.generateSceneEmbedding(scene);
      
      // Step 3: Use LLM to refine keywords and generate queries
      const refinedData = await this.generateRefinedKeywords(scene, matchedPatterns);
      
      // Step 4: Validate and optimize queries for video search
      const optimizedQueries = this.optimizeVideoQueries(refinedData, scene);

      const result: VisualKeywordData = {
        refined_visual_keywords: optimizedQueries.refined_keywords,
        pexels_query: optimizedQueries.pexels_query,
        pixabay_query: optimizedQueries.pixabay_query,
        backup_queries: optimizedQueries.backup_queries,
        matched_patterns: matchedPatterns.map(p => p.id)
      };

      console.log(`Generated refined visual data:`, result);
      return result;

    } catch (error) {
      console.error(`Failed to refine visual data for scene ${scene.id}:`, error);
      
      // Return fallback data
      return this.getFallbackVisualData(scene);
    }
  }

  /**
   * Find the best matching visual patterns using RAG-based retrieval
   */
  private findBestMatchingPatterns(scene: Scene, topK: number = 3): VisualPattern[] {
    // Step 1: Generate query embedding for RAG retrieval
    const queryEmbedding = this.generateSceneEmbedding(scene);
    
    // Step 2: RAG Document Retrieval - Calculate similarity scores
    const retrievedDocuments = this.ragRetrievePatterns(queryEmbedding, topK * 2);
    
    // Step 3: RAG Re-ranking based on scene context
    const rerankedPatterns = this.ragRerankPatterns(retrievedDocuments, scene, topK);
    
    console.log(`RAG retrieved ${topK} patterns:`, rerankedPatterns.map(p => `${p.id} (${p.mood}, score: ${p.ragScore?.toFixed(3)})`));
    
    return rerankedPatterns;
  }

  /**
   * RAG Retrieval: Get candidate patterns using vector similarity
   */
  private ragRetrievePatterns(queryEmbedding: number[], candidateCount: number): (VisualPattern & { similarity: number })[] {
    // Calculate similarity scores for each pattern in knowledge base
    const similarities = this.visualPatterns.map(pattern => ({
      ...pattern,
      similarity: this.calculateCosineSimilarity(queryEmbedding, pattern.embedding)
    }));

    // Sort by similarity and return top candidates
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    const candidates = similarities.slice(0, candidateCount);
    console.log(`RAG retrieval found ${candidates.length} candidate patterns`);
    
    return candidates;
  }

  /**
   * RAG Re-ranking: Context-aware ranking using scene semantics
   */
  private ragRerankPatterns(candidates: (VisualPattern & { similarity: number })[], scene: Scene, topK: number): (VisualPattern & { ragScore?: number })[] {
    const reranked = candidates.map(candidate => {
      // Context-aware scoring combining multiple factors
      const semanticScore = this.calculateSemanticRelevance(candidate, scene);
      const moodAlignment = this.calculateMoodAlignment(candidate, scene);
      const keywordOverlap = this.calculateKeywordOverlap(candidate, scene);
      
      // RAG composite score: weighted combination
      const ragScore = (
        candidate.similarity * 0.4 +        // Vector similarity (40%)
        semanticScore * 0.3 +               // Semantic relevance (30%)
        moodAlignment * 0.2 +               // Mood alignment (20%)
        keywordOverlap * 0.1                // Keyword overlap (10%)
      );
      
      return {
        ...candidate,
        ragScore: ragScore
      };
    });

    // Sort by RAG score and return top K
    reranked.sort((a, b) => (b.ragScore || 0) - (a.ragScore || 0));
    
    return reranked.slice(0, topK);
  }

  /**
   * Calculate semantic relevance between pattern and scene context
   */
  private calculateSemanticRelevance(pattern: VisualPattern, scene: Scene): number {
    const sceneText = `${scene.title} ${scene.summary}`.toLowerCase();
    const patternContext = pattern.keywords.join(' ').toLowerCase();
    
    // Semantic overlap using simple word matching (TODO: Replace with actual semantic model)
    const sceneWords = sceneText.split(/\s+/);
    const patternWords = patternContext.split(/\s+/);
    
    // Calculate intersection manually for compatibility
    const intersection = sceneWords.filter(word => patternWords.includes(word));
    const uniqueSceneWords = Array.from(new Set(sceneWords));
    const uniquePatternWords = Array.from(new Set(patternWords));
    const unionSize = new Set([...uniqueSceneWords, ...uniquePatternWords]).size;
    
    return intersection.length / unionSize; // Jaccard similarity
  }

  /**
   * Calculate mood alignment score
   */
  private calculateMoodAlignment(pattern: VisualPattern, scene: Scene): number {
    const moodCompatibility: { [key: string]: string[] } = {
      'corporate': ['corporate', 'informative', 'professional'],
      'informative': ['informative', 'corporate', 'educational'],
      'inspirational': ['inspirational', 'warm', 'creative'],
      'warm': ['warm', 'inspirational', 'friendly'],
      'energetic': ['energetic', 'dynamic', 'inspirational']
    };
    
    const compatibleMoods = moodCompatibility[scene.mood] || [scene.mood];
    return compatibleMoods.includes(pattern.mood) ? 1.0 : 0.3;
  }

  /**
   * Calculate keyword overlap score
   */
  private calculateKeywordOverlap(pattern: VisualPattern, scene: Scene): number {
    const sceneKeywords = scene.visual_keywords.toLowerCase().split(/[,;\s]+/).filter(k => k.length > 2);
    const patternKeywords = pattern.keywords.map(k => k.toLowerCase());
    
    const overlapping = sceneKeywords.filter(sk => 
      patternKeywords.some(pk => pk.includes(sk) || sk.includes(pk))
    );
    
    return sceneKeywords.length > 0 ? overlapping.length / sceneKeywords.length : 0;
  }

  /**
   * Generate scene embedding from content
   */
  private generateSceneEmbedding(scene: Scene): number[] {
    // TODO: Replace with actual embedding service (OpenAI, Cohere, etc.)
    // For now, generate simple hash-based embedding
    
    const content = `${scene.title} ${scene.summary} ${scene.visual_keywords} ${scene.mood}`.toLowerCase();
    const words = content.split(/\\s+/);
    
    // Simple word-frequency based embedding (5 dimensions)
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
   * Calculate cosine similarity between two embeddings
   */
  private calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
    const magnitude1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (magnitude1 * magnitude2) || 0;
  }

  /**
   * Use LLM to generate refined keywords and queries
   */
  private async generateRefinedKeywords(scene: Scene, patterns: VisualPattern[]): Promise<any> {
    // TODO: Replace with actual LLM API call (OpenAI GPT-4, Claude, etc.)
    
    const patternKeywords = patterns.flatMap(p => p.keywords);
    const patternQueries = patterns.flatMap(p => p.video_queries);
    
    // Simulate LLM processing with intelligent keyword refinement
    const sceneKeywords = scene.visual_keywords.split(/[,;\\s]+/).filter(k => k.length > 2);
    
    // Combine and deduplicate keywords
    const allKeywords = sceneKeywords.concat(patternKeywords);
    const combinedKeywords = Array.from(new Set(allKeywords));
    
    // Generate video-optimized queries
    const videoQueries = this.generateVideoQueries(scene, patternQueries);
    
    return {
      refined_keywords: combinedKeywords.slice(0, 8), // Top 8 keywords
      video_queries: videoQueries
    };
  }

  /**
   * Generate optimized video search queries
   */
  private generateVideoQueries(scene: Scene, patternQueries: string[]): string[] {
    const queries = [];
    
    // Primary query based on scene title and mood
    const titleWords = scene.title.toLowerCase().split(/\\s+/);
    const moodAdjective = this.getMoodAdjective(scene.mood);
    
    if (titleWords.length >= 2) {
      queries.push(`${moodAdjective} ${titleWords.slice(0, 2).join(' ')}`);
    }
    
    // Secondary query from visual keywords
    const keywords = scene.visual_keywords.split(/[,;\\s]+/).filter(k => k.length > 2);
    if (keywords.length >= 2) {
      queries.push(`${keywords.slice(0, 2).join(' ')}`);
    }
    
    // Add relevant pattern queries
    queries.push(...patternQueries.slice(0, 2));
    
    // Generate backup queries
    const backupQueries = [
      `${scene.mood} business`,
      `professional work`,
      `office meeting`,
      `corporate presentation`
    ];
    
    queries.push(...backupQueries);
    
    // Clean and deduplicate
    const uniqueQueries = Array.from(new Set(queries));
    return uniqueQueries.filter(q => q.length >= 3 && q.length <= 25);
  }

  /**
   * Optimize queries specifically for video search APIs
   */
  private optimizeVideoQueries(refinedData: any, scene: Scene): any {
    const queries = refinedData.video_queries || [];
    
    // Select best queries for each platform
    const pexelsQuery = this.selectBestQuery(queries, 'pexels', scene);
    const pixabayQuery = this.selectBestQuery(queries, 'pixabay', scene);
    const backupQueries = queries.slice(2, 6); // Additional backup options
    
    return {
      refined_keywords: refinedData.refined_keywords,
      pexels_query: pexelsQuery,
      pixabay_query: pixabayQuery,
      backup_queries: backupQueries
    };
  }

  /**
   * Select best query for specific video platform
   */
  private selectBestQuery(queries: string[], platform: 'pexels' | 'pixabay', scene: Scene): string {
    // Platform-specific optimization
    const platformPreferences = {
      pexels: ['business', 'professional', 'office', 'meeting'],
      pixabay: ['work', 'team', 'corporate', 'people']
    };
    
    const preferences = platformPreferences[platform];
    
    // Find query that matches platform preferences
    for (const query of queries) {
      if (preferences.some(pref => query.toLowerCase().includes(pref))) {
        return query;
      }
    }
    
    // Return first available query
    return queries[0] || `${scene.mood} business`;
  }

  /**
   * Get mood-specific adjective for video queries
   */
  private getMoodAdjective(mood: string): string {
    const moodAdjectives: { [key: string]: string } = {
      'corporate': 'professional',
      'informative': 'educational',
      'inspirational': 'motivating',
      'warm': 'friendly',
      'energetic': 'dynamic'
    };
    
    return moodAdjectives[mood] || 'professional';
  }

  /**
   * Get fallback visual data when processing fails
   */
  private getFallbackVisualData(scene: Scene): VisualKeywordData {
    const keywords = scene.visual_keywords.split(/[,;\\s]+/).filter(k => k.length > 2);
    
    return {
      refined_visual_keywords: keywords.slice(0, 5),
      pexels_query: `${scene.mood} business`,
      pixabay_query: `professional work`,
      backup_queries: ['office meeting', 'team collaboration', 'business presentation'],
      matched_patterns: ['business_professional']
    };
  }

  /**
   * Get fallback patterns when loading fails
   */
  private getFallbackPatterns(): VisualPattern[] {
    return [
      {
        id: 'business_professional',
        keywords: ['office', 'meeting', 'professional', 'business'],
        mood: 'corporate',
        embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
        video_queries: ['business meeting', 'office work']
      }
    ];
  }

  /**
   * Simple hash function for embedding generation
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

/**
 * Main export function for Stage C
 */
export async function refineVisualDataForScene(scene: Scene, dataPath?: string): Promise<VisualKeywordData> {
  const service = new VisualKeywordsService(dataPath);
  await service.initialize();
  return service.refineVisualDataForScene(scene);
}

/**
 * Batch processing for multiple scenes
 */
export async function refineVisualDataForScenes(scenes: Scene[], dataPath?: string): Promise<VisualKeywordData[]> {
  const service = new VisualKeywordsService(dataPath);
  await service.initialize();
  
  const results = [];
  for (const scene of scenes) {
    const result = await service.refineVisualDataForScene(scene);
    results.push(result);
  }
  
  return results;
}