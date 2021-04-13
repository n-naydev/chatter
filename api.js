const express = require("express");
const viberBot = require("./viber");
const bodyParser = require("body-parser");

const api = () => {
  app = express();
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  bot = viberBot();
  app.post("/messages", async (req, res) => {
    msg = req.body.message;
    sender = req.body.sender;
    if (sender !== undefined) {
      try {
        var r = await bot.sendMessage(sender, msg);
      } catch (err) {
        console.error(err);
      }
      res.status(200).send();
    } else {
      res
        .status(400)
        .send({ error: "'message' or 'sender' fields are missing" });
    }
    api.post("/auth", async (req, res) => {
      User.findOne({ email: req.body.email }, function (err, user) {
        if (err) return res.status(500).send("Error on the server.");
        if (!user) return res.status(404).send("No user found.");

        var passwordIsValid = bcrypt.compareSync(
          req.body.password,
          user.password
        );
        if (!passwordIsValid)
          return res.status(401).send({ auth: false, token: null });

        var token = jwt.sign({ id: user._id }, config.secret, {
          expiresIn: 86400, // expires in 24 hours
        });

        res.status(200).send({ auth: true, token: token });
      });
    });
  });

  return api;
};

module.exports = api;
