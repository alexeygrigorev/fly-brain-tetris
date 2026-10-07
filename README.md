# Fly Brain Tetris

A fly plays Tetris on a classic Brick Game handheld: falling LCD blocks, yellow controls, animated foreleg presses, fly buzz, and the original Game Boy Type A music. A second panel shows calculated responses from a simplified linear model derived from the FAFB v783 fly connectome.

## Run locally

Requires Node.js 20 or newer. No npm packages or API keys are needed.

```sh
git clone https://github.com/alexeygrigorev/fly-brain-tetris.git
cd fly-brain-tetris
npm run setup
npm run build
npm start
```

Open http://127.0.0.1:8765 in Chrome. Click **Sound on** at the top to enable audio. Music, game effects, and fly buzz have separate controls. The fly automatically presses direction and rotation buttons; you can click the yellow buttons yourself. Gravity accelerates over time, so the controller can miss placements and lose. Pause freezes play and animation.

The generated HTML is self-contained and can also be opened offline. `PORT=8766 npm start` selects another port (PowerShell: `$env:PORT=8766; npm start`). The server only exposes the generated demo pages and binds to localhost by default.

## Release assets

The [v0.1.0 release](https://github.com/alexeygrigorev/fly-brain-tetris/releases/tag/v0.1.0) contains:

| File | Contents |
| --- | --- |
| `model.json` | Learned 32-channel readout, effective six-feature weights, training history, evaluations, replay |
| `connectome.json` | Compiled 32×6 transform, pseudoinverse, input/output neuron IDs, graph provenance |
| `activity.json` | Response basis and annotated positions for 1,000 sampled neurons |

`npm run setup` downloads these files and the original music. URLs and SHA-256 checksums are pinned in `assets.json`. `npm run weights` and `npm run music` download each group separately. Existing files with different checksums are preserved unless you explicitly pass `--force`, for example `npm run setup -- --force`.

## Training and verification

```sh
npm test
npm run train
npm run build
```

The supplied weights were trained with cross-entropy optimization: 24 generations, 64 candidates, four games per candidate, and 10 elites. Only the readout learns; the connectome stays fixed.

To compile the network again, download `neurons.csv.gz`, `classification.csv.gz`, `connections_princeton.csv.gz`, and `coordinates.csv.gz` from [FlyWire Codex](https://codex.flywire.ai/api/download?dataset=fafb), then run:

```sh
python -m pip install -r requirements.txt
python build_connectome.py --data-dir /path/to/fafb/783
npm run train
npm run build
```

The compiler needs Python 3.11+ and several GB of RAM. Full source connectome tables are not stored in this repository.

See [model details and limitations](docs/model.md) and [evaluation results](docs/benchmarks.md). This is an artificial policy using engineered board features, not a biological fly simulation or a demonstrated learned visual/limb controller.

## Audio and provenance

Game effects and fly buzz were generated with ElevenLabs and are included as static assets; runtime requires no credentials. The fly sound is generated, not a field recording. The original 1989 Game Boy Type A/Korobeiniki recording is downloaded separately from [VGMPF](https://www.vgmpf.com/Wiki/index.php?title=Tetris_(GB)); arrangement by Hirokazu Tanaka, recording credited to Doommaster1994. It is not included in Git history. See [music credits](sounds/music-source.txt). Third-party data and recordings retain their upstream terms; this repository does not grant rights to those materials.
