import { stageDomain } from "../utils";
import { cluster, vpc, dns } from "./shared";
import { convex } from "./convex";
import { NEXT_PUBLIC_ADMIN_KEY } from "./shared";

let api;

const dashboardService = new sst.aws.Service("Dashboard", {
  cluster,
  image: "ghcr.io/get-convex/convex-dashboard:latest",
  environment: {
    NEXT_PUBLIC_DEPLOYMENT_URL: $dev
      ? "http://127.0.0.1:3210"
      : $interpolate`https://convex-api.${stageDomain}`,
    NEXT_PUBLIC_ADMIN_KEY: $dev ? NEXT_PUBLIC_ADMIN_KEY.apply : "",
  },
  link: [convex],
  dev: {
    url: "http://127.0.0.1:6791",
    command:
      "docker compose -f ./docker/docker-compose-convex-dashboard.yml up -d",
  },
  serviceRegistry: {
    port: 6791,
  },
  cpu: "0.25 vCPU",
  memory: "0.5 GB",
});

if (!$dev) {
  api = new sst.aws.ApiGatewayV2("Api", {
    vpc,
    domain: {
      name: `dashboard.${stageDomain}`,
      dns,
    },
  });
  api.routePrivate("$default", dashboardService.nodes.cloudmapService.arn);
}

export const dashboardUrl = $dev ? "http://127.0.0.1:6791" : api!.url;
