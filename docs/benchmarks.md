# Evaluation

Placement training evaluates an idealized placement game without real-time gravity. On 30 unseen seeds, capped at 2,000 pieces, the trained agent averages 797.43 cleared lines (all runs reach the cap), initial weights 9.07, and random legal moves 0.13. Three stress seeds survive 10,000 pieces and clear 3,994 / 3,998 / 3,997 lines. These are capped runs, not unlimited-play claims.

The animated real-time game has independent accelerating gravity and fixed controller reaction time. Seeds 1, 2, and 3 top out after 51 / 39 / 44 pieces, clearing 15 / 9 / 10 lines. The earlier placement benchmarks do not describe this harder game.

`model.json` contains the training history and full placement evaluations. `stress-test.json` and `gravity-evaluation.json` record the additional results.

Checks cover tetromino geometry, bag generation, legal placement, row clearing, block conservation, top-out, compiled-score equivalence, deterministic replay, 300 baseline placements through the command state machine, gravity, lock timing, collisions, sound lifecycle, and activity responses to state changes. Run `npm test` after downloading release assets.
