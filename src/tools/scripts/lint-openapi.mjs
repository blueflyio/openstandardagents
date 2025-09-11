import { execSync } from "node:child_process"; execSync("npx @redocly/openapi-cli lint __REBUILD/openapi.yml", { stdio: "inherit" });
