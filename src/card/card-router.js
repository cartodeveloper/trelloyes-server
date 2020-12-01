const express = require("express");
const { v4: uuid } = require("uuid");
const logger = require("../logger");
const cardRouter = express.Router();
const bodyParser = express.json();
const cards = [
  {
    id: 1,
    title: "Task One",
    content: "This is card one",
  },
];

cardRouter
  .route("/card")
  .get((req, res) => {
    res.json(cards);
  })
  .post(bodyParser, (req, res) => {
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

    res.json(cards);
  });

cardRouter
  .route("/card/:id")
  .get((req, res) => {
    // move implementation logic into here
  })
  .delete((req, res) => {
    // move implementation logic into here
  });

module.exports = cardRouter;
