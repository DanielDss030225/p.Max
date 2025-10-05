import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import formRoutes from "./routes/formRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Backend funcionando 🚀"));

// rotas
app.use("/api/users", userRoutes);
app.use("/api/form", formRoutes);

export default app;

