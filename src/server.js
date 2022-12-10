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
  name: joi.string().min(1).required(),
});

const gameSchema = joi.object({
  name: joi.string().min(1).required(),
  image: joi.string().required(),
  stockTotal: joi.number().integer().min(1).required(),
  categoryId: joi.number().integer().min(1).required(),
  pricePerDay: joi.number().required(),
});

const customerSchema = joi.object({
  name: joi.string().min(1).required(),
  phone: joi.number().min(11).required(),
  cpf: joi.string().min(10).required(),
  birthday: joi.number(),
});
app.get("/categories", async (req, res) => {
  try {
    const categories = await connection.query(`SELECT * FROM categories`);
    res.send(categories.rows);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

app.post("/categories", async (req, res) => {
  const { name } = req.body;
  const newCategory = {
    name,
  };
  const validation = nameSchema.validate(newCategory, { abortEarly: false });
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
    return res.sendStatus(500);
  }
});

app.get("/games", async (req, res) => {
  try {
    const games = await connection.query(`SELECT * FROM games`);
    res.send(games.rows);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

app.post("/games", async (req, res) => {
  const { name, image, stockTotal, categoryId, pricePerDay } = req.body;
  const newGame = {
    name,
    image,
    stockTotal,
    categoryId,
    pricePerDay,
  };

  const validation = gameSchema.validate(newGame, { abortEarly: false });
  if (validation.error) {
    const error = validation.error.details.map((d) => d.message);
    return res.status(422).send(error);
  }
  try {
    const idExist = await connection.query(
      `SELECT * FROM categories WHERE id =$1`,
      [categoryId]
    );
    if (!idExist.rows[0]) {
      return res.status(400).send("Categoria não existente");
    }
    const gameExist = await connection.query(
      `SELECT * FROM games WHERE name = $1`,
      [name]
    );

    if (gameExist.rows[0]) {
      return res.status(409).send("Jogo já cadastrado");
    }

    await connection.query(
      `INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5)`,
      [name, image, stockTotal, categoryId, pricePerDay]
    );
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
  res.status(201).send(`${name} cadastrado com sucesso`);
});

app.get("/customers", async (req, res) => {
  try {
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});
app.listen(port, () => console.log(`app runing in port ${port}`));
