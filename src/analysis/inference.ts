/**
 * ONNX Runtime Web inference for Set card classification.
 * 
 * Card detection is handled by OpenCV (see opencv-detector.ts).
 */

import * as ort from 'onnxruntime-web'
import type { ClassificationResult } from '../types'

// Configure ONNX Runtime
ort.env.wasm.numThreads = 4

/**
 * Card Classifier for determining card properties (shape, color, number, shading)
 */
export class CardClassifier {
  private session: ort.InferenceSession | null = null
  private inputSize = 224
  private mean = [0.485, 0.456, 0.406]
  private std = [0.229, 0.224, 0.225]

  async load(modelPath: string = '/models/classifier.onnx'): Promise<void> {
    this.session = await ort.InferenceSession.create(modelPath, {
      executionProviders: ['webgl', 'wasm'],
    })
    console.log('Classifier model loaded')
  }

  async classify(imageData: ImageData): Promise<ClassificationResult> {
    if (!this.session) {
      throw new Error('Model not loaded')
    }

    // Preprocess image
    const inputTensor = this.preprocess(imageData)

    // Run inference
    const outputs = await this.session.run({ input: inputTensor })

    // Parse outputs
    return this.postprocess(outputs)
  }

  private preprocess(imageData: ImageData): ort.Tensor {
    const { width, height, data } = imageData

    // Step 1: First resize to 200x300 (matching training aspect ratio)
    const intermediateWidth = 200
    const intermediateHeight = 300
    const intermediateData = this.resize(data, width, height, intermediateWidth, intermediateHeight)
    
    // Step 2: Then resize to 224x224 (classifier input size)
    const resizedData = this.resize(intermediateData, intermediateWidth, intermediateHeight, this.inputSize, this.inputSize)

    // Convert to float32, normalize with ImageNet stats
    const float32Data = new Float32Array(3 * this.inputSize * this.inputSize)

    for (let i = 0; i < this.inputSize * this.inputSize; i++) {
      const r = resizedData[i * 4] / 255
      const g = resizedData[i * 4 + 1] / 255
      const b = resizedData[i * 4 + 2] / 255

      float32Data[i] = (r - this.mean[0]) / this.std[0]
      float32Data[this.inputSize * this.inputSize + i] = (g - this.mean[1]) / this.std[1]
      float32Data[2 * this.inputSize * this.inputSize + i] = (b - this.mean[2]) / this.std[2]
    }

    return new ort.Tensor('float32', float32Data, [1, 3, this.inputSize, this.inputSize])
  }

  private resize(
    data: Uint8ClampedArray,
    srcWidth: number,
    srcHeight: number,
    dstWidth: number,
    dstHeight: number
  ): Uint8ClampedArray {
    const result = new Uint8ClampedArray(dstWidth * dstHeight * 4)
    const xRatio = srcWidth / dstWidth
    const yRatio = srcHeight / dstHeight

    for (let y = 0; y < dstHeight; y++) {
      for (let x = 0; x < dstWidth; x++) {
        const srcX = Math.floor(x * xRatio)
        const srcY = Math.floor(y * yRatio)
        const srcIdx = (srcY * srcWidth + srcX) * 4
        const dstIdx = (y * dstWidth + x) * 4

        result[dstIdx] = data[srcIdx]
        result[dstIdx + 1] = data[srcIdx + 1]
        result[dstIdx + 2] = data[srcIdx + 2]
        result[dstIdx + 3] = data[srcIdx + 3]
      }
    }

    return result
  }

  private postprocess(outputs: ort.InferenceSession.OnnxValueMapType): ClassificationResult {
    const shapeLogits = outputs['shape']?.data as Float32Array || new Float32Array(3)
    const colorLogits = outputs['color']?.data as Float32Array || new Float32Array(3)
    const numberLogits = outputs['number']?.data as Float32Array || new Float32Array(3)
    const shadingLogits = outputs['shading']?.data as Float32Array || new Float32Array(3)

    return {
      shape: this.argmax(shapeLogits),
      color: this.argmax(colorLogits),
      number: this.argmax(numberLogits),
      shading: this.argmax(shadingLogits),
      probabilities: {
        shape: Array.from(this.softmax(shapeLogits)),
        color: Array.from(this.softmax(colorLogits)),
        number: Array.from(this.softmax(numberLogits)),
        shading: Array.from(this.softmax(shadingLogits)),
      },
    }
  }

  private argmax(arr: Float32Array): number {
    let maxIdx = 0
    let maxVal = arr[0]
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] > maxVal) {
        maxVal = arr[i]
        maxIdx = i
      }
    }
    return maxIdx
  }

  private softmax(arr: Float32Array): Float32Array {
    const max = Math.max(...arr)
    const exp = arr.map((x) => Math.exp(x - max))
    const sum = exp.reduce((a, b) => a + b, 0)
    return exp.map((x) => x / sum) as unknown as Float32Array
  }
}
