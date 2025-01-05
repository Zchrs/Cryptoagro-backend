/* 
    rutas de usuarios / auth
    host + /api/auth
*/

const { Router } = require("express");
const { check } = require("express-validator");
const { validateFields } = require("../middlewares/validate-form-data");
const { createUser, renewToken, loginUser, verifyUser, verifyToken } = require("../controllers/auth");
const { validateJwt } = require("../middlewares/validate-jwt");


const router = Router();

router.post(
  "/register",
  [
    check("name", "Name is required").not().isEmpty(),
    check("lastname", "Last name is required").not().isEmpty(),
    check("country", "Country is required").not().isEmpty(),
    check("phone", "phone is required").not().isEmpty(),
    check("email", "Email is required").isEmail(),
    check("password", "Password is required").isLength({ min: 7 }),

    validateFields,
  ],
  createUser
);

router.post(
  "/login",
  [
    check("email", "Email is required").isEmail(),
    check("password", "Password is required").not().isEmpty(),

    validateFields,
  ],
  loginUser
);

router.get('/verify/:token', verifyUser);

router.get("/renew", validateJwt , renewToken);

router.post('/verify', verifyToken );

module.exports = router;
