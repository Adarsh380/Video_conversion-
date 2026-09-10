from __future__ import annotations

import asyncio
import json
from pathlib import Path

from .config import load_config
from .fetcher import fetch_assets_for_scenes


def main() -> None:
    config = load_config()
    sample_scenes = [
        {
            'scene_id': 'scene-1',
            'text': 'A polished business presentation with animated charts, people collaborating, and modern office scenes.',
        },
        {
            'scene_id': 'scene-2',
            'text': 'A cinematic travel montage showcasing landscapes, city life, and inspiring aerial footage.',
        },
    ]

    assets = asyncio.run(fetch_assets_for_scenes(sample_scenes, config))
    output_path = Path(config.assets_root) / 'run_metadata.json'
    output_path.write_text(json.dumps([asset.to_dict() for asset in assets], indent=2), encoding='utf-8')
    print(f'Wrote {len(assets)} downloaded assets to {output_path}')


if __name__ == '__main__':
    main()
