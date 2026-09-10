import { extractText } from './textExtractor';
import PdfParser from './pdfParser';
import { AssetsManager } from './assets/assetsManager';
import { Scene, Movie } from './types';

export class ProjectRebuilder {
    private pdfParser: PdfParser;
    private assetsManager: AssetsManager;

    constructor(pdfParser: PdfParser, assetsManager: AssetsManager) {
        this.pdfParser = pdfParser;
        this.assetsManager = assetsManager;
    }

    public async rebuildProject(pdfData: Buffer, existingProjectJson: any): Promise<any> {
        const extractedText = await extractText(pdfData);
        const scenes = this.rebuildScenes(extractedText, existingProjectJson.scenes || []);
        const movie = this.generateMovie(scenes);

        return {
            ...existingProjectJson,
            scenes: scenes,
            movie: movie
        };
    }

    private rebuildScenes(extractedText: string, existingScenes: Scene[] = []): Scene[] {
        return existingScenes.map(scene => {
            return {
                ...scene,
                summary: this.generateSummary(extractedText, scene.id),
                narration: this.generateNarration(extractedText, scene.id),
            };
        });
    }

    private generateSummary(extractedText: string, sceneId: string): string {
        return `Summary for scene ${sceneId}`;
    }

    private generateNarration(extractedText: string, sceneId: string): string {
        return `Narration for scene ${sceneId}`;
    }

    private generateMovie(scenes: Scene[]): Movie {
        return {
            scenes: scenes,
        } as any;
    }
}
