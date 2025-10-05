import express from "express";
import cors from "cors";
import path from "path";
import { iniciarLoginAutomático, pesquisarPorRG } from "./services/browserService.js";

const app = express();
app.use(cors());
app.use(express.json());

// --- Rotas da API ---

// Inicializa login e página de pesquisa
app.get("/api/init", async (req, res) => {
  const resultado = await iniciarLoginAutomático();
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

// Caminho absoluto da pasta do build do React
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "../frontend/dist"))); // ou "build" se você gerar build em "build"

// Redirecionar todas as rotas não-API para index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// --- Iniciar servidor ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
