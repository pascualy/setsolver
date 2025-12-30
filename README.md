<div align="center">

<img src="assets/banner.svg" alt="SET Solver" width="100%" />

<br />

[![Try It](https://img.shields.io/badge/Try_It-setsolver.org-DC2626?style=for-the-badge&labelColor=FACC15)](https://setsolver.org)

<br />

![React](https://img.shields.io/badge/React-DC2626?style=flat-square&logo=react&logoColor=FACC15)
![TypeScript](https://img.shields.io/badge/TypeScript-DC2626?style=flat-square&logo=typescript&logoColor=FACC15)
![Vite](https://img.shields.io/badge/Vite-DC2626?style=flat-square&logo=vite&logoColor=FACC15)
![Tailwind](https://img.shields.io/badge/Tailwind-DC2626?style=flat-square&logo=tailwindcss&logoColor=FACC15)
![OpenCV](https://img.shields.io/badge/OpenCV-DC2626?style=flat-square&logo=opencv&logoColor=FACC15)
![ONNX](https://img.shields.io/badge/ONNX-DC2626?style=flat-square&logo=onnx&logoColor=FACC15)

<br />

Point your camera at SET cards or upload a photo. All valid SETs are found instantly.

[Try the App](https://setsolver.org) · [How It Works](#how-it-works) · [Run Locally](#quick-start)

</div>

---

## Capture with Camera

<div align="center">

<img src="assets/capture.gif" width="280" />

</div>

## Upload image

<div align="center">

<img src="assets/upload.gif" width="280" />

</div>

## Quick Start

```bash
bun install
bun run dev
```

Open http://localhost:5173

### Build

```bash
bun run build
```

---

## How It Works

1. **Detection** — OpenCV finds card contours in the image
2. **Classification** — Neural network identifies shape, color, number, shading
3. **Solving** — Algorithm finds all valid SETs

---

## Project Structure

```
src/
├── components/    # Camera, Canvas, Controls
├── hooks/         # useSetSolver
├── analysis/      # OpenCV detection + ONNX inference
└── game/          # SET logic & solver

public/models/     # Pre-trained classifier
classifier/        # PyTorch training notebook
```

---

## Retrain (Optional)

```bash
cd classifier && uv sync
uv run jupyter notebook classifier.ipynb
```

Headless (no UI):

```bash
cd classifier && uv sync
uv run jupyter nbconvert --to notebook --execute classifier.ipynb --output classifier.executed.ipynb
```

---

<div align="center">

[**Try SET Solver →**](https://setsolver.org)

MIT License

</div>
