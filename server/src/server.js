import { db, env } from "./config";
import app from "./app";
import { logger } from "./utils";
import { geoIpService } from "./services";
import { initCronJobs } from "./cron";

db.connect();
geoIpService.init();

db.connection.once("open", () => {
  initCronJobs();
})

app.listen(env.PORT, "0.0.0.0", () => {
  logger.info("Server is running on \x1b[34mhttp://localhost:%d\x1b[0m", env.PORT);
});