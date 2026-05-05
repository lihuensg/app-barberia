require('dotenv').config();
const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../src/services/cloudinary.service');

async function run() {
  try {
    // 1x1 PNG real (binario desde base64)
    const tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
    const buffer = Buffer.from(tinyPngBase64, 'base64');
    console.log('Uploading test image to Cloudinary...');
    const res = await uploadBufferToCloudinary({ buffer, folder: 'posts', publicIdPrefix: `test_${Date.now()}` });
    console.log('Upload result:', {
      secure_url: res.secure_url,
      public_id: res.public_id,
      width: res.width,
      height: res.height,
      format: res.format,
      bytes: res.bytes
    });

    console.log('Deleting uploaded image from Cloudinary...');
    const del = await deleteFromCloudinary(res.public_id);
    console.log('Delete result:', del);
    process.exit(0);
  } catch (err) {
    console.error('Error in Cloudinary test:', err);
    if (err && err.stack) console.error(err.stack);
    process.exit(2);
  }
}

run();
