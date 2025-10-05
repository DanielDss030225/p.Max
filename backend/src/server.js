import express from "express";
import cors from "cors";
import { iniciarLoginAutomático, pesquisarPorRG } from "./services/browserService.js";

const app = express();
app.use(cors());
app.use(express.json());

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

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));
