import { Router } from "express";
import { preencherSite } from "../services/browserService.js";

const router = Router();

// rota que recebe os dados do frontend e usa o Puppeteer
router.post("/", async (req, res) => {
  const { nome, email, senha } = req.body;

  const resposta = await preencherSite({ nome, email, senha });

  res.json(resposta);
});

export default router;
