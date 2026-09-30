// Free, fully in-browser check whether an uploaded photo looks like an interior.
// MobileNet (ImageNet classes) runs locally; weights are served from /public/ml.
// ImageNet has no "room" class, so we sum the probability of interior objects instead.

const INTERIOR_KEYWORDS = [
  "studio couch", "four-poster", "wardrobe", "bookcase", "china cabinet", "chiffonier", "desk",
  "dining table", "folding chair", "rocking chair", "barber chair", "throne", "entertainment center",
  "home theater", "television", "window shade", "window screen", "sliding door", "shoji", "quilt",
  "pillow", "table lamp", "lampshade", "radiator", "fire screen", "wall clock", "file cabinet",
  "prayer rug", "doormat", "bannister", "stove", "refrigerator", "microwave", "dishwasher",
  "washbasin", "tub", "toilet seat", "shower curtain", "medicine chest", "cradle", "crib", "bassinet",
  "chest", "plate rack", "vase", "theater curtain", "upright", "grand piano", "pool table",
  "library", "bookshop", "restaurant", "mosquito net", "tray", "rotisserie", "dutch oven", "hamper",
  "monitor", "cabinet",
];

const ACCEPT_SCORE = 0.2;

let modelPromise = null;

function loadModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      const tf = await import("@tensorflow/tfjs-core");
      await import("@tensorflow/tfjs-backend-webgl");
      await import("@tensorflow/tfjs-backend-cpu");
      await tf.ready();
      const mobilenet = await import("@tensorflow-models/mobilenet");
      return mobilenet.load({ version: 2, alpha: 1, modelUrl: "/ml/mobilenet_v2/model.json", inputRange: [0, 1] });
    })().catch((err) => {
      modelPromise = null;
      throw err;
    });
  }
  return modelPromise;
}

export async function checkRoomPhoto(img) {
  const model = await loadModel();
  const predictions = await model.classify(img, 10);
  const interior = predictions.filter((p) => INTERIOR_KEYWORDS.some((k) => p.className.includes(k)));
  const score = interior.reduce((sum, p) => sum + p.probability, 0);
  const topIsInterior = interior.length > 0 && interior[0] === predictions[0];
  return { ok: score >= ACCEPT_SCORE || topIsInterior, score, predictions };
}
