import { db, env } from "./config";
import app from "./app";
import { logger } from "./utils";
import { geoIpService } from "./services";

db.connect();
geoIpService.init();

app.listen(env.PORT, "0.0.0.0", () => {
  logger.info("Server is running on \x1b[34mhttp://localhost:%d\x1b[0m", env.PORT);
});