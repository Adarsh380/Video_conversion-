// Test script for document processing pipeline
import { processAandB, ProcessingConfig } from './src/pipeline';
import path from 'path';
import fs from 'fs';

async function testPipeline() {
  console.log('🚀 Testing Document Processing Pipeline\n');

  // Check if sample documents exist
  const sampleFiles = [
    'public/sample_document.txt', 
    'public/short_test_document.txt',
    'public/medium_test_document.txt',
    'sample_document.txt'
  ];

  let testFile: string | null = null;

  // Find available sample files
  for (const sample of sampleFiles) {
    const filePath = path.join(__dirname, sample);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.trim().length > 0) {
        testFile = filePath;
        console.log(`✅ Found sample file: ${sample} (${content.length} characters)`);
        break;
      }
    }
  }

  if (!testFile) {
    console.log('❌ No sample files found. Creating test file...\n');
    
    // Create a test document
    const testContent = `
# Test Document for Video Conversion

## Introduction
This is a test document to demonstrate the document processing pipeline.

## Section 1: Overview
The video converter can process various document types including PDF, DOCX, TXT, PPTX, and XLSX files.

## Section 2: Features
Key features include:
- Document text extraction
- Scene generation using AI
- Batch processing capabilities
- Support for multiple file formats

## Section 3: Technical Details
The system uses:
1. TypeScript for type safety
2. OpenAI GPT-4 for scene generation
3. Various parsing libraries for different formats
4. Comprehensive error handling

## Conclusion
This document demonstrates how content can be converted into video scenes automatically.
    `.trim();

    testFile = path.join(__dirname, 'test_document.txt');
    fs.writeFileSync(testFile, testContent, 'utf8');
    console.log('✅ Created test document: test_document.txt\n');
  }

  // Ensure output directory exists
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Configuration for processing
  const config: ProcessingConfig = {
    options: {
      enableLogging: true,
      validateInput: true,
      maxFileSize: 50 * 1024 * 1024 // 50MB
    }
  };

  try {
    console.log(`📄 Processing file: ${path.basename(testFile)}\n`);
    
    // Process the document
    const result = await processAandB(testFile, config);
    
    console.log('📊 Processing Results:');
    console.log('='.repeat(50));
    console.log(`File: ${result.metadata.fileName}`);
    console.log(`File Size: ${(result.metadata.fileSize / 1024).toFixed(2)} KB`);
    console.log(`File Type: ${result.metadata.fileType}`);
    console.log(`Processing Time: ${result.metadata.processingTime}ms`);
    console.log(`Scenes Generated: ${result.metadata.totalScenes}`);
    console.log(`Total Duration: ${result.metadata.totalDuration}s`);
    console.log(`Timestamp: ${result.metadata.timestamp}`);
    
    // Save result to output file
    const outputPath = path.join(outputDir, `${path.basename(testFile, path.extname(testFile))}_scenes.json`);
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
    console.log(`\n📁 Output saved to: ${outputPath}`);

    // Display sample scenes
    if (result.scenes && result.scenes.length > 0) {
      console.log('\n🎬 Generated Scenes:');
      console.log('='.repeat(50));
      
      result.scenes.slice(0, 3).forEach((scene, index) => {
        console.log(`\nScene ${scene.id}: ${scene.title}`);
        console.log(`Summary: ${scene.summary}`);
        console.log(`Duration: ${scene.duration_seconds}s`);
        console.log(`Mood: ${scene.mood}`);
        console.log(`Visual Keywords: ${scene.visual_keywords}`);
        console.log(`On-Screen Text: ${scene.on_screen_text.substring(0, 100)}${scene.on_screen_text.length > 100 ? '...' : ''}`);
        console.log(`Narration: ${scene.narration.substring(0, 80)}${scene.narration.length > 80 ? '...' : ''}`);
      });
      
      if (result.scenes.length > 3) {
        console.log(`\n... and ${result.scenes.length - 3} more scenes`);
      }
    }

  } catch (error) {
    console.error('❌ Pipeline test failed:', error);
    
    if (error instanceof Error && error.message.includes('OpenAI API key')) {
      console.log('\n💡 Setup Required:');
      console.log('1. Add your OpenAI API key to the .env file');
      console.log('2. Set OPENAI_API_KEY=your_actual_api_key');
      console.log('3. Run the test again');
    }
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testPipeline().catch(console.error);
}

export { testPipeline };