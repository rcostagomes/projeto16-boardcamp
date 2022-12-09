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

const nameSchema = joi.object({
  name: joi.string().min(1),
});

app.get("/categories", async (req, res) => {
  const categorias = await connection.query(`SELECT * FROM categories`);
  res.send(categorias.rows);
});

app.post("/categories", async (req, res) => {
  const { name } = req.body;
  const newName = {
    name,
  };
  console.log(name);
  const validation = nameSchema.validate(newName, { abortEarly: false });
  if (validation.error) {
    const error = validation.error.details.map((d) => d.message);
    return res.status(422).send(error);
  }
  try {
    const nameExist = await connection.query(
      "SELECT * FROM categories WHERE name = $1;",
      [name]
    );
    if (nameExist.rows[0]) {
      return res.status(409).send("Categoria já existente");
    }
    await connection.query(`INSERT INTO categories (name)VALUES ($1)`, [name]);

    res.status(201).send(`Categoria ${name} Criada`);
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => console.log(`app runing in port ${port}`));
