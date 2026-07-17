// Inside your routes file
const multer = require("multer");

// WRONG: const upload = multer({ dest: 'uploads/' }); // This doesn't create a buffer!
// RIGHT: Use memory storage to handle buffers seamlessly
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/upload", upload.single("file"), uploadResource);
