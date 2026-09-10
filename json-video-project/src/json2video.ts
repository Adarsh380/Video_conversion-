export function generateMovie(scenes: any[]): { movie: { scenes: any[] } } {
    const movie = {
        scenes: scenes.map(scene => ({
            id: scene.id,
            title: scene.title,
            summary: scene.summary,
            narration: scene.narration,
            onScreenText: scene.onScreenText,
            visualKeywords: scene.visualKeywords,
            refinedVisualKeywords: scene.refinedVisualKeywords,
            pexelsQuery: scene.pexelsQuery,
            pixabayQuery: scene.pixabayQuery,
            assetInformation: scene.assetInformation,
            mood: scene.mood,
            duration: scene.duration
        }))
    };

    return { movie };
}