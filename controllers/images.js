const multer = require('multer');
const mysqls = require("mysql");
const path = require('path');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directorio donde se almacenarán las imágenes
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname); // Nombre de archivo único
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1500000 * 1500000 * 2, // Tamaño máximo de archivo en bytes (en este caso, 2 MB)
    },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
          return cb(new Error('Only images are allowed'), false);
        }
        cb(null, true);
      }
});

const uploadImages = async (req, res) => {
    try {
        // Verificar si hay archivos cargados
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No se han proporcionado archivos" });
        }

        // Construir URLs de las imágenes cargadas
        const imageUrls = req.files.map(file => `${req.protocol}://${req.get('host')}/${file.path}`);

        // Devolver las URLs de las imágenes como respuesta
        res.status(200).json({ imageUrls });
        console.log(imageUrls)
    } catch (error) {
        console.error("Error al procesar la solicitud:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const getImagesByProductId = (req, res) => {
  const { product_id } = req.params;

  const connection = mysqls.createConnection({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  

  const sql = 'SELECT * FROM products_img WHERE product_id = ?';
  connection.query(sql, [product_id], (err, results) => {
    if (err) {
      console.error('Error al obtener las imágenes del producto:', err);
      return res.status(500).json({ error: 'Error al obtener las imágenes del producto' });
    }

    res.json({ images: results });
  });
};

module.exports = {
    uploadImages,
    getImagesByProductId,
    upload
};
