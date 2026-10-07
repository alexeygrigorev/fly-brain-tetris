# v0.1.0

First public release of the fly-connectome Tetris demo.

- Compact monochrome Brick Game handheld, clickable yellow controls, animated foreleg presses, and a fly facing the display.
- Automatic accelerating gravity, legal commands, grounded lock, and game over.
- Live scene-response and planned-placement brain views using annotated neuron positions.
- Generated effects and fly buzz; optional original Game Boy Type A music fetched separately.

Assets: model.json (trained readout), connectome.json (compiled network), activity.json (sampled response basis and coordinates). Checksums are pinned in assets.json. These are outputs of a simplified linear connectome-derived model, not a faithful brain simulation. Placement evaluation and real-time gravity results are described separately in docs/benchmarks.md.
