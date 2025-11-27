import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

// Document parsing interfaces
export interface ParsedDocument {
  rawText: string;
}

export interface DocumentParser {
  supportedExtensions: string[];
  parse(filePath: string): Promise<string>;
}

// PDF Parser using pdf-parse
class PDFParser implements DocumentParser {
  supportedExtensions = ['.pdf'];
  
  async parse(filePath: string): Promise<string> {
    try {
      // TODO: Install pdf-parse: npm install pdf-parse @types/pdf-parse
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text || '';
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error(`Failed to parse PDF: ${error}`);
    }
  }
}

// DOCX Parser using mammoth
class DOCXParser implements DocumentParser {
  supportedExtensions = ['.docx'];
  
  async parse(filePath: string): Promise<string> {
    try {
      // TODO: Install mammoth: npm install mammoth @types/mammoth
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '';
    } catch (error) {
      console.error('DOCX parsing error:', error);
      throw new Error(`Failed to parse DOCX: ${error}`);
    }
  }
}

// TXT Parser (plain text)
class TXTParser implements DocumentParser {
  supportedExtensions = ['.txt'];
  
  async parse(filePath: string): Promise<string> {
    try {
      const readFile = promisify(fs.readFile);
      const content = await readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.error('TXT parsing error:', error);
      throw new Error(`Failed to parse TXT: ${error}`);
    }
  }
}

// PPTX Parser
class PPTXParser implements DocumentParser {
  supportedExtensions = ['.pptx'];
  
  async parse(filePath: string): Promise<string> {
    try {
      // TODO: Install pptx-parser or similar: npm install node-pptx
      // For now, using a basic implementation
      const AdmZip = require('adm-zip');
      const xml2js = require('xml2js');
      
      const zip = new AdmZip(filePath);
      const slides = zip.getEntries().filter((entry: any) => 
        entry.entryName.startsWith('ppt/slides/slide') && entry.entryName.endsWith('.xml')
      );
      
      let extractedText = '';
      const parser = new xml2js.Parser();
      
      for (const slide of slides) {
        const slideContent = slide.getData().toString('utf8');
        const result = await parser.parseStringPromise(slideContent);
        
        // Extract text from slide (simplified extraction)
        const textElements = this.extractTextFromSlide(result);
        extractedText += textElements.join('\n') + '\n\n';
      }
      
      return extractedText.trim();
    } catch (error) {
      console.error('PPTX parsing error:', error);
      throw new Error(`Failed to parse PPTX: ${error}`);
    }
  }
  
  private extractTextFromSlide(slideXml: any): string[] {
    const texts: string[] = [];
    
    function traverse(obj: any) {
      if (typeof obj === 'object' && obj !== null) {
        if (obj['a:t']) {
          texts.push(obj['a:t']);
        }
        Object.values(obj).forEach(traverse);
      }
    }
    
    traverse(slideXml);
    return texts;
  }
}

// XLSX Parser
class XLSXParser implements DocumentParser {
  supportedExtensions = ['.xlsx'];
  
  async parse(filePath: string): Promise<string> {
    try {
      // TODO: Install xlsx: npm install xlsx @types/xlsx
      const XLSX = require('xlsx');
      const workbook = XLSX.readFile(filePath);
      
      let extractedText = '';
      
      // Process all sheets
      workbook.SheetNames.forEach((sheetName: string) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        extractedText += `Sheet: ${sheetName}\n`;
        jsonData.forEach((row: any[]) => {
          const rowText = row.filter(cell => cell !== null && cell !== undefined).join(' | ');
          if (rowText.trim()) {
            extractedText += rowText + '\n';
          }
        });
        extractedText += '\n';
      });
      
      return extractedText.trim();
    } catch (error) {
      console.error('XLSX parsing error:', error);
      throw new Error(`Failed to parse XLSX: ${error}`);
    }
  }
}

// Image OCR Parser
class ImageParser implements DocumentParser {
  supportedExtensions = ['.png', '.jpg', '.jpeg'];
  
  async parse(filePath: string): Promise<string> {
    try {
      // TODO: Install tesseract.js or similar OCR library: npm install tesseract.js
      const Tesseract = require('tesseract.js');
      
      const { data: { text } } = await Tesseract.recognize(filePath, 'eng', {
        logger: (m: any) => console.log('OCR Progress:', m)
      });
      
      return text || '';
    } catch (error) {
      console.error('OCR parsing error:', error);
      throw new Error(`Failed to perform OCR on image: ${error}`);
    }
  }
}

// Main document parser class
export class DocumentParserService {
  private parsers: DocumentParser[] = [
    new PDFParser(),
    new DOCXParser(),
    new TXTParser(),
    new PPTXParser(),
    new XLSXParser(),
    new ImageParser()
  ];
  
  /**
   * Detect file type based on extension
   */
  private detectFileType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    return ext;
  }
  
  /**
   * Get appropriate parser for file type
   */
  private getParser(fileExtension: string): DocumentParser | null {
    return this.parsers.find(parser => 
      parser.supportedExtensions.includes(fileExtension)
    ) || null;
  }
  
  /**
   * Parse document and extract clean text
   */
  async parseDocument(filePath: string): Promise<ParsedDocument> {
    try {
      // Validate file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      // Detect file type
      const fileExtension = this.detectFileType(filePath);
      console.log(`Detected file type: ${fileExtension}`);
      
      // Get appropriate parser
      const parser = this.getParser(fileExtension);
      if (!parser) {
        throw new Error(`Unsupported file type: ${fileExtension}`);
      }
      
      // Parse document
      console.log(`Parsing document with ${parser.constructor.name}...`);
      const rawText = await parser.parse(filePath);
      
      // Clean and normalize text
      const cleanText = this.cleanText(rawText);
      
      console.log(`Successfully parsed document. Text length: ${cleanText.length} characters`);
      
      return {
        rawText: cleanText
      };
      
    } catch (error) {
      console.error('Document parsing failed:', error);
      throw error;
    }
  }
  
  /**
   * Clean and normalize extracted text
   */
  private cleanText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters that might interfere
      .replace(/[^\w\s.,!?;:()\-"']/g, '')
      // Trim
      .trim();
  }
  
  /**
   * Get supported file extensions
   */
  getSupportedExtensions(): string[] {
    return this.parsers.flatMap(parser => parser.supportedExtensions);
  }
}

// Export main parsing function
export async function parseDocument(filePath: string): Promise<ParsedDocument> {
  const service = new DocumentParserService();
  return await service.parseDocument(filePath);
}

// Service is exported above as class