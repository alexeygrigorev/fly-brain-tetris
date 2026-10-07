# Model

The source graph contains 139,255 neurons and 3,732,460 unique directed neuron-pair connections. Regional rows are summed. Strengths use synapse counts; GABA-source edges are negative and all other transmitter classes positive, a deliberate physiological simplification. Incoming absolute strengths are normalized.

For a candidate placement, six normalized measurements (aggregate height, holes, unevenness, peak height, wells, cleared lines) drive deterministic partitions of 16,938 sensory neurons. Four partitions of 1,305 descending neurons are pooled at each of eight updates, giving 32 readout channels:

```
x[t+1] = 0.25*x[t] + 0.75*(W*x[t] + B*u)
```

The network is fixed and linear. Responses to six basis inputs compile its exact selected input/output transformation into a 32×6 matrix. The trainer optimizes six independent coefficients, mapping them into 32 readout weights with the pseudoinverse. The transform has full column rank, so this policy is algebraically equivalent to an ordinary linear heuristic on the same board measurements. These results provide no evidence of a biological topology advantage.

The default live activity panel uses a separate artificial scene encoding: height, holes, unevenness, piece X, descent, rotation. Step-response differences form an impulse response convolved over the latest eight input updates, triggered by changed inputs and every 100 ms of game time. It displays a finite-history response of the same model, not the trained policy's live sensory input. Planned move response shows the original candidate-placement inputs. Positions are annotated x/z coordinates; brightness is normalized per cell and is not measured calcium activity or spikes.

The policy chooses a placement, then a scripted key sequence executes it with legal rotations, lateral moves, and hard drop. The fly's motion illustrates those commands. Independent gravity, collision rules, 350 ms grounded lock, and rising difficulty can invalidate the planned placement. There is no simulated retina, body physics, learned limb controller, biological motor mapping, or learning during playback.

Source: [FlyWire Codex FAFB](https://codex.flywire.ai/api/download?dataset=fafb). The compiled artifact records the source connection file's SHA-256 and partition seed (783).
