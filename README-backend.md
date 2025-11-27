# Video Converter Backend

A TypeScript-based document processing pipeline that extracts text from various document formats and generates video scenes using LLM technology.

## Features

- **Document Parsing (Stage A)**
  - PDF text extraction
  - Microsoft Word (.docx) processing
  - Plain text files
  - PowerPoint (.pptx) content extraction
  - Excel (.xlsx) data processing
  - Image OCR (JPG, PNG, GIF, BMP)

- **Scene Generation (Stage B)**
  - OpenAI GPT-4 integration
  - Structured scene JSON output
  - Batch processing capabilities
  - Fallback scene generation

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your OpenAI API key and configuration
```

### 3. Build and Run
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## Usage

### Basic Document Processing
```typescript
import { processAandB } from './src/pipeline';

// Process a single document
const result = await processAandB([
  { filePath: 'document.pdf', outputPath: 'output.json' }
]);

console.log(result.statistics);
```

### Batch Processing
```typescript
import { processAandB } from './src/pipeline';

// Process multiple documents
const files = [
  { filePath: 'doc1.pdf', outputPath: 'output1.json' },
  { filePath: 'doc2.docx', outputPath: 'output2.json' },
  { filePath: 'presentation.pptx', outputPath: 'output3.json' }
];

const result = await processAandB(files);
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for LLM integration | Required |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-4` |
| `MAX_FILE_SIZE_MB` | Maximum file size limit | `50` |
| `BATCH_SIZE` | Number of files to process simultaneously | `5` |
| `LOG_LEVEL` | Logging verbosity (info, debug, error) | `info` |

### Supported File Types

- **Documents**: PDF, DOCX, TXT, PPTX, XLSX
- **Images**: JPG, JPEG, PNG, GIF, BMP (processed via OCR)

## Architecture

### Stage A: Document Parsing
The `parseDocument.ts` module handles text extraction from various file formats:

```typescript
const parser = new DocumentParserService();
const extractedText = await parser.parseDocument('document.pdf');
```

### Stage B: Scene Generation
The `generateScenes.ts` module converts text to structured video scenes:

```typescript
const generator = new SceneGeneratorService();
const scenes = await generator.generateScenes(extractedText, 'presentation');
```

### Integration Layer
The `index.ts` module orchestrates the complete pipeline:

```typescript
const result = await processAandB(inputFiles);
// Returns: { results: ProcessingResult[], statistics: Statistics }
```

## API Reference

### DocumentParserService

```typescript
class DocumentParserService {
  async parseDocument(filePath: string): Promise<string>
  getSupportedFormats(): string[]
}
```

### SceneGeneratorService

```typescript
class SceneGeneratorService {
  async generateScenes(text: string, documentType: string): Promise<Scene[]>
  validateScenes(scenes: any): boolean
}
```

### Scene Structure

```typescript
interface Scene {
  id: number;
  title: string;
  description: string;
  content: string;
  duration: number;
  visuals?: {
    type: 'text' | 'image' | 'chart';
    data: any;
  };
  audio?: {
    narration: string;
    voiceSettings?: VoiceSettings;
  };
}
```

## Error Handling

The pipeline includes comprehensive error handling:

- File validation and size limits
- Format compatibility checks  
- API rate limiting and retries
- Graceful fallbacks for LLM failures
- Detailed logging and statistics

## Development

### Scripts
- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run in development mode with hot reloading
- `npm run test` - Run test suite
- `npm run lint` - Run ESLint code quality checks
- `npm run clean` - Remove build artifacts

### Adding New File Types
1. Create a parser class implementing the `DocumentParser` interface
2. Add the parser to `DocumentParserService.parsers`
3. Update the supported formats list

### Testing
```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch
```

## Troubleshooting

### Common Issues

**Missing OpenAI API Key**
```
Error: OpenAI API key not found
Solution: Set OPENAI_API_KEY in your .env file
```

**File Size Exceeded**
```
Error: File size exceeds limit
Solution: Increase MAX_FILE_SIZE_MB or compress your files
```

**OCR Failures**
```
Error: OCR processing failed
Solution: Ensure image quality is sufficient and OCR_LANGUAGE is correct
```

### Debugging
Enable debug logging:
```bash
LOG_LEVEL=debug npm run dev
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section
- Review error logs in `logs/processing.log`
- Open an issue on the repository