import { execSync } from "node:child_process"; execSync("npx redoc-cli bundle __REBUILD/openapi.yml --output __REBUILD/openapi.html", { stdio: "inherit" });
