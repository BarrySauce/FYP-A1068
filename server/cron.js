const cron = require("node-cron");
const relay = require("./relay");

cron.schedule('* * * * *', () => {
  
  relay.operate();
});
