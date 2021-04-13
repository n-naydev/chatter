"use strict";

const { Bot, Events, Message } = require("viber-bot");
const TextMessage = Message.Text;

const winston = require("winston");
const toYAML = require("winston-console-formatter");
const { profiles, botProfile } = require("./config");
const bittrex = require("./bittrex");

var viberBot = undefined;

const ViberBot = () => {
  if (viberBot !== undefined) {
    return viberBot;
  }
  const btrx = bittrex();

  const allowedMethods = {
    balance: btrx.getBalance,
    portfolio: btrx.getPortfolioValue,
  };

  const execute = async (func, ...args) => {
    if (allowedMethods[func] !== undefined) {
      return await allowedMethods[func](...args);
    }
    return "No such function";
  };

  const createLogger = () => {
    const logger = new winston.Logger({
      level: "debug",
    });

    logger.add(winston.transports.Console, toYAML.config());
    return logger;
  };

  const say = (response, message) => {
    response.send(new TextMessage(message));
  };

  const handleMessage = async (botResponse, messageText) => {
    if (messageText === "") {
      say(botResponse, "I need a URL to check");
      return;
    }

    say(botResponse, "One second...Let me check!");

    var args = messageText.split(" ");

    var response = await execute(...args);
    console.log("" + response);
    var responseText = response.toString();

    say(botResponse, responseText);
  };

  const sendMessage = (sender, messageText) => {
    msg = new TextMessage(messageText);
    return bot.sendMessage({ id: botProfile }, msg, null, null);
  };

  const logger = createLogger();

  if (!process.env.VIBER_PUBLIC_ACCOUNT_ACCESS_TOKEN_KEY) {
    logger.debug("Viber account access token key not configured.");
    return;
  }

  const bot = new Bot(logger, {
    authToken: process.env.VIBER_PUBLIC_ACCOUNT_ACCESS_TOKEN_KEY,
    name: "Crypter",
    avatar:
      "https://raw.githubusercontent.com/devrelv/drop/master/151-icon.png",
  });

  bot.onSubscribe((response) => {
    say(response, "Hi there ${response.userProfile.name}. I am ${bot.name}!");
  });

  bot.on(Events.MESSAGE_RECEIVED, (message, response) => {
    if (!(message instanceof TextMessage)) {
      say(response, "Only text messages are handles.");
    }
  });

  bot.onTextMessage(/./, (message, response) => {
    if (profiles[response.userProfile.id]) {
      handleMessage(response, message.text);
    }
  });

  bot.setWebhook(process.env.URL);

  viberBot = {
    middleware: bot.middleware(),
    sendMessage: sendMessage,
  };

  return viberBot;
};

module.exports = ViberBot;
