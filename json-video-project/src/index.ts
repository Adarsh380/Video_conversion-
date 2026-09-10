import PdfParser from './pdfParser';
import { extractText } from './textExtractor';
import { ProjectRebuilder } from './projectRebuilder';
import { generateMovie } from './json2video';

async function main() {
    try {
        const pdfFilePath = 'path/to/your/pdf/file.pdf';
        const pdfParser = new PdfParser();
        const parsedData = await pdfParser.parse(pdfFilePath);
        const extractedText = await extractText(parsedData);
        const assetsManager = (null as any);
        const projectRebuilder = new ProjectRebuilder(pdfParser as any, assetsManager);
        const projectJson = await projectRebuilder.rebuildProject(Buffer.from(parsedData || ''), { scenes: [] });
        const movie = generateMovie(projectJson.scenes || []);
        projectJson.movie = movie;
        console.log(JSON.stringify(projectJson, null, 2));
    } catch (error) {
        console.error('Error processing the PDF:', error);
    }
}

main();
