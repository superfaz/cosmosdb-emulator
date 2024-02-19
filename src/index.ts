import fs from "node:fs";
import https from "node:https";
import app from "./app";
import { rootLogger } from "./logger";

const port = +(process.env.COSMOS_PORT ?? 8081);

https
  .createServer(
    {
      key: fs.readFileSync(".certs/key.pem"),
      cert: fs.readFileSync(".certs/cert.pem"),
    },
    app
  )
  .listen(port, () => {
    rootLogger.info(`Server running at https://localhost:${port}`);
  });
