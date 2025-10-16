import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { iniciarLoginAutomático, pesquisarPorRG } from "./services/browserService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// --- Rotas da API ---

app.get("/api/init", async (req, res) => {
  const usuario = req.headers["x-usuario"];
  const senha = req.headers["x-senha"];

  if (!usuario || !senha) {
    return res.json({ sucesso: false, mensagem: "Informe usuário e senha." });
  }

  const resultado = await iniciarLoginAutomático(usuario, senha);
  res.json(resultado);
});



// Pesquisa por RG
app.post("/api/pesquisar", async (req, res) => {
  const { rg } = req.body;
  if (!rg) return res.json({ sucesso: false, mensagem: "Informe o RG" });

  const resultado = await pesquisarPorRG(rg);
  res.json(resultado);
});



// --- Servir o React Build ---

// Express vai servir arquivos estáticos do build do React
//const reactBuildPath = path.join(__dirname, "../frontend/build"); // ou "../frontend/build" se usar "build"
//app.use(express.static(reactBuildPath));

// Redireciona todas as rotas não-API para index.html
//app.get("*", (req, res) => {
 // res.sendFile(path.join(reactBuildPath, "index.html"));
//});

// --- Iniciar servidor ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
