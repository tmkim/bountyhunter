// compress-images.js
import fs from "fs";
import path from "path";
import sharp from "sharp";

const inputDir = "./small";
const outputDir = "./small_60";

async function compressImages() {
  if (!fs.existsSync(inputDir)) {
    console.error("❌ Input folder not found:", inputDir);
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const files = fs.readdirSync(inputDir);

  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file);

    // Skip non-image files
    if (!/\.(jpg|jpeg|png|webp)$/i.test(file)) continue;

    try {
      await sharp(inputPath)
        // .resize({ width: 800, withoutEnlargement: true }) // Resize if larger than 800px wide
        .toFormat("jpeg", { quality: 60 }) // Compress to ~75% quality
        .toFile(outputPath);

      console.log(`✅ Compressed: ${file}`);
    } catch (err) {
      console.error(`❌ Failed: ${file}`, err);
    }
  }

  console.log("\n🎉 Done! Optimized images saved to:", outputDir);
}

compressImages();
