const jwt = require('jsonwebtoken');
const mysql = require("mysql");
const { v4: uuidv4 } = require('uuid');


const v4options = {
  random: [
    0x10, 0x91, 0x56, 0xbe, 0xc4, 0xfb, 0xc1, 0xea, 0x71, 0xb4, 0xef, 0xe1, 0x67, 0x1c, 0x58
  ],
};

// const createAdmin = async (req, res) => {
//   const { id = uuidv4(), fullname, email, pass, codeAccess } = req.body;

//   try {
//     // Configura la conexión a la base de datos MySQL
//     const connection = mysql.createConnection({
//       host: process.env.DB_HOST,
//       user: process.env.DB_USERNAME,
//       password: process.env.DB_PASSWORD,
//       database: process.env.DB_NAME,
//     });

//     // Conectar a la base de datos
//     connection.connect((err) => {
//       if (err) {
//         console.error('Error al conectar a la base de datos:', err);
//         res.status(500).json({ error: 'Error interno del servidor' });
//         return;
//       }

//       // Verificar si el email ya existe en la base de datos
//       const findEmailQuery = "SELECT COUNT(*) AS count FROM admins WHERE email = ?";
//       const findEmailValues = [email];

//       connection.query(findEmailQuery, findEmailValues, (error, results) => {
//         if (error) {
//           console.error('Error al verificar el email:', error);
//           res.status(500).json({ error: 'Ocurrió un error al verificar el email' });
//           connection.end();
//           return;
//         }

//         const emailExists = results[0].count > 0;

//         if (emailExists) {
//           console.log('El email ya se encuentra registrado');
//           res.status(400).json({ error: 'El email ya está registrado' });
//           connection.end();
//           return;
//         }

//         // Verificar si el código de acceso es válido
//         const findCodeQuery = "SELECT COUNT(*) AS count FROM admins WHERE codeAccess = ?";
//         const findCodeValues = [codeAccess];

//         connection.query(findCodeQuery, findCodeValues, (error, results) => {
//           if (error) {
//             console.error('Error al verificar el código de acceso:', error);
//             res.status(500).json({ error: 'Ocurrió un error al verificar el código de acceso' });
//             connection.end();
//             return;
//           }

//           const codeExists = results[0].count > 0;

//           if (codeAccess !== codeExists) {
//             console.log('Código de acceso inválido');
//             res.status(400).json({ error: 'Código de acceso inválido' });
//             connection.end();
//             return;
//           }

//           // Si el email no existe y el código de acceso es válido, insertar el usuario
//           const insertAdmin = `INSERT INTO admins (id, fullname, email, pass, codeAccess) VALUES (?, ?, ?, ?, ?)`;
//           const values = [id, fullname, email, pass, codeAccess];

//           connection.query(insertAdmin, values, async (error, results) => {
//             if (error) {
//               console.error('Error al insertar datos:', error);
//               res.status(500).json({ error: 'Ocurrió un error al insertar los datos' });
//               connection.end();
//               return;
//             }

//             // Generar JWT (JSON Web Token)
//             const role = 'admin';
//             const generateJwtAdm = (id, fullname, email, role) => {
//               const payload = {
//                 id,
//                 email,
//                 fullname,
//                 role
//               };
//               const secretKey = process.env.SECRET_JWT_SEED_ADM;
//               const options = {
//                 expiresIn: '2h' 
//               };
//               const token = jwt.sign(payload, secretKey, options);
//               return token;
//             };

//             const { id, fullname, email } = req.body;

//             const token = generateJwtAdm( id, fullname, email, role );

//             res.json({
//               id,
//               fullname,
//               email,
//               token,
//               role,
//             });

//             console.log(`El admin registrado correctamente es:
//               ID: ${id}
//               Email: ${email}
//               Nombre completo: ${fullname}
//               Token: ${token}
//               rol: ${role}`);
              
//             connection.end();
//           });
//         });
//       });
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ error: 'Error al inicializar la DB' });
//   }
// };
const createAdmin = async (req, res) => {
  const { id = uuidv4(), fullname, email, pass, codeAccess } = req.body;

  try {
    // Configura la conexión a la base de datos MySQL
    const connection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Conectar a la base de datos
    connection.connect((err) => {
      if (err) {
        console.error('Error al conectar a la base de datos:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
        return;
      }

      // Verificar si el email ya existe en la base de datos
      const findEmailQuery = "SELECT COUNT(*) AS count FROM admins WHERE email = ?";
      const findEmailValues = [email];

      connection.query(findEmailQuery, findEmailValues, (error, results) => {
        if (error) {
          console.error('Error al verificar el email:', error);
          res.status(500).json({ error: 'Ocurrió un error al verificar el email' });
          connection.end();
          return;
        }

        const emailExists = results[0].count > 0;

        if (emailExists) {
          console.log('El email ya se encuentra registrado');
          res.status(400).json({ error: 'El email ya está registrado' });
          connection.end();
          return;
        }

        // Verificar si el código de acceso es válido
        const findCodeQuery = "SELECT COUNT(*) AS count FROM registration_codes_admins WHERE code = ?";
        const findCodeValues = [codeAccess];

        connection.query(findCodeQuery, findCodeValues, (error, results) => {
          if (error) {
            console.error('Error al verificar el código de acceso:', error);
            res.status(500).json({ error: 'Ocurrió un error al verificar el código de acceso' });
            connection.end();
            return;
          }

          const codeExists = results[0].count > 0;

          if (!codeExists) {
            console.log('Código de acceso inválido');
            res.status(400).json({ error: 'Código de acceso inválido' });
            connection.end();
            return;
          }

          // Si el email no existe y el código de acceso es válido, insertar el usuario
          const insertAdmin = `INSERT INTO admins (id, fullname, email, pass, codeAccess) VALUES (?, ?, ?, ?, ?)`;
          const values = [id, fullname, email, pass, codeAccess];

          connection.query(insertAdmin, values, async (error, results) => {
            if (error) {
              console.error('Error al insertar datos:', error);
              res.status(500).json({ error: 'Ocurrió un error al insertar los datos' });
              connection.end();
              return;
            }

            // Generar JWT (JSON Web Token)
            const role = 'admin';
            const generateJwtAdm = (id, fullname, email, role) => {
              const payload = {
                id,
                email,
                fullname,
                role
              };
              const secretKey = process.env.SECRET_JWT_SEED_ADM;
              const options = {
                expiresIn: '2h' 
              };
              const token = jwt.sign(payload, secretKey, options);
              return token;
            };

            const token = generateJwtAdm(id, fullname, email, role);

            res.json({
              id,
              fullname,
              email,
              token,
              role,
            });

            console.log(`El admin registrado correctamente es:
              ID: ${id}
              Email: ${email}
              Nombre completo: ${fullname}
              Token: ${token}
              rol: ${role}`);
              
            connection.end();
          });
        });
      });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error al inicializar la DB' });
  }
};


const loginUserAdmin = async (req, res) => {

    const connection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
  
    
    const { email, pass,} = req.body;
    const findAdminQuery = "SELECT * FROM admins WHERE email = ?";
    const findAdminValues = [email];
  
    try {
      connection.query(findAdminQuery, findAdminValues, async (error, results) => {
        if (error) {
          console.log("Error al verificar el email: ", error);
          res.status(500).json({ error: "Ocurrió un error al verificar el email" });
          return;
        }
  
        if (results.length === 0) {
          console.log("Usuario y/o contraseña incorrecto.");
          res.status(400).json({ error: "Usuario y/o contraseña incorrecta." });
          return;
        }
  
        const admin = results[0];
  
        if (admin.pass !== pass) {
          console.log("Contraseña incorrecta.");
          res.status(400).json({ error: "Contraseña incorrecta." });
          return;
        }
  
        // json web token
        const role = 'admin';
        const generateJwtAdm = (id, fullname, email, role) => {
          const payload = {
            id,
            email,
            fullname, 
            role
          };
          const secretKey = process.env.SECRET_JWT_SEED_ADM;
          const options = {
            expiresIn: '2h' 
          };
          const token = jwt.sign(payload, secretKey, options);
          return token;
        };
  
        const { id, fullname, email } = admin;
        // console.log(id, name, email, 'desde generar jwebtokenAdm');
      
        const token = generateJwtAdm( id, fullname, email, role);
  
        // admin authentication successful
        res.json({
          ok: true,
          msg: "Login successful",
          admin: {
            id: admin.id,
            fullname: admin.fullname,
            email: admin.email,
            role,
            token,
          },
        });
        console.log(`inicio de sesión exitoso.`);
        console.log(`
        el usuario que inició sesión es.
        id: ${id} 
        y nombre: ${fullname} 
        y email: ${email} 
        rol: ${role}
        token: ${token}
        `);
  
        connection.end();
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        ok: false,
        msg: "Please contact the administrator",
      });
    }
  };

  const renewTokenAdmin = async (req, res) => {
    const role = 'admin';
    const admin = req;
    const { id, fullname, email } = admin;
    // console.log(id, name, email, 'require desde renew');
    const generateJwtAdm = (id, fullname, email, role) => {
      const payload = {
        id: admin.id,
        fullname: admin.fullname,
        email: admin.email,
        role
      };
      const secretKey = process.env.SECRET_JWT_SEED_ADM;
      const options = {
        expiresIn: '2h' 
      };
      const token = jwt.sign(payload, secretKey, options);
      return token;
    };
  
  
    
    const token = generateJwtAdm( id, fullname, email, role );
  
    res.json({
      ok: true,
      id: admin.id,
      fullname: admin.fullname,
      email: admin.email,
      role,
      token,
     
    });
  };
  
  
module.exports = {
  createAdmin,
    loginUserAdmin,
    renewTokenAdmin,
  };