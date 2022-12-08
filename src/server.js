import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";
import joi from "joi";

const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

const port = process.env.PORT || 4000;
const { Pool } = pkg;

const connection = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get("/categories", async (req, res) => {
  const categorias = await connection.query(`SELECT * FROM categories`);
  res.send(categorias.rows);
});

app.listen(port, () => console.log(`app runing in port ${port}`));
