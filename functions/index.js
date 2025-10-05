/**
 * Firebase Functions index.js pronto para deploy
 */

const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

// Configuração global
setGlobalOptions({ maxInstances: 10 });

// Exemplo de função HTTP
exports.helloWorld = onRequest((req, res) => {
  logger.info("Hello logs!", { structuredData: true });
  res.send("Hello from Firebase!");
});
