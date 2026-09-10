import { PdfParser } from '../src/pdfParser';
import { extractText } from '../src/textExtractor';

describe('PdfParser', () => {
    let pdfParser: PdfParser;

    beforeEach(() => {
        pdfParser = new PdfParser();
    });

    it('should parse a PDF file and extract readable text', async () => {
        const pdfFilePath = 'path/to/sample.pdf'; // Replace with a valid PDF file path
        const parsedData = await pdfParser.parse(pdfFilePath);
        const extractedText = extractText(parsedData);

        expect(extractedText).toBeDefined();
        expect(extractedText).not.toContain('%PDF');
        expect(extractedText).not.toContain('FlateDecode');
        expect(extractedText).not.toContain('compressed streams');
        expect(extractedText).toMatch(/.+/); // Ensure there is meaningful content
    });

    it('should handle invalid PDF files gracefully', async () => {
        const invalidPdfFilePath = 'path/to/invalid.pdf'; // Replace with an invalid PDF file path
        await expect(pdfParser.parse(invalidPdfFilePath)).rejects.toThrow('Invalid PDF file');
    });
});