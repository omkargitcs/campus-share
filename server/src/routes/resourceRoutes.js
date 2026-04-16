const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const auth = require('../middleware/auth');
const upload = require('../middleware/multer'); // 1. Import your multer configuration

// 2. Change the path to '/upload' for clarity
// 3. Add 'upload.single('file')' - This is the "bridge" that handles the PDF
router.post('/upload', auth, upload.single('file'), resourceController.uploadResource);

router.get('/', resourceController.getAllResources);
router.delete('/:id', auth, resourceController.deleteResource);
router.patch('/stats/:id', auth, resourceController.incrementStats);

module.exports = router;