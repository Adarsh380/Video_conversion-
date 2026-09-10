export class AssetsManager {
    private assets: Map<string, any>;

    constructor() {
        this.assets = new Map();
    }

    addAsset(assetId: string, assetInfo: any): void {
        this.assets.set(assetId, assetInfo);
    }

    getAsset(assetId: string): any | undefined {
        return this.assets.get(assetId);
    }

    removeAsset(assetId: string): void {
        this.assets.delete(assetId);
    }

    getAllAssets(): Array<any> {
        return Array.from(this.assets.values());
    }

    validateAssets(): Array<string> {
        const invalidAssets: Array<string> = [];
        this.assets.forEach((assetInfo, assetId) => {
            if (!this.isValidAsset(assetInfo)) {
                invalidAssets.push(assetId);
            }
        });
        return invalidAssets;
    }

    private isValidAsset(assetInfo: any): boolean {
        // Implement validation logic for assetInfo
        return assetInfo && typeof assetInfo === 'object' && assetInfo.id && assetInfo.type;
    }
}