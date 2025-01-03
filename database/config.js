const mysql = require("mysql");
const mysqls = require("mysql2/promise");

exports.connectionDB = async () =>{
 
    try {
        mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
          });
          console.log('DB connected successfully');
    } catch (error) {
        console.log(error);
        throw new Error('Error al inicializar la DB');
    }
};
exports.connection = async () =>{
 
    try {
        mysqls.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0
          });
          console.log('DB connected successfully');
    } catch (error) {
        console.log(error);
        throw new Error('Error al inicializar la DB');
    }
};