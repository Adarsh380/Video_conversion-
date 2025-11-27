// Scene generation interfaces and types
export interface VideoScene {
  id: number;
  title: string;
  summary: string;
  narration: string;
  on_screen_text: string;
  visual_keywords: string;
  mood: 'informative' | 'inspirational' | 'warm' | 'corporate';
  duration_seconds: number;
}

export interface SceneGenerationResult {
  scenes: VideoScene[];
  totalDuration: number;
  sceneCount: number;
}

// LLM API Configuration interface
interface LLMConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export class SceneGeneratorService {
  private llmConfig: LLMConfig;
  
  constructor(config?: Partial<LLMConfig>) {
    this.llmConfig = {
      apiKey: config?.apiKey || process.env.OPENAI_API_KEY || '',
      model: config?.model || 'gpt-4',
      maxTokens: config?.maxTokens || 2000,
      temperature: config?.temperature || 0.7
    };
  }
  
  /**
   * Calculate optimal scene count based on document length
   */
  private calculateSceneCount(text: string): number {
    const wordCount = text.split(/\s+/).length;
    const charCount = text.length;
    
    // Base calculation on word count and complexity
    let sceneCount: number;
    
    if (wordCount < 200) {
      sceneCount = 5; // Short documents: minimum 5 scenes
    } else if (wordCount < 500) {
      sceneCount = Math.ceil(wordCount / 80); // ~80 words per scene
    } else if (wordCount < 1000) {
      sceneCount = Math.ceil(wordCount / 100); // ~100 words per scene
    } else if (wordCount < 2000) {
      sceneCount = Math.ceil(wordCount / 120); // ~120 words per scene
    } else {
      sceneCount = Math.ceil(wordCount / 150); // ~150 words per scene for long documents
    }
    
    // Ensure scene count is within bounds (5-20)
    sceneCount = Math.max(5, Math.min(20, sceneCount));
    
    console.log(`Document analysis: ${wordCount} words, ${charCount} characters → ${sceneCount} scenes`);
    return sceneCount;
  }
  
  /**
   * Generate video scenes from raw text using LLM
   */
  async generateScenes(rawText: string): Promise<SceneGenerationResult> {
    try {
      console.log('Starting scene generation...');
      console.log(`Input text length: ${rawText.length} characters`);
      
      // Validate input
      if (!rawText || rawText.trim().length === 0) {
        throw new Error('Input text is empty or invalid');
      }
      
      // Calculate optimal scene count based on document length
      const sceneCount = this.calculateSceneCount(rawText);
      console.log(`Target scenes: ${sceneCount}`);
      
      // Prepare the structured prompt
      const prompt = this.buildSceneGenerationPrompt(rawText, sceneCount);
      
      // Call LLM API or use fallback
      let scenes: VideoScene[];
      if (!this.llmConfig.apiKey) {
        console.log('No API key provided, using fallback scene generation');
        const fallbackResult = this.generateFallbackScenes(rawText, sceneCount);
        scenes = fallbackResult.scenes;
      } else {
        const llmResponse = await this.callLLMAPI(prompt, rawText);
        scenes = this.parseAndValidateScenes(llmResponse);
      }
      
      // Calculate total duration
      const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration_seconds, 0);
      
      console.log(`Successfully generated ${scenes.length} scenes (${totalDuration}s total)`);
      
      return {
        scenes,
        totalDuration,
        sceneCount: scenes.length
      };
      
    } catch (error) {
      console.error('Scene generation failed:', error);
      throw error;
    }
  }
  
  /**
   * Build the structured prompt for LLM
   */
  private buildSceneGenerationPrompt(rawText: string, targetScenes: number): string {
    return `Using the following text, generate exactly ${targetScenes} video-ready scenes.

TASK:
Create exactly ${targetScenes} scenes and return ONLY valid JSON (array format).

Each scene must include:
- id (integer)
- title (short phrase)
- summary (1–2 sentences)
- narration (20–30 seconds of natural spoken-style text)
- on_screen_text (<= 6 words)
- visual_keywords (3–7 concrete VIDEO search terms, comma-separated)
- mood ("informative" | "inspirational" | "warm" | "corporate")
- duration_seconds (6–15)

RULES:
- Keep narration conversational, simple, and suitable for voiceover.
- Avoid abstract visuals (e.g., "innovation") unless paired with concrete actions or environments.
- The JSON must be valid and contain no explanation, no markdown, no comments.
- If information is unclear, make conservative assumptions.
- Focus on concrete, visual elements that can be found in stock video libraries.

INPUT TEXT:
"""
${rawText}
"""

OUTPUT FORMAT EXAMPLE:
[
  {
    "id": 1,
    "title": "Introduction",
    "summary": "Opening statement about the topic.",
    "narration": "Welcome to our presentation about digital transformation. In today's rapidly evolving business landscape, companies must adapt to stay competitive and relevant in their markets.",
    "on_screen_text": "Digital Transformation",
    "visual_keywords": "business meeting, office environment, people working laptops, corporate building",
    "mood": "informative",
    "duration_seconds": 12
  }
]

RESPOND WITH ONLY THE JSON ARRAY:`;
  }
  
  /**
   * Call LLM API (OpenAI GPT-4 example)
   */
  private async callLLMAPI(prompt: string, rawText: string): Promise<string> {
    // TODO: Replace with actual LLM API call
    // This is a placeholder implementation
    
    if (!this.llmConfig.apiKey) {
      console.warn('No API key provided, using fallback scene generation');
      const fallbackResult = this.generateFallbackScenes(rawText, 5);
      return JSON.stringify(fallbackResult.scenes, null, 2);
    }
    
    try {
      // TODO: Install openai SDK: npm install openai
      const { OpenAI } = require('openai');
      
      const openai = new OpenAI({
        apiKey: this.llmConfig.apiKey
      });
      
      const completion = await openai.chat.completions.create({
        model: this.llmConfig.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional video script writer. Generate only valid JSON arrays of video scenes as requested. No explanations, no markdown, no comments.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.llmConfig.maxTokens,
        temperature: this.llmConfig.temperature,
        response_format: { type: 'json_object' }
      });
      
      const response = completion.choices[0]?.message?.content || '';
      console.log('LLM API response received');
      
      return response;
      
    } catch (error) {
      console.error('LLM API call failed:', error);
      // Extract raw text from prompt for fallback
      const inputMatch = prompt.match(/INPUT TEXT:\s*"""([\s\S]*?)"""/); 
      const extractedText = inputMatch ? inputMatch[1] : rawText;
      const fallbackResult = this.generateFallbackScenes(extractedText, 5);
      return JSON.stringify(fallbackResult.scenes, null, 2);
    }
  }
  
  /**
   * Fallback scene generation when LLM API is not available
   */
  private generateFallbackScenes(rawText: string, targetScenes: number): SceneGenerationResult {
    console.log(`Using fallback scene generation for ${targetScenes} scenes`);
    
    // Split text into logical sections
    const paragraphs = rawText.split('\n\n').filter(p => p.trim().length > 0);
    const sentences = rawText.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    const scenes: VideoScene[] = [];
    const avgDuration = Math.round(90 / targetScenes); // Target ~90 seconds total
    
    // Generate scene templates based on target count
    const sceneTemplates = this.generateSceneTemplates(targetScenes);
    
    // Distribute content across scenes
    const contentPerScene = Math.ceil(sentences.length / targetScenes);
    
    for (let i = 0; i < targetScenes; i++) {
      const template = sceneTemplates[i] || sceneTemplates[sceneTemplates.length - 1];
      const startIdx = i * contentPerScene;
      const endIdx = Math.min(startIdx + contentPerScene, sentences.length);
      const sceneContent = sentences.slice(startIdx, endIdx).join('. ');
      
      const duration = avgDuration + (Math.random() * 4 - 2); // ±2 second variation
      const finalDuration = Math.max(6, Math.min(15, Math.round(duration)));
      
      scenes.push({
        id: i + 1,
        title: `${template.title} ${i > 2 ? (i - 1) : ''}`.trim(),
        summary: this.generateSceneSummary(sceneContent, template.title),
        narration: this.generateFallbackNarration(sceneContent, template.title),
        on_screen_text: template.on_screen_text,
        visual_keywords: template.visual_keywords,
        mood: template.mood,
        duration_seconds: finalDuration
      });
    }
    
    const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration_seconds, 0);
    
    console.log(`Successfully generated ${scenes.length} scenes (${totalDuration}s total)`);
    
    return {
      scenes,
      totalDuration,
      sceneCount: scenes.length
    };
  }
  
  /**
   * Generate scene templates based on target count
   */
  private generateSceneTemplates(count: number) {
    const baseTemplates = [
      {
        title: 'Introduction',
        on_screen_text: 'Welcome',
        mood: 'informative' as const,
        visual_keywords: 'office desk, laptop typing, business presentation, professional meeting'
      },
      {
        title: 'Overview',
        on_screen_text: 'Key Points',
        mood: 'informative' as const,
        visual_keywords: 'data analysis, charts graphs, people discussing, whiteboard presentation'
      },
      {
        title: 'Main Content',
        on_screen_text: 'Details',
        mood: 'informative' as const,
        visual_keywords: 'focused work, detailed analysis, document review, concentrated reading'
      },
      {
        title: 'Key Insights',
        on_screen_text: 'Insights',
        mood: 'inspirational' as const,
        visual_keywords: 'lightbulb moment, team collaboration, brainstorming session, creative thinking'
      },
      {
        title: 'Implementation',
        on_screen_text: 'Action Steps',
        mood: 'corporate' as const,
        visual_keywords: 'task planning, project management, team coordination, goal setting'
      },
      {
        title: 'Results',
        on_screen_text: 'Outcomes',
        mood: 'warm' as const,
        visual_keywords: 'success metrics, achievement celebration, progress tracking, positive results'
      },
      {
        title: 'Conclusion',
        on_screen_text: 'Summary',
        mood: 'corporate' as const,
        visual_keywords: 'handshake agreement, satisfied team, successful completion, office celebration'
      }
    ];
    
    // Repeat and adjust templates to match target count
    const templates = [];
    for (let i = 0; i < count; i++) {
      templates.push(baseTemplates[i % baseTemplates.length]);
    }
    
    return templates;
  }
  
  /**
   * Generate scene summary from content
   */
  private generateSceneSummary(content: string, sceneType: string): string {
    const words = content.split(/\s+/).slice(0, 25); // First 25 words
    const summary = words.join(' ');
    return `This ${sceneType.toLowerCase()} section covers: ${summary}${words.length === 25 ? '...' : '.'}`;
  }
  
  /**
   * Generate fallback narration for a scene
   */
  private generateFallbackNarration(content: string, sceneType: string): string {
    const words = content.split(/\s+/).slice(0, 60); // ~60 words for narration
    let narration = words.join(' ');
    
    // Add contextual intro based on scene type
    const intros = {
      'Introduction': 'Welcome to this presentation. ',
      'Overview': 'Let\'s examine the key points. ',
      'Main Content': 'Here are the essential details. ',
      'Key Insights': 'These insights are particularly important. ',
      'Implementation': 'Now let\'s look at practical applications. ',
      'Results': 'The outcomes demonstrate that ',
      'Conclusion': 'In summary, we can see that '
    };
    
    const intro = intros[sceneType as keyof typeof intros] || 'Let\'s explore this topic. ';
    narration = intro + narration;
    
    // Ensure it ends properly
    if (!narration.match(/[.!?]$/)) {
      narration += '.';
    }
    
    return narration;
  }
  
  /**
   * Parse and validate LLM response
   */
  private parseAndValidateScenes(response: string): VideoScene[] {
    try {
      // Clean response (remove potential markdown formatting)
      const cleanResponse = response
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      // Parse JSON
      let scenes: any[];
      
      try {
        const parsed = JSON.parse(cleanResponse);
        scenes = Array.isArray(parsed) ? parsed : parsed.scenes || [parsed];
      } catch (parseError) {
        console.error('JSON parsing failed, attempting to extract JSON from response');
        
        // Try to extract JSON array from response
        const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          scenes = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in LLM response');
        }
      }
      
      // Validate and normalize scenes
      const validatedScenes: VideoScene[] = [];
      
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        
        // Validate required fields
        const validatedScene: VideoScene = {
          id: scene.id || (i + 1),
          title: this.validateString(scene.title, `Scene ${i + 1}`, 50),
          summary: this.validateString(scene.summary, 'Scene description', 200),
          narration: this.validateString(scene.narration, 'Scene narration text', 500),
          on_screen_text: this.validateString(scene.on_screen_text, 'Text', 30),
          visual_keywords: this.validateString(scene.visual_keywords, 'office, business, professional', 200),
          mood: this.validateMood(scene.mood),
          duration_seconds: this.validateDuration(scene.duration_seconds)
        };
        
        validatedScenes.push(validatedScene);
      }
      
      // Ensure we have at least 1 scene and at most 10
      if (validatedScenes.length === 0) {
        throw new Error('No valid scenes generated');
      }
      
      if (validatedScenes.length > 10) {
        console.warn('Too many scenes generated, keeping first 10');
        return validatedScenes.slice(0, 10);
      }
      
      return validatedScenes;
      
    } catch (error) {
      console.error('Scene validation failed:', error);
      throw new Error(`Scene parsing/validation failed: ${error}`);
    }
  }
  
  /**
   * Validate string fields
   */
  private validateString(value: any, fallback: string, maxLength: number): string {
    if (typeof value !== 'string' || !value.trim()) {
      return fallback;
    }
    
    return value.trim().substring(0, maxLength);
  }
  
  /**
   * Validate mood field
   */
  private validateMood(mood: any): VideoScene['mood'] {
    const validMoods: VideoScene['mood'][] = ['informative', 'inspirational', 'warm', 'corporate'];
    
    if (typeof mood === 'string' && validMoods.includes(mood as VideoScene['mood'])) {
      return mood as VideoScene['mood'];
    }
    
    return 'informative';
  }
  
  /**
   * Validate duration field
   */
  private validateDuration(duration: any): number {
    const num = parseInt(duration);
    
    if (isNaN(num) || num < 6 || num > 15) {
      return 10; // Default duration
    }
    
    return num;
  }
  
  /**
   * Update LLM configuration
   */
  updateConfig(config: Partial<LLMConfig>): void {
    this.llmConfig = { ...this.llmConfig, ...config };
  }
}

// Export main generation function
export async function generateScenes(rawText: string, config?: Partial<LLMConfig>): Promise<SceneGenerationResult> {
  const service = new SceneGeneratorService(config);
  return await service.generateScenes(rawText);
}

// SceneGeneratorService is exported above as class