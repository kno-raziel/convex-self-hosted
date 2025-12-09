import { REGION } from "../../constants";
import { INSTANCE_NAME, INSTANCE_SECRET } from "./shared";
import { stageDomain } from "../utils";
import { database } from "./database";
import {
  exportsBucket,
  filesBucket,
  modulesBucket,
  searchBucket,
  snapshotImportsBucket,
} from "./s3Storage";
import { cluster, dns } from "./shared";
import { convexUserAccessKey } from "./user";

export const convex = new sst.aws.Service("Convex", {
  cluster,
  image: "ghcr.io/get-convex/convex-backend:latest",
  cpu: "0.5 vCPU",
  memory: "1 GB",
  scaling: {
    min: 1,
    max: 1,
  },
  link: [
    database,
    exportsBucket,
    snapshotImportsBucket,
    modulesBucket,
    filesBucket,
    searchBucket,
  ],
  health: {
    command: ["curl", "-f", "http://localhost:3210/version"],
    startPeriod: "10 seconds",
    timeout: "10 seconds",
    interval: "1 minute",
    retries: 3,
  },
  loadBalancer: {
    domain: {
      name: `convex.${stageDomain}`,
      aliases: [`convex-api.${stageDomain}`],
      dns,
    },
    health: {
      "3210/http": {
        path: "/version",
        interval: "1 minute",
        timeout: "10 seconds",
      },
    },
    rules: [
      {
        listen: "443/https",
        forward: "3210/http",
      },
    ],
  },
  environment: {
    INSTANCE_NAME: INSTANCE_NAME.value,
    INSTANCE_SECRET: INSTANCE_SECRET.value,
    REDACT_LOGS_TO_CLIENT: "true",
    DO_NOT_REQUIRE_SSL: "true",
    DISABLE_BEACON: "true",

    ...($dev
      ? {
          MYSQL_URL: $interpolate`mysql://${database.username}:${database.password}@host.docker.internal:${database.port}`,
          CONVEX_CLOUD_ORIGIN: "http://127.0.0.1:3210",
          CONVEX_SITE_ORIGIN: "http://127.0.0.1:3211",
        }
      : {
          MYSQL_URL: $interpolate`mysql://${database.username}:${database.password}@${database.host}:${database.port}`,
          CONVEX_CLOUD_ORIGIN: $interpolate`https://convex-api.${stageDomain}`,
          CONVEX_SITE_ORIGIN: $interpolate`https://convex.${stageDomain}`,

          AWS_REGION: REGION,
          AWS_ACCESS_KEY_ID: convexUserAccessKey.id,
          AWS_SECRET_ACCESS_KEY: convexUserAccessKey.secret,
          S3_STORAGE_EXPORTS_BUCKET: exportsBucket.name,
          S3_STORAGE_SNAPSHOT_IMPORTS_BUCKET: snapshotImportsBucket.name,
          S3_STORAGE_MODULES_BUCKET: modulesBucket.name,
          S3_STORAGE_FILES_BUCKET: filesBucket.name,
          S3_STORAGE_SEARCH_BUCKET: searchBucket.name,
        }),
  },
  dev: {
    url: "http://127.0.0.1:3210",
    command: `sh -c "docker compose -f ./docker/docker-compose-convex-backend.yml up -d && docker compose -f ./docker/docker-compose-convex-backend.yml exec backend ./generate_admin_key.sh"`,
  },
  transform: {
    service: {
      enableExecuteCommand: true,
    },
  },
  wait: true,
});

if (!$dev) {
  // If not dev, try to connect to Convex instance and get the admin key
  $resolve([cluster.nodes.cluster.name, convex.nodes.service.name]).apply(
    async ([clusterName, serviceName]) => {
      const convexAdminKey = await import("../convexAdminKey");
      await convexAdminKey.default(clusterName, serviceName);
    },
  );
}

const convexDev = new sst.x.DevCommand(
  "ConvexDevServer",
  { dev: { command: "bun run convex dev" } },
  { dependsOn: [convex] },
);

export const convexUrl = $dev ? "http://127.0.0.1:3210" : convex.url;
export const convexApiUrl = $dev
  ? "http://127.0.0.1:3211"
  : convex.url.apply((v) => v.replaceAll(/convex/g, "convex-api"));
