const multer = require('multer');

// In-memory storage (never write to disk)
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
        const err = new Error('Formato de imagen no permitido');
        err.status = 400;
        return cb(err, false);
    }
    cb(null, true);
}

const uploadProfile = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter
});

const uploadPost = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter
});

module.exports = {
    uploadProfile,
    uploadPost
};