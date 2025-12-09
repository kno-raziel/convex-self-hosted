import { stageDomain } from "../utils";
import { dns } from "./shared";

// basic auth https://github.com/sst/sst/blob/dev/examples/aws-static-site-basic-auth/sst.config.ts
const username = new sst.Secret("USERNAME", "kno");
const password = new sst.Secret("PASSWORD", "onk");
const basicAuth = $resolve([username.value, password.value]).apply(
  ([username, password]) =>
    Buffer.from(`${username}:${password}`).toString("base64"),
);

const site = new sst.aws.StaticSite("Site", {
  dev: {
    command: "bun run dev:vite",
    url: "http://127.0.0.1:3000",
  },
  build: {
    command: "bun run build",
    output: "./dist",
  },
  environment: {
    VITE_CONVEX_URL: $dev
      ? "http://127.0.0.1:3210"
      : $interpolate`https://convex-api.${stageDomain}`,
    VITE_CONVEX_SITE_URL: $dev
      ? "http://127.0.0.1:3211"
      : $interpolate`https://convex.${stageDomain}`,
    SITE_URL: $dev ? "http://127.0.0.1" : $interpolate`https://${stageDomain}`,
  },
  domain: {
    name: `${stageDomain}`,
    dns,
  },
  edge:
    $app.stage !== "prod" && !$dev
      ? {
          viewerRequest: {
            injection: $interpolate`
              if (
                  !event.request.headers.authorization
                    || event.request.headers.authorization.value !== "Basic ${basicAuth}"
                 ) {
                return {
                  statusCode: 401,
                  headers: {
                    "www-authenticate": { value: "Basic" }
                  }
                };
              }`,
          },
        }
      : undefined,
});

export const siteUrl = $dev ? "http://127.0.0.1:3000" : site.url;
