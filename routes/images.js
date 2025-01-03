
const { Router } = require("express");
const { uploadImages, upload, getImagesByProductId } = require("../controllers/images");


const router = Router();

router.post('/images/single', upload.array('img_url'), (req, res) => {
  uploadImages(req, res);
});

router.get('/products/:product_id/images', getImagesByProductId);

  module.exports = router;