# Rubik'IA

## Demo [https://rubikia.pilow.fr](https://rubikia.pilow.fr)

A Rubik's cube solver that runs entirely in the browser. Enter the colours of your
real cube on the flat net, and it returns a solution in about twenty moves.

- Solving uses **Herbert Kociemba's two-phase algorithm**: phase one brings the cube
  into the subgroup of positions reachable without quarter turns on two of the three
  axes, phase two finishes inside that subgroup. Both phases are iterative-deepening
  searches guided by precomputed pruning tables (the 18 MB of `CoordCube.js`).
- A solution is found in a few dozen milliseconds, with no server involved.
- The 3D cube uses Werner Randelshofer's WebGL
  [Virtual Cube](https://www.randelshofer.ch/webcubed/) library.

The 54 facelets in `index.js` are the single source of truth: the 3D cube and the 2D
net are only two views of it, and every twist goes through a `cubeTwisted` listener,
so the two cannot drift apart.

Originally written in 2016, refreshed in 2026 (scramble button, background table
loading, touch support, responsive layout).

## Run

No build step, it is a static site. Serve the folder over HTTP, for instance:

```
python3 -m http.server 8000
```

Then open http://localhost:8000/.