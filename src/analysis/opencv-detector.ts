/**
 * OpenCV-based card detection.
 * Uses contour detection to find white rectangular cards in a scene.
 * More robust than ML detection for varied angles/lighting.
 */

// OpenCV.js will be loaded globally as 'cv'
declare const cv: any;

export interface CardDetection {
  bbox: [number, number, number, number]; // x1, y1, x2, y2
  corners: { x: number; y: number }[];
  confidence: number;
}

/**
 * Order corners as [topLeft, topRight, bottomRight, bottomLeft]
 */
function orderCorners(pts: { x: number; y: number }[]): { x: number; y: number }[] {
  const sum = pts.map(p => p.x + p.y);
  const diff = pts.map(p => p.y - p.x);
  const tl = pts[sum.indexOf(Math.min(...sum))];
  const br = pts[sum.indexOf(Math.max(...sum))];
  const tr = pts[diff.indexOf(Math.min(...diff))];
  const bl = pts[diff.indexOf(Math.max(...diff))];
  return [tl, tr, br, bl];
}

/**
 * Check if two rectangles overlap significantly
 */
function rectanglesOverlap(a: [number, number, number, number], b: [number, number, number, number], threshold = 0.5): boolean {
  const [ax1, ay1, ax2, ay2] = a;
  const [bx1, by1, bx2, by2] = b;
  
  const overlapX = Math.max(0, Math.min(ax2, bx2) - Math.max(ax1, bx1));
  const overlapY = Math.max(0, Math.min(ay2, by2) - Math.max(ay1, by1));
  const overlapArea = overlapX * overlapY;
  
  const areaA = (ax2 - ax1) * (ay2 - ay1);
  const areaB = (bx2 - bx1) * (by2 - by1);
  const minArea = Math.min(areaA, areaB);
  
  return overlapArea > minArea * threshold;
}

/**
 * Detect cards in an image using OpenCV contour detection.
 * Returns bounding boxes and corner points for each detected card.
 */
export function detectCardsOpenCV(imageData: ImageData): CardDetection[] {
  if (typeof cv === 'undefined') {
    console.warn('OpenCV not loaded');
    return [];
  }

  // Create OpenCV mat from ImageData
  const src = cv.matFromImageData(imageData);
  const bgr = new cv.Mat();
  cv.cvtColor(src, bgr, cv.COLOR_RGBA2BGR);

  // Resize for faster processing
  const maxWidth = 1200;
  let img = bgr;
  let scale = 1;

  if (img.cols > maxWidth) {
    scale = maxWidth / img.cols;
    const newW = maxWidth;
    const newH = Math.round(img.rows * scale);
    const resized = new cv.Mat();
    cv.resize(img, resized, new cv.Size(newW, newH), 0, 0, cv.INTER_AREA);
    img = resized;
  }

  const imgArea = img.rows * img.cols;
  const allCards: CardDetection[] = [];

  // Try multiple detection strategies and combine results
  const strategies = [
    { sThresh: 60, vThresh: 140, cannyLow: 30, cannyHigh: 100, morphSize: 5 },  // Strict white
    { sThresh: 80, vThresh: 120, cannyLow: 40, cannyHigh: 120, morphSize: 7 },  // Relaxed white
    { sThresh: 100, vThresh: 100, cannyLow: 50, cannyHigh: 150, morphSize: 9 }, // Very relaxed (shadows)
  ];

  for (const strategy of strategies) {
    const detections = detectWithStrategy(img, scale, imgArea, strategy);
    
    // Add detections that don't overlap significantly with existing ones
    for (const det of detections) {
      const isDuplicate = allCards.some(existing => rectanglesOverlap(existing.bbox, det.bbox, 0.4));
      if (!isDuplicate) {
        allCards.push(det);
      }
    }
  }

  // Sort by position (top-left to bottom-right)
  allCards.sort((a, b) => {
    const aY = (a.bbox[1] + a.bbox[3]) / 2;
    const bY = (b.bbox[1] + b.bbox[3]) / 2;
    const rowHeight = imageData.height / 6; // Approximate row height
    const aRow = Math.floor(aY / rowHeight);
    const bRow = Math.floor(bY / rowHeight);
    if (aRow !== bRow) return aRow - bRow;
    return (a.bbox[0] + a.bbox[2]) / 2 - (b.bbox[0] + b.bbox[2]) / 2;
  });

  // Cleanup
  src.delete();
  bgr.delete();
  if (img !== bgr) img.delete();

  return allCards;
}

/**
 * Detect cards with a specific strategy (threshold parameters)
 */
function detectWithStrategy(
  img: any,
  scale: number,
  imgArea: number,
  params: { sThresh: number; vThresh: number; cannyLow: number; cannyHigh: number; morphSize: number }
): CardDetection[] {
  const cards: CardDetection[] = [];

  // Convert to HSV for white detection
  const hsv = new cv.Mat();
  cv.cvtColor(img, hsv, cv.COLOR_BGR2HSV);
  const hsvSplit = new cv.MatVector();
  cv.split(hsv, hsvSplit);
  const S = hsvSplit.get(1);
  const V = hsvSplit.get(2);

  // White mask: low saturation AND high value
  const sMask = new cv.Mat();
  const vMask = new cv.Mat();
  cv.threshold(S, sMask, params.sThresh, 255, cv.THRESH_BINARY_INV);
  cv.threshold(V, vMask, params.vThresh, 255, cv.THRESH_BINARY);

  const whiteMask = new cv.Mat();
  cv.bitwise_and(sMask, vMask, whiteMask);

  // Edge detection for card boundaries
  const gray = new cv.Mat();
  cv.cvtColor(img, gray, cv.COLOR_BGR2GRAY);
  cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);

  const edges = new cv.Mat();
  cv.Canny(gray, edges, params.cannyLow, params.cannyHigh);

  // Combine white mask and edges
  const combined = new cv.Mat();
  cv.bitwise_or(edges, whiteMask, combined);

  // Morphological operations to clean up edges (reduced to prevent merging adjacent cards)
  const k = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(params.morphSize, params.morphSize));
  cv.morphologyEx(combined, combined, cv.MORPH_CLOSE, k, new cv.Point(-1, -1), 1);

  // Find contours
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(combined, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  for (let i = 0; i < contours.size(); i++) {
    const c = contours.get(i);
    const area = cv.contourArea(c);

    // Filter by area - RELAXED for distant cards
    if (area < imgArea * 0.005) { c.delete(); continue; }  // 0.5% minimum
    if (area > imgArea * 0.50) { c.delete(); continue; }   // 50% maximum

    // Get rotated rectangle
    const rect = cv.minAreaRect(c);
    const w = rect.size.width, h = rect.size.height;
    const rectArea = w * h;
    if (rectArea <= 1) { c.delete(); continue; }

    // Fill ratio check - RELAXED for perspective distortion
    const fillRatio = area / rectArea;
    if (fillRatio < 0.60) { c.delete(); continue; }

    // Aspect ratio check (cards are ~1.4:1, allow more variance for perspective)
    const aspect = Math.max(h / Math.max(1, w), w / Math.max(1, h));
    if (aspect < 1.1 || aspect > 2.2) { c.delete(); continue; }

    // Get bounding rect for content analysis
    const boundRect = cv.boundingRect(c);
    
    // Check that the card region has internal content (not uniform)
    // Real cards have colored symbols; false positives are often uniform
    const roi = img.roi(boundRect);
    const roiHsv = new cv.Mat();
    cv.cvtColor(roi, roiHsv, cv.COLOR_BGR2HSV);
    const roiChannels = new cv.MatVector();
    cv.split(roiHsv, roiChannels);
    const roiS = roiChannels.get(1);
    
    // Calculate saturation stats - cards should have some colored content
    const mean = new cv.Mat();
    const stddev = new cv.Mat();
    cv.meanStdDev(roiS, mean, stddev);
    const satStd = stddev.data64F[0];
    
    // Cleanup ROI analysis
    roi.delete();
    roiHsv.delete();
    roiChannels.delete();
    roiS.delete();
    mean.delete();
    stddev.delete();
    
    // Cards should have some color variance (symbols)
    // Pure white/gray regions have very low saturation stddev
    if (satStd < 8) { c.delete(); continue; }  // Too uniform, likely not a card

    // Get corner points
    const pts = cv.RotatedRect.points(rect);
    const corners = pts.map((p: any) => ({
      x: p.x / scale,
      y: p.y / scale
    }));

    // Get bounding box
    const ordered = orderCorners(corners);
    const xs = ordered.map(p => p.x);
    const ys = ordered.map(p => p.y);
    const bbox: [number, number, number, number] = [
      Math.min(...xs),
      Math.min(...ys),
      Math.max(...xs),
      Math.max(...ys)
    ];

    // Reject if bbox is mostly outside the image (partial detections at edges)
    const imgW = img.cols / scale;
    const imgH = img.rows / scale;
    const bboxW = bbox[2] - bbox[0];
    const bboxH = bbox[3] - bbox[1];
    const visibleX = Math.min(bbox[2], imgW) - Math.max(bbox[0], 0);
    const visibleY = Math.min(bbox[3], imgH) - Math.max(bbox[1], 0);
    const visibleRatio = (visibleX * visibleY) / (bboxW * bboxH);
    if (visibleRatio < 0.85) { c.delete(); continue; }  // Card mostly outside frame

    cards.push({
      bbox,
      corners: ordered,
      confidence: fillRatio
    });

    c.delete();
  }

  // Cleanup
  hsv.delete();
  hsvSplit.delete();
  S.delete();
  V.delete();
  sMask.delete();
  vMask.delete();
  whiteMask.delete();
  gray.delete();
  edges.delete();
  combined.delete();
  k.delete();
  contours.delete();
  hierarchy.delete();

  return cards;
}

/**
 * Warp a detected card to a standard rectangle for classification.
 * Always outputs portrait orientation (taller than wide).
 */
export function warpCardToImageData(
  imageData: ImageData,
  corners: { x: number; y: number }[],
  outW: number = 200,
  outH: number = 300
): ImageData | null {
  if (typeof cv === 'undefined') {
    console.warn('OpenCV not loaded');
    return null;
  }

  // Calculate card dimensions from corners to detect orientation
  let [tl, tr, br, bl] = corners;
  
  // Calculate width (top edge) and height (left edge)
  const cardWidth = Math.hypot(tr.x - tl.x, tr.y - tl.y);
  const cardHeight = Math.hypot(bl.x - tl.x, bl.y - tl.y);
  
  // If card is landscape (wider than tall), rotate corners 90° clockwise
  if (cardWidth > cardHeight) {
    [tl, tr, br, bl] = [bl, tl, tr, br];
  }

  const src = cv.matFromImageData(imageData);
  const bgr = new cv.Mat();
  cv.cvtColor(src, bgr, cv.COLOR_RGBA2BGR);

  const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
    tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y
  ]);
  const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0, outW - 1, 0, outW - 1, outH - 1, 0, outH - 1
  ]);

  const M = cv.getPerspectiveTransform(srcPts, dstPts);
  const dsize = new cv.Size(outW, outH);
  const warped = new cv.Mat();
  cv.warpPerspective(bgr, warped, M, dsize, cv.INTER_LINEAR, cv.BORDER_REPLICATE);

  // Convert back to RGBA
  const rgba = new cv.Mat();
  cv.cvtColor(warped, rgba, cv.COLOR_BGR2RGBA);

  // Extract ImageData
  const result = new ImageData(outW, outH);
  rgba.data.forEach((val: number, i: number) => {
    result.data[i] = val;
  });

  // Cleanup
  src.delete();
  bgr.delete();
  srcPts.delete();
  dstPts.delete();
  M.delete();
  warped.delete();
  rgba.delete();

  return result;
}

/**
 * Check if OpenCV.js is loaded
 */
export function isOpenCVLoaded(): boolean {
  return typeof cv !== 'undefined' && typeof cv.Mat !== 'undefined';
}

/**
 * Wait for OpenCV.js to be fully loaded
 */
export function waitForOpenCV(timeout: number = 30000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isOpenCVLoaded()) {
      resolve(true);
      return;
    }
    
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isOpenCVLoaded()) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        console.warn('OpenCV.js failed to load within timeout');
        resolve(false);
      }
    }, 100);
    
    window.addEventListener('opencv-loaded', () => {
      clearInterval(checkInterval);
      resolve(true);
    }, { once: true });
  });
}
