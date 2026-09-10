export interface Scene {
    id: string;
    title: string;
    summary: string;
    narration: string;
    onScreenText: string;
    visualKeywords: string[];
    refinedVisualKeywords: string[];
    pexelsQuery: string;
    pixabayQuery: string;
    assetInformation: Asset[];
    mood: string;
    duration: number;
}

export interface Asset {
    id: string;
    type: string;
    url: string;
    description: string;
}

export interface Movie {
    title: string;
    scenes: Scene[];
    duration: number;
    mood: string;
}