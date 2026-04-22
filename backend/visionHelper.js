const tf = require('@tensorflow/tfjs'); // Switched to pure JS version
const mobilenet = require('@tensorflow-models/mobilenet');
const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

/**
 * Utility to calculate similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot   += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dot / denominator;
}

/**
 * Manual Image Decoder
 * Converts Buffer to a Tensor3D without using tf.node
 */
function decodeImageToTensor(buffer, ext) {
  let width, height, rgbaBuffer;

  if (ext === '.png') {
    const png = PNG.sync.read(buffer);
    width = png.width;
    height = png.height;
    rgbaBuffer = png.data;
  } else {
    // Force RGBA output for JPEGs
    const pixels = jpeg.decode(buffer, { useTArray: true, formatAsRGBA: true });
    width = pixels.width;
    height = pixels.height;
    rgbaBuffer = pixels.data;
  }

  // Convert RGBA to RGB (dropping the Alpha channel)
  const rgbArray = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    rgbArray[i * 3]     = rgbaBuffer[i * 4];     // R
    rgbArray[i * 3 + 1] = rgbaBuffer[i * 4 + 1]; // G
    rgbArray[i * 3 + 2] = rgbaBuffer[i * 4 + 2]; // B
  }

  return tf.tensor3d(rgbArray, [height, width, 3], 'int32');
}

/**
 * Loads the MobileNet model once
 */
async function loadModel() {
  console.log('🤖 Loading MobileNet v2 (JS Mode)...');
  return await mobilenet.load({ version: 2, alpha: 1.0 });
}

/**
 * Generates an embedding vector
 */
async function getEmbedding(model, input) {
  let imageTensor = null;
  let embeddingTensor = null;

  try {
    const isBuffer = Buffer.isBuffer(input);
    const buffer = isBuffer ? input : fs.readFileSync(input);
    const ext = isBuffer ? '.jpg' : path.extname(input).toLowerCase();

    // Use our manual decoder instead of tf.node.decodeImage
    imageTensor = decodeImageToTensor(buffer, ext);
    
    // Generate the 1024-dimension "fingerprint"
    embeddingTensor = model.infer(imageTensor, true);
    
    // Return as a standard JavaScript array
    const data = await embeddingTensor.data();
    return Array.from(data); 
  } catch (err) {
    console.error(`❌ Vision Error: ${err.message}`);
    return null;
  } finally {
    if (imageTensor) imageTensor.dispose();
    if (embeddingTensor) embeddingTensor.dispose();
  }
}

module.exports = {
  loadModel,
  getEmbedding,
  cosineSimilarity
};
