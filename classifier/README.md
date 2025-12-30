## Classifier (Training)

This folder contains the (small) training dataset and the training notebook used to export the web model.

### Setup

```bash
uv sync
```

### Train + export ONNX

Interactive:

```bash
uv run jupyter notebook classifier.ipynb
```

Headless (CI-friendly):

```bash
uv run jupyter nbconvert --to notebook --execute classifier.ipynb --output classifier.executed.ipynb
```

### Output

The notebook exports the ONNX model to:

- `../public/models/classifier.onnx`

