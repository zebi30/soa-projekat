const app = require("./app");
const env = require("./config/env");

app.listen(env.PORT, () => {
  console.log(`Authorization service is running on port ${env.PORT}.`);
});
