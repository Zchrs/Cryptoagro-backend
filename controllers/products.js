
// const mysql = require('mysql');
const util = require('util');
const mysql = require('mysql2/promise');
const mysqls = require("mysql");


const { v4: uuidv4 } = require('uuid');
const { connectionDB } = require('../database/config');

const v4options = {
  random: [
    0x10, 0x91, 0x56, 0xbe, 0xc4, 0xfb, 0xc1, 0xea, 0x71, 0xb4, 0xef, 0xe1, 0x67, 0x1c, 0x58, 0x36,
    0x30, 0x51
  ],
};



// const createProduct = async (req, res) => {
//   const { id = uuidv4(v4options.random), name, price, previousPrice, category, quantity, description, image } = req.body;
//   try {
//     const connection = mysqls.createConnection({
//       host: process.env.DB_HOST,
//       user: process.env.DB_USERNAME,
//       password: process.env.DB_PASSWORD,
//       database: process.env.DB_NAME,
//     });

//     const findNameQuery = "SELECT COUNT(*) AS count FROM products WHERE name = ?";
//     const findNameValues = [name];

//     connection.query(findNameQuery, findNameValues, (error, results) => {
//       if (error) {
//         console.error("Error al verificar el nombre del producto: ", error);
//         res.status(500).json({ error: "Ocurrió un error al verificar el nombre del producto" });
//         return;
//       }

//       const nameExists = results[0].count > 0;

//       if (nameExists) {
//         console.log("Ya hay un producto con el mismo nombre");
//         res.status(400).json({ error: "El producto ya está registrado" });
//         return;
//       }
// //jelou
//       const imageUrl = req.file ? req.file.path : null; // Ruta de la imagen guardada en el servidor

//       const insertProduct =
//         'INSERT INTO products (id, name, price, previousPrice, category, quantity, description, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
//       const values = [id, name, price, previousPrice, category, quantity, description, image];

//       connection.query(insertProduct, values, async (error, results) => {
//         if (error) {
//           console.error("Error al insertar datos del producto: ", error);
//           res.status(500).json({ error: "Ocurrió un error al insertar los datos del producto" });
//           return;
//         }

//         res.json({
//           id, 
//           name, 
//           price, 
//           previousPrice, 
//           category, 
//           quantity, 
//           description, 
//           image
//         });

//         console.log("Producto registrado correctamente");
//         connection.end();
//       });
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ error: 'Error al subir la imagen' });
//   }
// };

const createProduct = (req, res) => {
  const { id = uuidv4(), name, price, previousPrice, category, quantity, description, img_url } = req.body;
      const connection = mysqls.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

  if (!Array.isArray(img_url)) {
      console.error("img_url debe ser un array");
      res.status(400).json({ error: "img_url debe ser un array" });
      return;
  }

  connection.beginTransaction(err => {
      if (err) {
          console.error("Error al iniciar la transacción: ", err);
          res.status(500).json({ error: "Ocurrió un error al iniciar la transacción" });
          return;
      }

      const findNameQuery = "SELECT COUNT(*) AS count FROM products WHERE name = ?";
      const findNameValues = [name];

      connection.query(findNameQuery, findNameValues, (error, results) => {
          if (error) {
              console.error("Error al verificar el nombre del producto: ", error);
              return connection.rollback(() => {
                  res.status(500).json({ error: "Ocurrió un error al verificar el nombre del producto" });
              });
          }

          const nameExists = results[0].count > 0;

          if (nameExists) {
              console.log("Ya hay un producto con el mismo nombre");
              return connection.rollback(() => {
                  res.status(400).json({ error: "El producto ya está registrado" });
              });
          }

          const insertProductQuery = 'INSERT INTO products (id, name, price, previousPrice, category, quantity, description) VALUES (?, ?, ?, ?, ?, ?, ?)';
          const productValues = [id, name, price, previousPrice, category, quantity, description];

          connection.query(insertProductQuery, productValues, (error, results) => {
              if (error) {
                  console.error("Error al insertar datos del producto: ", error);
                  return connection.rollback(() => {
                      res.status(500).json({ error: "Ocurrió un error al insertar los datos del producto" });
                  });
              }

              if (img_url.length === 0) {
                  return connection.commit(err => {
                      if (err) {
                          return connection.rollback(() => {
                              res.status(500).json({ error: "Ocurrió un error al confirmar la transacción" });
                          });
                      }

                      res.json({
                          id,
                          name,
                          price,
                          previousPrice,
                          category,
                          quantity,
                          description,
                          img_url: []
                      });

                      console.log("Producto registrado correctamente sin imágenes");
                      connection.end();
                  });
              }

              const insertImageQuery = 'INSERT INTO products_img (product_id, img_url) VALUES ?';
              const imageValues = img_url.map(url => [id, url]);

              connection.query(insertImageQuery, [imageValues], (error, results) => {
                  if (error) {
                      console.error("Error al insertar las imágenes del producto: ", error);
                      return connection.rollback(() => {
                          res.status(500).json({ error: "Ocurrió un error al insertar las imágenes del producto" });
                      });
                  }

                  connection.commit(err => {
                      if (err) {
                          return connection.rollback(() => {
                              res.status(500).json({ error: "Ocurrió un error al confirmar la transacción" });
                          });
                      }

                      res.json({
                          id,
                          name,
                          price,
                          previousPrice,
                          category,
                          quantity,
                          description,
                          img_url
                      });

                      console.log("Producto registrado correctamente con imágenes");
                      connection.end();
                  });
              });
          });
      });
  });
};

const getProducts = async () => {
  try {
    const connection = mysqls.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    
    const query = util.promisify(connection.query).bind(connection);
    // Realizar la consulta a la base de datos
    const products = await query('SELECT * FROM products');

    // console.log(products[1])
    // Enviar los productos como respuesta
    return products;
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    throw error;
  }
};


const getSoldProducts = async () => {
  try {
    // Crear la conexión
    const connection = mysqls.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Promisify para poder usar async/await
    const query = util.promisify(connection.query).bind(connection);

    // Consulta para obtener el total de ventas por producto
    const products = await query(`
      SELECT product_id, SUM(quantity) AS total_sales
      FROM sold_products
      GROUP BY product_id
    `);

    // Cerrar la conexión una vez que la consulta se haya completado
    connection.end();

    // Devolver los productos vendidos
    return products;
  } catch (error) {
    console.error('Error al obtener los productos vendidos:', error);
    throw error;
  }
};

// async function getProductsByCategory(category) {
//   try {
//     // Crea una conexión a la base de datos
//     const connection = await mysql.createConnection({
//       host: process.env.DB_HOST,
//       user: process.env.DB_USERNAME,
//       password: process.env.DB_PASSWORD,
//       database: process.env.DB_NAME,
//     });

//     console.log('Conexión establecida con la base de datos');

//     // Realiza la consulta para obtener los productos por categoría
//     const [rows, fields] = await connection.execute('SELECT * FROM products WHERE category = ?', [category]);


//     // Cierra la conexión después de ejecutar la consulta
//     connection.end();

//     console.log('Conexión cerrada');

//     return rows;
//   } catch (error) {
//     console.error('Error al obtener los productos:', error);
//     throw error;
//   }
// }



// const updateProduct = async (req, res) => {
//   try {
//     const connection = mysql.createConnection({
//       host: process.env.DB_HOST,
//       user: process.env.DB_USERNAME,
//       password: process.env.DB_PASSWORD,
//       database: process.env.DB_NAME,
//     });
    
//     await new Promise((resolve, reject) => {
//       connection.connect(err => {
//         if (err) {
//           reject(err);
//         } else {
//           resolve();
//         }
//       });
//     });

//     const { id } = req.params; // ID del producto a actualizar
//     const {
//       name,
//       price,
//       previousPrice,
//       category,
//       quantity,
//       description,
//       image 
//     } = req.body; // Nuevos detalles del producto

//     let updateFields = [];
//     let values = [];
//     if (name !== undefined) {
//       updateFields.push('name = ?');
//       values.push(name);
//     }
//     if (price !== undefined) {
//       updateFields.push('price = ?');
//       values.push(price);
//     }
//     if (previousPrice !== undefined) {
//       updateFields.push('previousPrice = ?');
//       values.push(previousPrice);
//     }
//     if (category !== undefined) {
//       updateFields.push('category = ?');
//       values.push(category);
//     }
//     if (quantity !== undefined) {
//       updateFields.push('quantity = ?');
//       values.push(quantity);
//     }
//     if (description !== undefined) {
//       updateFields.push('description = ?');
//       values.push(description);
//     }
//     if (image !== undefined) {
//       updateFields.push('image = ?');
//       values.push(image);
//     }

//     values.push(id); // Agregar el ID al final del array de valores

//     const updateFieldsString = updateFields.join(', ');
//     const query = `UPDATE products SET ${updateFieldsString} WHERE id = ?`;

//     await new Promise((resolve, reject) => {
//       connection.query(query, values, (err, result) => {
//         if (err) {
//           reject(err);
//         } else {
//           resolve(result);
//         }
//       });
//     });

//     console.log('Producto actualizado correctamente');
//     return res.status(200).json({ message: 'Producto actualizado correctamente' });

//   } catch (error) {
//     console.error('Error al actualizar el producto:', error);
//     return res.status(500).json({ error: 'Error interno del servidor' });
//   } finally {
//     connection.end(); // Cerrar la conexión después de usarla
//   }
// };



// const updateProduct = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateValues = {};
//     const updateImages = req.body.images || []; // Assuming images are sent in an array

//     const connection = mysqls.createConnection({
//       host: process.env.DB_HOST,
//       user: process.env.DB_USERNAME,
//       password: process.env.DB_PASSWORD,
//       database: process.env.DB_NAME,
//     });

//     if (req.body.name) updateValues.name = req.body.name;
//     if (req.body.price) updateValues.price = req.body.price;
//     if (req.body.previousPrice) updateValues.previousPrice = req.body.previousPrice;
//     if (req.body.category) updateValues.category = req.body.category;
//     if (req.body.quantity) updateValues.quantity = req.body.quantity;
//     if (req.body.description) updateValues.description = req.body.description;

//     // Construct the update query for products table
//     const updateProductQuery = `
//       UPDATE products 
//       SET ${Object.keys(updateValues).map(field => `${field} = ?`).join(', ')}
//       WHERE id = ?  
//     `;
//     const productValues = [...Object.values(updateValues), id];

//     // Begin transaction
  
//       try {
//         // Update products table
//         await connection.query(updateProductQuery, productValues);

//         // Delete existing images for the product
//         const deleteImagesQuery = `
//           DELETE FROM products_img
//           WHERE product_id = ?
//         `;
//         await connection.query(deleteImagesQuery, [id]);

//         // Insert new images for the product
//         if (updateImages.length > 0) {
//           const insertImagesQuery = `
//             INSERT INTO products_img (product_id, img_url)
//             VALUES ?
//           `;
//           const imagesData = updateImages.map(img => [id, img.img_url]);
//           await connection.query(insertImagesQuery, [imagesData]);
//         }

//         // Commit the transaction
//         connection.commit((err) => {
//           if (err) {
//             throw err;
//           }
//           console.log('Transaction completed.');
//           res.json({ message: 'Product updated successfully' });
//         });
//       } catch (error) {
//         // Rollback the transaction on error
//         connection.rollback(() => {
//           console.error('Error in transaction:', error);
//           res.status(500).json({ error: 'Error updating product' });
//         });
//       } finally {
//         // Always close the connection
//         connection.end();
//       }
//     ;
//   } catch (error) {
//     console.error('Error updating product:', error);
//     res.status(500).json({ error: 'Error updating product' });
//   }
// };


// Función sellProduct
async function getProductsByCategory(category) {
  try {
    // Crea una conexión a la base de datos
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('Conexión establecida con la base de datos');

    // Realiza la consulta para obtener los productos por categoría
    const [productsRows] = await connection.execute('SELECT * FROM products WHERE category = ?', [category]);

    // Obtén los IDs de los productos para usar en la siguiente consulta
    const productIds = productsRows.map(product => product.id);

    if (productIds.length === 0) {
      // Si no hay productos, cierra la conexión y retorna un array vacío
      connection.end();
      console.log('Conexión cerrada');
      return [];
    }

    // Realiza la consulta para obtener las calificaciones de los productos
    // Utiliza un marcador de posición `?` para cada ID en la cláusula IN
    const [ratingsRows] = await connection.execute(
      `SELECT * FROM ratings WHERE product_id IN (${productIds.map(() => '?').join(', ')})`,
      productIds
    );

    // Cierra la conexión después de ejecutar la consulta
    connection.end();
    console.log('Conexión cerrada');

    // Agrupa las calificaciones por producto
    const productsWithRatings = productsRows.map(product => {
      const productRatings = ratingsRows.filter(rating => rating.product_id === product.id);
      return {
        ...product,
        ratings: productRatings
      };
    });

    return productsWithRatings;
  } catch (error) {
    console.error('Error al obtener los productos y las calificaciones:', error);
    throw error;
  }
}

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    price,
    previousPrice,
    category,
    quantity,
    description,
  } = req.body;
  const images = req.files;

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await connection.beginTransaction();

    console.log("Updating product with id:", id);
    console.log("Product details:", { name, price, previousPrice, category, quantity, description });
    console.log("Images:", images);

    const updateProductQuery = `
      UPDATE products 
      SET name = ?, price = ?, previousPrice = ?, category = ?, quantity = ?, description = ?
      WHERE id = ?
    `;
    await connection.execute(updateProductQuery, [name, price, previousPrice, category, quantity, description, id]);

    // Delete existing images associated with the product
    const deleteImagesQuery = 'DELETE FROM products_img WHERE product_id = ?';
    await connection.execute(deleteImagesQuery, [id]);

    // Insert new images into products_img table
    if (images && images.length > 0) {
      const insertImagesQuery = 'INSERT INTO products_img (product_id, img_url) VALUES ?';
      const imagesData = img_url.map(image => [id, image.filename]); // Assuming 'filename' is the correct property to use

      console.log("Images data to insert:", imagesData);

      await connection.query(insertImagesQuery, [imagesData]);
    }

    await connection.commit();
    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating product", error);
    res.status(500).json({ error: 'Error updating product' });
  } finally {
    await connection.end();
  }
};


const deleteProduct = async (req, res) => {
  const productId = req.params.id;

  const connection = await mysqls.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // Primero eliminamos las imágenes asociadas al producto
  const deleteImagesSql = 'DELETE FROM products_img WHERE product_id = ?';
  connection.query(deleteImagesSql, [productId], (err, imageResult) => {
      if (err) {
          console.error('Error deleting product images: ', err);
          return res.status(500).json({ error: 'Error deleting product images' });
      }
      console.log(`Deleted ${imageResult.affectedRows} images for product with ID: ${productId}`);

      // Luego eliminamos el producto
      const deleteProductSql = 'DELETE FROM products WHERE id = ?';
      connection.query(deleteProductSql, [productId], (err, productResult) => {
          if (err) {
              console.error('Error deleting product: ', err);
              return res.status(500).json({ error: 'Error deleting product' });
          }
          console.log('Deleted product with ID:', productId);
          res.status(200).json({ message: 'Product deleted successfully' });
      });
  });
};

async function sellProduct(productId, quantity) {
  const connection = await mysql.createConnection({host: 'localhost', user: 'root', database: 'shop'});
  
  try {
    await connection.beginTransaction();

    const [updateResult] = await connection.execute(
      `UPDATE products
       SET stock = stock - ?
       WHERE id = ?
         AND stock >= ?`, [quantity, productId, quantity]
    );

    if (updateResult.affectedRows === 0) {
      throw new Error('Stock insuficiente o producto no encontrado');
    }

    const [insertResult] = await connection.execute(
      `INSERT INTO purchased_products (product_id, name, price, quantity)
       SELECT id, name, price, ?
       FROM products
       WHERE id = ?`, [quantity, productId]
    );

    await connection.commit();

    return insertResult.insertId;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    await connection.end();
  }
}

module.exports = {
  createProduct,
  getProductsByCategory,
  updateProduct,
  deleteProduct,
  getSoldProducts,
  getProducts
};