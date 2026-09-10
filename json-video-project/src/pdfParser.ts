import fs from 'fs';

export default class PdfParser {
  constructor() {}

  async parse(filePath: string): Promise<string> {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data && data.text ? String(data.text) : '';
  }
}
