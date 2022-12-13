import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";
import joi from "joi";
import dayjs from "dayjs";

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
  phone: joi.string().min(10).max(11).required(),
  cpf: joi.string().min(11).max(11),
  birthday: joi.string().isoDate().required(),
});

const rentalsSchema = joi.object({
  customerId: joi.number().min(1).required(),
  gameId: joi.number().min(1).required(),
  daysRented: joi.number().min(1).required(),
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
  const { cpf } = req.query;
  try {
    if (!cpf) {
      const customers = await connection.query(`SELECT * FROM customers`);
      res.status(200).send(customers.rows);
    }
    const customersCPF = await connection.query(
      `SELECT * FROM customers WHERE cpf ILIKE '${cpf}%'`
    );
    res.status(200).send(customersCPF.rows);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

app.get("/customers/:id", async (req, res) => {
  const { id } = req.params;
  console.log(id);

  try {
    const customerId = await connection.query(
      `SELECT * FROM customers WHERE id= $1`,
      [id]
    );
    if (!customerId.rows[0]) {
      res.status(404).send("Id do cliente não encontrado");
    }
    res.status(200).send(customerId.rows[0]);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

app.post("/customers", async (req, res) => {
  const { name, phone, cpf, birthday } = req.body;
  const newCustomer = {
    name,
    phone,
    cpf,
    birthday,
  };

  const validation = customerSchema.validate(newCustomer, {
    abortEarly: false,
  });
  if (validation.error) {
    const error = validation.error.details.map((d) => d.message);
    return res.status(422).send(error);
  }
  try {
    const cpfExist = await connection.query(
      `SELECT (cpf) FROM customers WHERE cpf = $1`,
      [cpf]
    );

    if (cpfExist.rows[0]) {
      return res.status(409).send("CPF já cadastrado");
    }

    await connection.query(
      `INSERT INTO customers (name,phone,cpf,birthday) VALUES($1,$2,$3,$4)`,
      [name, phone, cpf, birthday]
    );

    res.status(201).send("Cliente adicionado com sucesso");
  } catch (err) {
    console.log(err);
  }
});

app.put("/customers/:id", async (req, res) => {
  const { name, phone, cpf, birthday } = req.body;
  const { id } = req.params;
  console.log(id);
  const attCustomer = {
    name,
    phone,
    cpf,
    birthday,
  };

  const validation = customerSchema.validate(attCustomer, {
    abortEarly: false,
  });
  if (validation.error) {
    const error = validation.error.details.map((d) => d.message);
    return res.status(422).send(error);
  }
  try {
    const cpfExist = await connection.query(
      `SELECT (cpf) FROM customers WHERE cpf = $1`,
      [cpf]
    );

    if (cpfExist.rows[0]) {
      return res.status(409).send("CPF já cadastrado");
    }

    await connection.query(
      `UPDATE customers SET name=$1, phone=$2, cpf=$3, birthday=$4 WHERE id=${id}`,
      [name, phone, cpf, birthday]
    );

    res.status(201).send("Cliente atualizado com sucesso");
  } catch (err) {
    console.log(err);
  }
});

app.get("/rentals", async (req, res) => {
  const { customerId, gameId } = req.query;
  try {
    if (customerId) {
      const customerIdExist = await connection.query(
        `SELECT * FROM rentals WHERE "customerID" = $1`,
        [customerId]
      );
      return res.status(200).send(customerIdExist.rows);
    }

    if (gameId) {
      const gameIdExist = await connection.query(
        `SELECT * FROM rentals WHERE "gameId" = $1`,
        [gameId]
      );
      return res.status(200).send(gameIdExist.rows);
    }

    const rentals =
      await connection.query(`SELECT rentals.*, customers.id AS "idCustomer", 
    customers.name AS "nameCustomer", 
    games.id AS 
    "idGame", games.name AS "gameName", 
    games."categoryId" AS 
    "categoryIdGame", categories.name AS "categoryName" FROM rentals
      JOIN 
    customers ON rentals."customerId" = customers.id 
      JOIN 
    games ON rentals."gameId" = games.id 
      JOIN 
    categories ON games."categoryId" = categories.id;
  `);
    const allRents = rentals.rows.map((el) => {
      const {
        id,
        customerId,
        gameId,
        rentDate,
        daysRented,
        returnDate,
        originalPrice,
        delayFee,
        idCustomer,
        nameCustomer,
        idGame,
        gameName,
        categoryIdGame,
        categoryName,
      } = el;

      return {
        id: id,
        customerId: customerId,
        gameId: gameId,
        rentDate: rentDate,
        daysRented: daysRented,
        returnDate: returnDate,
        originalPrice: originalPrice,
        delayFee: delayFee,
        customer: {
          id: idCustomer,
          name: nameCustomer,
        },
        game: {
          id: idGame,
          name: gameName,
          categoryId: categoryIdGame,
          categoryName: categoryName,
        },
      };
    });

    res.status(200).send(allRents);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

app.post("/rentals", async (req, res) => {
  const { customerId, gameId, daysRented } = req.body;
  const now = dayjs().format("YYYY-MM-DD");
  const newRentals = {
    customerId,
    gameId,
    daysRented,
  };
  const validation = rentalsSchema.validate(newRentals, { abortEarly: false });
  if (validation.error) {
    const error = validation.error.details.map((d) => d.message);
    return res.status(422).send(error);
  }

  try {
    const pricePerDay = await connection.query(
      `SELECT "pricePerDay" FROM games WHERE id=$1`,
      [gameId]
    );
    console.log("pricePerDay", pricePerDay.rows[0]);

    const originalPrice = pricePerDay.rows[0].pricePerDay * daysRented;
    console.log("originalPrice", originalPrice);

    const customerExist = await connection.query(
      `SELECT (id) FROM customers WHERE id=$1`,
      [customerId]
    );

    if (!customerExist.rows[0]) {
      return res.status(400).send("Cliente não existente");
    }

    const gameExist = await connection.query(
      `SELECT (id) FROM games WHERE id=$1`,
      [gameId]
    );

    if (!gameExist.rows[0]) {
      return res.status(400).send("Jogo não encontrado");
    }

    if (daysRented <= 1) {
      console.log(daysRented);
      return res.sendStatus(400);
    }
    const teste = await connection.query(
      `INSERT INTO 
    rentals 
    ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee") 
      VALUES($1, $2, $3, $4, $5, $6, $7)
    `,
      [customerId, gameId, now, daysRented, null, originalPrice, null]
    );
    res.status(201).send("Aluguel inserido");
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.post("/rentals/:id/return", async (req, res) => {
  const id = parseInt(req.params.id);
  const time = new Date();

  try {
    const rental = await connection.query(
      `SELECT rentals.*, games."pricePerDay" 
    FROM 
    rentals 
    JOIN games 
    ON rentals."gameId" = games.id 
    WHERE rentals.id=$1`,
      [id]
    );
    if (rental.rows.length === 0) {
      return res.sendStatus(404);
    }
    if (rental.rows[0].returnDate !== null) {
      return res.sendStatus(400);
    }

    const delivery = rental.rows[0].rentDate;
    const diff = Math.abs(time.getTime() - delivery.getTime());
    const Days = Math.ceil(diff / (1000 * 3600 * 24));

    if (Days > rental.rows[0].daysRented) {
      const newDelayFee =
        Days * rental.rows[0].pricePerDay +
        rental.rows[0].originalPrice;
      await connection.query(
        `UPDATE rentals SET "returnDate"=$1, "delayFee"=$2, WHERE id=$3`,
        [time, newDelayFee, id]
      );
    }

    await connection.query(
      `UPDATE rentals SET "returnDate"=$1, "delayFee"=$2 WHERE id=$3`,
      [time, null, id]
    );
    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});


app.listen(port, () => console.log(`app runing in port ${port}`));
