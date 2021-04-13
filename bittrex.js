const opts = require("./config").bittrexOpts;
const client = require("node-bittrex-api");

const Bittrex = () => {
  client.options({
    apikey: process.env.BITTREX_KEY,
    apisecret: process.env.BITTREX_SECRET,
    ...opts,
  });

  const getSinlgeBalanceStr = (balance, markets) => {
    var bal = Number.parseFloat(balance.Balance).toFixed(3);
    var btcLast = markets["USD-BTC"].Last;
    if (balance.Currency != "BTC") {
      var marketName = `BTC-${balance.Currency}`;
      if (markets[marketName] === undefined || balance.Balance === 0) return;
      var marketLast = markets[marketName].Last;
      var btcP = Number.parseFloat(marketLast).toFixed(8);
      var usdP = Number.parseFloat(marketLast * btcLast).toFixed(3);
      var btcV = Number.parseFloat(balance.Balance * marketLast).toFixed(3);
      var usdV = Number.parseFloat(
        balance.Balance * marketLast * btcLast
      ).toFixed(3);
      return (
        `Currency: ${balance.Currency}\n` +
        `Balance: ${bal}\n` +
        `BTC price: ${btcP}  |  USD price: ${usdP}\n` +
        `BTC value: ${btcV}           |  USD value: ${usdV}`
      );
    } else {
      var usdP = Number.parseFloat(btcLast).toFixed(3);
      var usdV = Number.parseFloat(balance.Balance * btcLast).toFixed(3);
      return (
        `Currency: BTC\nBalance: ${bal}\n` +
        `USD price: ${usdP}\nUSD value: ${usdV}`
      );
    }
  };

  const getBalance = async (...currencies) => {
    if (currencies.length) {
      var currNames = {};
      for (var c of currencies) {
        currNames[c.toUpperCase()] = true;
      }
    }
    var markets = await getAllMarkets();
    return new Promise((resolve, reject) => {
      client.getbalances((data, err) => {
        if (data) {
          resolve({
            data: data,
            toString: () => {
              var str = "";
              if (err) {
                return console.error(err);
              }
              for (var curr of data.result) {
                if (!currencies.length || currNames[curr.Currency]) {
                  var currText = getSinlgeBalanceStr(curr, markets);
                  str += currText !== undefined ? currText + " \n---\n" : "";
                }
              }
              return str;
            },
          });
        } else if (err) {
          reject(err);
        }
      });
    });
  };

  const getUSDBTC = async () => {
    return new Promise((resolve, reject) => {
      client.getmarketsummary({ market: "USD-BTC" }, (data, err) => {
        if (data) {
          resolve(data.result[0]);
        } else if (err) {
          reject(err);
        }
      });
    });
  };

  const getMarketSummaries = async () => {
    return new Promise((resolve, reject) => {
      var marketSummaries = {};
      client.getmarketsummaries((data, err) => {
        if (data && data.result) {
          for (var r of data.result) {
            marketSummaries[r.MarketName] = r;
          }
          resolve(marketSummaries);
        } else if (err) {
          reject(err);
        }
      });
    });
  };

  const getAllMarkets = async () => {
    var allMarketSummaries = await getMarketSummaries();
    var USD_BTC = await getUSDBTC();
    return new Promise((resolve, reject) => {
      client.getbalances((data, err) => {
        if (data) {
          var markets = {};
          for (var curr of data.result) {
            var marketName =
              curr.Currency != "BTC" ? `BTC-${curr.Currency}` : "BTC";
            if (allMarketSummaries[marketName] != undefined) {
              markets[marketName] = allMarketSummaries[marketName];
            }
          }
          markets["USD-BTC"] = USD_BTC;
          resolve(markets);
        } else if (err) {
          reject(err);
        }
      });
    });
  };

  const getPortfolioValue = async (...args) => {
    var markets = await getAllMarkets();
    return new Promise((resolve, reject) => {
      client.getbalances((data, err) => {
        if (data) {
          resolve({
            data: data,
            toString: () => {
              var total = {
                BTC: 0,
                USD: 0,
              };
              for (var curr of data.result) {
                if (curr.Currency != "BTC") {
                  var market = markets[`BTC-${curr.Currency}`];
                  if (market !== undefined) {
                    total.BTC += curr.Balance * market.Last;
                  }
                } else {
                  total.BTC += curr.Balance;
                }
              }
              total.USD = total.BTC * markets["USD-BTC"].Last;
              var btcT = Number.parseFloat(total.BTC).toFixed(3);
              var usdT = Number.parseFloat(total.USD).toFixed(3);
              return `BTC: ${btcT}\nUSD: ${usdT}`;
            },
          });
        } else if (err) {
          reject(err);
        }
      });
    });
  };

  return {
    client: client,
    getBalance: getBalance,
    getUSDBTC: getUSDBTC,
    getMarketSummaries: getMarketSummaries,
    getAllMarkets: getAllMarkets,
    getPortfolioValue: getPortfolioValue,
  };
};

module.exports = Bittrex;
