const { response } = require("express")
const axios = require("axios");

const WORLD_ID_VERIFICATION_URL = "https://developer.worldcoin.org/api/v1/verify";
const ACTION_ID = "clients_annon_vote"; // Reemplaza con tu ID de acción
const API_KEY = "api_a2V5XzkwZmI3Y2I3MGFlNjNkNzgxZjdmMWM4MmZiODBhYzFiOnNrX2I0OTNkZTYwNTIzMzQxZDkwMjcxY2RiYjEzMzA3NDc1YzI0YTM0NzgzODFmZTgyYg"; // Reemplaza con tu API Key de Worldcoin



const verifyWorldId = async (req, res) => {
  const { proof, signal } = req.body;

  try {
    const response = await axios.post(WORLD_ID_VERIFICATION_URL, {
      action_id: ACTION_ID,
      proof,
      signal,
    }, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    const isValid = response.data.success;

    if (isValid) {
      return res.json({
        success: true,
        user: { name: "Usuario Ejemplo" }, // Aquí puedes retornar datos reales del usuario
      });
    } else {
      return res.json({ success: false, message: response.data.message || "Token inválido." });
    }
  } catch (error) {
    console.error("Error en la verificación:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
};

  module.exports = {
    verifyWorldId
  };