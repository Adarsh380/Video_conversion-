import { ProjectRebuilder } from '../src/projectRebuilder';
import { Scene } from '../src/types';
import { expect } from 'chai';

describe('ProjectRebuilder', () => {
    let projectRebuilder: ProjectRebuilder;

    beforeEach(() => {
        projectRebuilder = new ProjectRebuilder();
    });

    it('should rebuild project JSON from extracted text', () => {
        const extractedText = `
            Scene 1: Introduction
            This scene introduces the main characters and sets the stage for the story.
            Narration: "Welcome to our story."
            On-screen text: "Once upon a time..."
        `;

        const scenes: Scene[] = [
            {
                id: 'scene1',
                title: 'Introduction',
                summary: '',
                narration: '',
                onScreenText: '',
                visualKeywords: [],
                refinedVisualKeywords: [],
                pexelsQuery: '',
                pixabayQuery: '',
                assetInfo: {},
                mood: '',
                duration: 0
            }
        ];

        const rebuiltProject = projectRebuilder.rebuildProject(extractedText, scenes);

        expect(rebuiltProject.scenes[0].summary).to.equal('This scene introduces the main characters and sets the stage for the story.');
        expect(rebuiltProject.scenes[0].narration).to.equal('Welcome to our story.');
        expect(rebuiltProject.scenes[0].onScreenText).to.equal('Once upon a time...');
    });

    it('should retain existing asset information', () => {
        const extractedText = `
            Scene 2: The Journey
            This scene depicts the journey of the characters.
            Narration: "And so, they began their adventure."
            On-screen text: "The journey begins..."
        `;

        const scenes: Scene[] = [
            {
                id: 'scene2',
                title: 'The Journey',
                summary: '',
                narration: '',
                onScreenText: '',
                visualKeywords: [],
                refinedVisualKeywords: [],
                pexelsQuery: '',
                pixabayQuery: '',
                assetInfo: { validAsset: true },
                mood: '',
                duration: 0
            }
        ];

        const rebuiltProject = projectRebuilder.rebuildProject(extractedText, scenes);

        expect(rebuiltProject.scenes[0].assetInfo).to.deep.equal({ validAsset: true });
    });

    it('should handle empty extracted text gracefully', () => {
        const extractedText = '';
        const scenes: Scene[] = [
            {
                id: 'scene3',
                title: 'Conclusion',
                summary: '',
                narration: '',
                onScreenText: '',
                visualKeywords: [],
                refinedVisualKeywords: [],
                pexelsQuery: '',
                pixabayQuery: '',
                assetInfo: {},
                mood: '',
                duration: 0
            }
        ];

        const rebuiltProject = projectRebuilder.rebuildProject(extractedText, scenes);

        expect(rebuiltProject.scenes[0].summary).to.equal('');
        expect(rebuiltProject.scenes[0].narration).to.equal('');
        expect(rebuiltProject.scenes[0].onScreenText).to.equal('');
    });
});