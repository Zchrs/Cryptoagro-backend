const {response} = require("express");
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mysqls = require("mysql2/promise");
const mysql = require("mysql");
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const axios = require("axios");

const WORLD_ID_VERIFICATION_URL = "https://developer.worldcoin.org/api/v1/verify";
const ACTION_ID = "app_90011ccc0672edaf8c7437d18ef8e619"; // Reemplaza con tu ID de acción
const API_KEY = "api_a2V5XzkwZmI3Y2I3MGFlNjNkNzgxZjdmMWM4MmZiODBhYzFiOnNrX2I0OTNkZTYwNTIzMzQxZDkwMjcxY2RiYjEzMzA3NDc1YzI0YTM0NzgzODFmZTgyYg"; // Reemplaza con tu API Key de Worldcoin

const v4options = {
  random: [
    0x10, 0x91, 0x56, 0xbe, 0xc4, 0xfb, 0xc1, 0xea, 0x71, 0xb4, 0xef, 0xe1, 0x67, 0x1c, 0x58
  ],
};
// Crear usuarios

// const createUser = async (req, res) => {
  
//   const { id = uuidv4(v4options.random), country, name, lastname, email, pass } = req.body;

//   try {
//     // Configura la conexión a la base de datos MySQL
//     const connection = mysql.createConnection({
//       host: process.env.DB_HOST,
//       user: process.env.DB_USERNAME,
//       password: process.env.DB_PASSWORD,
//       database: process.env.DB_NAME,
//     });

//     const verificationToken = crypto.randomBytes(32).toString('hex');

//     // Verificar si el email ya existe en la base de datos
//     const findEmailQuery = "SELECT COUNT(*) AS count FROM users WHERE email = ?";
//     const findEmailValues = [email];

//     connection.query(findEmailQuery, findEmailValues, (error, results) => {
//       if (error) {
//         console.log("Error al verificar el email: ", error);
//         res.status(500).json({ error: "Ocurrió un error al verificar el email" });
//         return;
//       }

//       const emailExists = results[0].count > 0;

//       if (emailExists) {
//         console.log("El email ya se encuentra registrado")
//         res.status(400).json({ error: "El email ya está registrado" });
//         return;
//       }

//       // Si el email no existe, usuario listo para grabar
//         const insertUser = `INSERT INTO users (id, country, name, lastname, email, pass) 
//           VALUES (?, ?, ?, ?, ?, ?)`;
        
       

//         const values = [
//           id,
//           country,
//           name,
//           lastname,
//           email,
//           pass,
//         ];
//         // usuario grabado con exito a menos que haya algún error de conexión
//         connection.query(insertUser, values, async (error, results) => {
//           if (error) {
//             console.error("Error al insertar datos: ", error);
//             console.log(error);
//             res
//               .status(500)
//               .json({ error: "Ocurrió un error al insertar los datos"
//              });
//             return;
//           }

//           // const insertedId = results.insertId;
//           // console.log("ID del usuario insertado:", insertedId);

//           // Generar JWT (JSON WEB Tokens)
//           const role = 'user';
//           const generateJwt = (id, name, lastname, email, role) => {
//             const payload = {
//               id,
//               name,
//               lastname,
//               email,
//               role
//             };
//             const secretKey = process.env.SECRET_JWT_SEED;
//             const options = {
//               expiresIn: '2h' 
//             };
//             const token = jwt.sign(payload, secretKey, options);
//             return token;
//           };

//           const { id, name, lastname, email } = req.body;

//           const token = generateJwt( id, name, lastname, email, role );
        
//           res.json({
//             id,
//             country,
//             name,
//             lastname,
//             email,
//             pass,
//             role,
//             token
//           });
//           console.log(`
//           el usuario registrado correctamente es.
//           id: ${id} 
//           y email: ${email} 
//           y nombre: ${name} 
//           y apellido: ${lastname} 
//           y el token es: ${token}
//           rol: ${role}
//           `);
//           connection.end();
//         });
//     });
//   } catch (error) {
//     console.log(error);
//     throw new Error("Error al inicializar la DB");
//   }
// };

const createUser = async (req, res) => {
  const { id = uuidv4(v4options.random), country, name, lastname, email, pass = bcrypt(pass) } = req.body;

  try {
    // Configuración de la conexión a la base de datos MySQL
    const connection = await mysqls.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Verificar si el email ya existe en la base de datos
    const [emailResult] = await connection.execute(
      "SELECT COUNT(*) AS count FROM users WHERE email = ?",
      [email]
    );

    if (emailResult[0].count > 0) {
      console.log("El email ya se encuentra registrado");
      res.status(400).json({ error: "El email ya está registrado" });
      return;
    }

    // Si el email no existe, insertar el nuevo usuario
    const insertUserQuery = `INSERT INTO users (id, country, name, lastname, email, pass, verificationToken) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const [result] = await connection.execute(insertUserQuery, [
      id,
      country,
      name,
      lastname,
      email,
      pass,
      verificationToken,
    ]);

    if (result.affectedRows > 0) {
      // Configurar transporte con servidor SMTP propio
      const transporter = nodemailer.createTransport({
        host: "smtp.hostinger.com", // Cambia esto por el host de tu servidor SMTP
        port: 465, // Puerto de tu servidor SMTP, por lo general 465 para SSL o 587 para TLS
        secure: true, // true para SSL, false para TLS
        auth: {
          user: process.env.EMAIL_SENDER_TO_VERIFY, // Cambia esto por tu email
          pass: process.env.EMAIL_PASSWORD, // Cambia esto por tu contraseña
        },
      });

      const mailBody = {
        from: "soporte@mueblesjireh.com", // Cambia esto por tu email y nombre
        to: email,
        subject: 'Verifica tu correo electrónico siguiendo el siguiente enlace:',
        text: `Click the following link to verify your email: http://localhost:8000/api/users/verify/${verificationToken}`,
      };

      await transporter.sendMail(mailBody);

      // Generar JWT (JSON WEB Tokens)
      const role = 'user';
      const generateJwt = (id, name, lastname, email, role) => {
        const payload = {
          id,
          name,
          lastname,
          email,
          role,
        };
        const secretKey = process.env.SECRET_JWT_SEED;
        const options = {
          expiresIn: '2h',
        };
        const token = jwt.sign(payload, secretKey, options);
        return token;
      };

      const token = generateJwt(id, name, lastname, email, role);

      res.status(201).json({
        id,
        country,
        name,
        lastname,
        email,
        pass,
        role,
        token,
        message: 'User registered. Please verify your email.',
      });

      console.log(`
        Usuario registrado correctamente:
        ID: ${id}
        Email: ${email}
        Nombre: ${name}
        Apellido: ${lastname}
        Token: ${token}
        Rol: ${role}
      `);
    } else {
      res.status(500).json({ error: "Error al registrar el usuario" });
    }

    await connection.end();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Ocurrió un error al procesar la solicitud" });
  }
};

const verifyUser = async (req, res) => {
  const { token } = req.params;

  try {
    const [rows] = await connection.query(
      'SELECT * FROM users WHERE verificationToken = ?',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid token or user already verified.' });
    }

    await connection.query(
      'UPDATE users SET isVerified = 1, verificationToken = NULL WHERE verificationToken = ?',
      [token]
    );

    res.status(200).json({ message: 'User verified successfully.' });
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const loginUser = async (req, res) => {

  const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  
  const { email, pass,} = req.body;
  const findUserQuery = "SELECT * FROM users WHERE email = ?";
  const findUserValues = [email];

  try {
    connection.query(findUserQuery, findUserValues, async (error, results) => {
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

      const user = results[0];

      if (user.pass !== pass) {
        console.log("Contraseña incorrecta.");
        res.status(400).json({ error: "Contraseña incorrecta." });
        return;
      }

      // json web token
      const role = 'user';
      const generateJwt = (id, name, lastname, email, role) => {
        const payload = {
          id,
          email,
          name,
          lastname,
          role
        };
        const secretKey = process.env.SECRET_JWT_SEED;
        const options = {
          expiresIn: '2h' 
        };
        const token = jwt.sign(payload, secretKey, options);
        return token;
      };

      const { id, name, lastname, email } = user;
      // console.log(id, name, email, 'desde generar jwebtoken');

      const token = generateJwt( id, name, lastname, email, role);

      // User authentication successful
      res.json({
        ok: true,
        msg: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          lastname: user.lastname,
          role,
          token
        },
      });
      console.log(`inicio de sesión exitoso.`);
      console.log(`
      el usuario que inició sesión es.
      id: ${id} 
      y nombre: ${name} 
      y apellido: ${lastname}
      y email: ${email} 
      rol: ${role}
      y el token es: ${token}
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


const renewToken = async (req, res) => {
  const role = 'user';
  const user = req;
  const { id, name, lastname, email } = user;
  // console.log(id, name, email, 'require desde renew');
  const generateJwt = (id, name, lastname, email, role) => {
    const payload = {
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      email: user.email,
      role
    };
    const secretKey = process.env.SECRET_JWT_SEED;
    const options = {
      expiresIn: '2h' 
    };
    const token = jwt.sign(payload, secretKey, options);
    return token;
  };

  const token = generateJwt( id, name, lastname, email, role );

  res.json({
    ok: true,
    id: user.id,
    name: user.name,
    email: user.email,
    lastname: user.lastname,
    role,
    token
  });
};

const verifyWorldId = async (req, res) => {
  const { verificationToken, signal } = req.body;

  try {
    const response = await axios.post(
      WORLD_ID_VERIFICATION_URL,
      {
        verification_token: verificationToken,
        action_id: ACTION_ID,
        signal,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    if (response.data.success) {
      return res.status(200).json({ success: true, message: "Verification successful" });
    } else {
      return res.status(400).json({ success: false, message: "Verification failed" });
    }
  } catch (error) {
    console.error("Error verifying with World ID:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  createUser,
  loginUser,
  verifyUser,
  renewToken,
  verifyWorldId
};