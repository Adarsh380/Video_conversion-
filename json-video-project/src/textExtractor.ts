export async function extractText(pdfData: string | Buffer): Promise<string> {
  if (!pdfData) return '';
  if (typeof pdfData === 'string') return pdfData;
  const pdfParse = require('pdf-parse');
  try {
    const res = await pdfParse(pdfData);
    return res.text || '';
  } catch (err) {
    console.error('Error extracting text from PDF:', err);
    return '';
  }
}
