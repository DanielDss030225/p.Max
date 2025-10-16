import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json([
    { id: 1, nome: "Daniel" },
    { id: 2, nome: "Maria" }
  ]);
});

export default router;
