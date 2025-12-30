# ONNX Models

## classifier.onnx

Multi-head CNN classifier for Set card properties.

**Input:** `input` - [1, 3, 224, 224] RGB image (normalized)

**Outputs:**
- `shape` - [1, 3] logits (diamond, oval, squiggle)
- `color` - [1, 3] logits (red, green, purple)  
- `number` - [1, 3] logits (1, 2, 3)
- `shading` - [1, 3] logits (solid, striped, empty)

**Training:** See `classifier/classifier.ipynb`
