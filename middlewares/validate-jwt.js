const express = require("express");
const jwt = require("jsonwebtoken");

const validateJwt = ( req, res, next )=>{
    const token = req.header('x-token');
   
    if ( !token ) {
        return res.status(401).json({
            ok: false,
            msg: 'No hay token de usuario'
        });
    }

    try {
        const { id, email, name, lastname, role = 'user' } = jwt.verify(
            token,
            process.env.SECRET_JWT_SEED,
        )
        req.id = id;
        req.email = email;
        req.name = name;
        req.lastname = lastname;
        req.role = role;
    } catch (error) {
        return res.status(401).json({
            ok: false,
            msg: 'Token de usuario no válido'
        });
    }

    next();
}

const validateJwtAdmin = ( req, res, next )=>{
  const token = req.header('x-token');
 
  if ( !token ) {
      return res.status(401).json({
          ok: false,
          msg: 'No hay token de admin'
      });
  }

  try {
      const { id, email, fullname, role = 'admin' } = jwt.verify(
          token,
          process.env.SECRET_JWT_SEED_ADM,
      )
      req.id = id;
      req.email = email;
      req.fullname = fullname;
      req.role = role;
  } catch (error) {
      return res.status(401).json({
          ok: false,
          msg: 'Token de admin no válido'
      });
  }

  next();
}
const validateJwtasesor = ( req, res, next )=>{
  const token = req.header('x-token');
 
  if ( !token ) {
      return res.status(401).json({
          ok: false,
          msg: 'No hay token de asesor'
      });
  }

  try {
      const { id, email, fullname, role = 'asesor' } = jwt.verify(
          token,
          process.env.SECRET_JWT_SEED_ADM,
      )
      req.id = id;
      req.email = email;
      req.fullname = fullname;
      req.role = role;
  } catch (error) {
      return res.status(401).json({
          ok: false,
          msg: 'Token de admin no válido'
      });
  }

  next();
}

module.exports = {
    validateJwt,
    validateJwtAdmin,
    validateJwtasesor
};
