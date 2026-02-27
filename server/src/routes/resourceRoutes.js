const express =require('express');
const router =express.Router();
const resourceController=require('../controllers/resourceController');
const auth=require('../middleware/auth');

router.post('/',auth,resourceController.uploadResource);

router.get('/',resourceController.getAllResources);
router.delete('/:id', auth, resourceController.deleteResource);
module.exports=router;