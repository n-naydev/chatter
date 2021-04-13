"use strict";

require("dotenv").config();

const http = require("http");
const express = require("express");
const viberBot = require("./viber");

const port = process.env.PORT || 8000;
const app = express();

app.use("/viber", viberBot().middleware);

var httpServer = http.createServer(app);

httpServer.listen(port);

module.exports = httpServer;
