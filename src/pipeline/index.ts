import { parseDocument, ParsedDocument } from './parseDocument';
import { generateScenes, SceneGenerationResult, VideoScene } from './generateScenes';
import * as fs from 'fs';
import * as path from 'path';

// Combined processing result interface
export interface ProcessingResult {
  rawText: string;
  scenes: VideoScene[];
  metadata: {
    fileName: string;
    fileSize: number;
    fileType: string;
    processingTime: number;
    totalScenes: number;
    totalDuration: number;
    timestamp: string;
  };
}

// Configuration interface
export interface ProcessingConfig {
  // LLM Configuration
  llm?: {
    apiKey?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  };
  
  // Processing options
  options?: {
    enableLogging?: boolean;
    validateInput?: boolean;
    maxFileSize?: number; // in bytes
  };
}

/**
 * Main processing function that combines Document Parsing (Stage A) and Scene Generation (Stage B)
 */
export async function processAandB(
  filePath: string, 
  config: ProcessingConfig = {}
): Promise<ProcessingResult> {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting document-to-video processing pipeline...');
    console.log(`📄 Processing file: ${path.basename(filePath)}`);
    
    // Validate input file
    await validateInputFile(filePath, config.options);
    
    // Get file metadata
    const fileStats = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    const fileType = path.extname(filePath).toLowerCase();
    
    console.log(`📊 File size: ${(fileStats.size / 1024).toFixed(2)} KB`);
    console.log(`📋 File type: ${fileType}`);
    
    // STAGE A: Document Parsing
    console.log('\n🔄 STAGE A: Document Parsing');
    console.log('='.repeat(50));
    
    const parseStartTime = Date.now();
    const parsedDocument: ParsedDocument = await parseDocument(filePath);
    const parseEndTime = Date.now();
    
    console.log(`✅ Document parsed successfully`);
    console.log(`📝 Extracted text length: ${parsedDocument.rawText.length} characters`);
    console.log(`⏱️  Parsing time: ${parseEndTime - parseStartTime}ms`);
    
    // Validate extracted text
    if (!parsedDocument.rawText || parsedDocument.rawText.trim().length < 10) {
      throw new Error('Insufficient text content extracted from document');
    }
    
    // STAGE B: Scene Generation
    console.log('\n🎬 STAGE B: Scene Generation');
    console.log('='.repeat(50));
    
    const sceneStartTime = Date.now();
    const sceneResult: SceneGenerationResult = await generateScenes(
      parsedDocument.rawText, 
      config.llm
    );
    const sceneEndTime = Date.now();
    
    console.log(`✅ Scenes generated successfully`);
    console.log(`🎥 Total scenes: ${sceneResult.sceneCount}`);
    console.log(`⏱️  Total duration: ${sceneResult.totalDuration} seconds`);
    console.log(`🕒 Scene generation time: ${sceneEndTime - sceneStartTime}ms`);
    
    // Calculate total processing time
    const endTime = Date.now();
    const totalProcessingTime = endTime - startTime;
    
    // Create processing result
    const result: ProcessingResult = {
      rawText: parsedDocument.rawText,
      scenes: sceneResult.scenes,
      metadata: {
        fileName,
        fileSize: fileStats.size,
        fileType,
        processingTime: totalProcessingTime,
        totalScenes: sceneResult.sceneCount,
        totalDuration: sceneResult.totalDuration,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('\n🎉 Processing completed successfully!');
    console.log(`⏱️  Total processing time: ${totalProcessingTime}ms`);
    console.log('='.repeat(50));
    
    // Optional: Save processing result
    if (config.options?.enableLogging) {
      await saveProcessingLog(result, filePath);
    }
    
    return result;
    
  } catch (error) {
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.error('\n❌ Processing failed!');
    console.error(`⏱️  Processing time before failure: ${processingTime}ms`);
    console.error('Error details:', error);
    
    throw error;
  }
}

/**
 * Validate input file before processing
 */
async function validateInputFile(filePath: string, options?: ProcessingConfig['options']): Promise<void> {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }
  
  // Check file size
  const stats = fs.statSync(filePath);
  const maxFileSize = options?.maxFileSize || (50 * 1024 * 1024); // 50MB default
  
  if (stats.size > maxFileSize) {
    throw new Error(`File too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB (max: ${(maxFileSize / 1024 / 1024).toFixed(2)}MB)`);
  }
  
  // Check file extension
  const supportedExtensions = ['.pdf', '.docx', '.txt', '.pptx', '.xlsx', '.png', '.jpg', '.jpeg'];
  const fileExtension = path.extname(filePath).toLowerCase();
  
  if (!supportedExtensions.includes(fileExtension)) {
    throw new Error(`Unsupported file type: ${fileExtension}. Supported types: ${supportedExtensions.join(', ')}`);
  }
}

/**
 * Save processing log for debugging and analysis
 */
async function saveProcessingLog(result: ProcessingResult, originalFilePath: string): Promise<void> {
  try {
    const logDir = path.join(process.cwd(), 'logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFileName = `processing-log-${timestamp}.json`;
    const logFilePath = path.join(logDir, logFileName);
    
    const logData = {
      ...result,
      originalFilePath,
      processingLog: {
        version: '1.0.0',
        pipeline: 'A+B (Parse + Generate)',
        environment: process.env.NODE_ENV || 'development'
      }
    };
    
    fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));
    console.log(`📋 Processing log saved: ${logFilePath}`);
    
  } catch (error) {
    console.warn('Failed to save processing log:', error);
  }
}

/**
 * Process multiple files in batch
 */
export async function processBatch(
  filePaths: string[], 
  config: ProcessingConfig = {}
): Promise<ProcessingResult[]> {
  console.log(`🔄 Starting batch processing of ${filePaths.length} files...`);
  
  const results: ProcessingResult[] = [];
  const errors: { filePath: string; error: Error }[] = [];
  
  for (let i = 0; i < filePaths.length; i++) {
    const filePath = filePaths[i];
    
    try {
      console.log(`\n📄 Processing file ${i + 1}/${filePaths.length}: ${path.basename(filePath)}`);
      const result = await processAandB(filePath, config);
      results.push(result);
      
    } catch (error) {
      console.error(`❌ Failed to process ${path.basename(filePath)}:`, error);
      errors.push({ filePath, error: error as Error });
    }
  }
  
  console.log(`\n🎉 Batch processing completed!`);
  console.log(`✅ Successful: ${results.length}/${filePaths.length}`);
  console.log(`❌ Failed: ${errors.length}/${filePaths.length}`);
  
  if (errors.length > 0) {
    console.log('\nFailed files:');
    errors.forEach(({ filePath, error }) => {
      console.log(`  - ${path.basename(filePath)}: ${error.message}`);
    });
  }
  
  return results;
}

/**
 * Utility function to get processing statistics
 */
export function getProcessingStats(results: ProcessingResult[]): {
  totalFiles: number;
  totalScenes: number;
  totalDuration: number;
  averageProcessingTime: number;
  fileTypes: Record<string, number>;
} {
  const fileTypes: Record<string, number> = {};
  
  const stats = results.reduce(
    (acc, result) => {
      // Count file types
      const fileType = result.metadata.fileType;
      fileTypes[fileType] = (fileTypes[fileType] || 0) + 1;
      
      return {
        totalScenes: acc.totalScenes + result.metadata.totalScenes,
        totalDuration: acc.totalDuration + result.metadata.totalDuration,
        totalProcessingTime: acc.totalProcessingTime + result.metadata.processingTime
      };
    },
    { totalScenes: 0, totalDuration: 0, totalProcessingTime: 0 }
  );
  
  return {
    totalFiles: results.length,
    totalScenes: stats.totalScenes,
    totalDuration: stats.totalDuration,
    averageProcessingTime: results.length > 0 ? stats.totalProcessingTime / results.length : 0,
    fileTypes
  };
}

// Export types and interfaces for external use
export type { ParsedDocument, VideoScene, SceneGenerationResult };