import express from "express";
import cors from "cors";
import { iniciarLoginAutomático, pesquisarPorRG } from "./services/browserService.js";

const app = express();

// CORS para permitir frontend no GitHub Pages
app.use(cors({
  origin: "https://DanielDss030225.github.io",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "x-usuario", "x-senha"]
}));

app.use(express.json());

// --- Rotas da API ---
app.get("/api/init", async (req, res) => {
  const usuario = req.headers["x-usuario"];
  const senha = req.headers["x-senha"];

  if (!usuario || !senha) {
    return res.json({ sucesso: false, mensagem: "Informe usuário e senha." });
  }

  try {
    const resultado = await iniciarLoginAutomático(usuario, senha);
    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor." });
  }
});

app.post("/api/pesquisar", async (req, res) => {
  const { rg } = req.body;
  if (!rg) return res.json({ sucesso: false, mensagem: "Informe o RG" });

  try {
    const resultado = await pesquisarPorRG(rg);
    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor." });
  }
});

// Teste rápido da API
app.get("/", (req, res) => {
  res.send("Backend rodando corretamente!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
