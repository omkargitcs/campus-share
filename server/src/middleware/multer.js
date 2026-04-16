const multer = require('multer');
const storage = multer.memoryStorage(); // Stores file in memory to send to Cloudinary
const upload = multer({ storage: storage });
module.exports = upload;