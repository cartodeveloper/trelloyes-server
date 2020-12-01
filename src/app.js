require("dotenv").config();
const { v4: uuid } = require("uuid");
const winston = require("winston");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV } = require("./config");

const app = express();

const cards = [
  {
    id: 1,
    title: "Task One",
    content: "This is card one",
  },
];
const lists = [
  {
    id: 1,
    header: "List One",
    cardIds: [1],
  },
];
const morganOption = NODE_ENV === "production" ? "tiny" : "common";
// set up winston
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: "info.log" })],
});

if (NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
app.use(morgan(morganOption));
app.use(helmet());
app.use(express.json());
app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;
  const authToken = req.get("Authorization");

  if (!authToken || authToken.split(" ")[1] !== apiToken) {
    logger.error(`Unauthorized request to path: ${req.path}`);
    return res.status(401).json({ error: "Unauthorized request" });
  }
  // move to the next middleware
  next();
});

//GET/card
app.get("/card", (req, res) => {
  res.json(cards);
});
//GET/list
app.get("/list", (req, res) => {
  res.json(lists);
});
//GET/card/dinamic ID
app.get("/card/:id", (req, res) => {
  const { id } = req.params;
  const card = cards.find((c) => c.id == id);

  // make sure we found a card
  if (!card) {
    logger.error(`Card with id ${id} not found.`);
    return res.status(404).send("Card Not Found");
  }

  res.json(card);

  //GET/list/dinamic ID
  app.get("/list/:id", (req, res) => {
    const { id } = req.params;
    const list = lists.find((li) => li.id == id);

    // make sure we found a list
    if (!list) {
      logger.error(`List with id ${id} not found.`);
      return res.status(404).send("List Not Found");
    }

    res.json(list);
  });
});

//POST/card
app.post("/card", (res, req) => {
  const { title, content } = req.body; //getting data from the body

  if (!title) {
    logger.error(`Title is required`);
    return res.status(400).send("Invalid data"); //validating title exists
  }

  if (!content) {
    logger.error(`Content is required`);
    return res.status(400).send("Invalid data"); //validating content exists
  }
  // If they exists generate an ID and push a card object into the array.
  const id = uuid();

  const card = {
    id,
    title,
    content,
  };

  cards.push(card);

  // Log the card creation and send the res with location header.
  logger.info(`Card with id ${id} created`);

  res.status(201).location(`http://localhost:8000/card/${id}`).json(card);
});

//POST/list
app.post("/list", (req, res) => {
  const { header, cardIds = [] } = req.body;

  if (!header) {
    logger.error(`Header is required`);
    return res.status(400).send("Invalid data");
  }

  // check card IDs
  if (cardIds.length > 0) {
    let valid = true;
    cardIds.forEach((cid) => {
      const card = cards.find((c) => c.id == cid);
      if (!card) {
        logger.error(`Card with id ${cid} not found in cards array.`);
        valid = false;
      }
    });

    if (!valid) {
      return res.status(400).send("Invalid data");
    }
  }

  // get an id
  const id = uuid();

  const list = {
    id,
    header,
    cardIds,
  };

  lists.push(list);

  logger.info(`List with id ${id} created`);

  res.status(201).location(`http://localhost:8000/list/${id}`).json({ id });
});

// DELETE/list
app.delete("/list/:id", (req, res) => {
  const { id } = req.params;

  const listIndex = lists.findIndex((li) => li.id == id);

  if (listIndex === -1) {
    logger.error(`List with id ${id} not found.`);
    return res.status(404).send("Not Found");
  }

  lists.splice(listIndex, 1);

  logger.info(`List with id ${id} deleted.`);
  res.status(204).end();
});

app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === "production") {
    response = { error: { message: "server error" } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

app.use(cors());

module.exports = app;
