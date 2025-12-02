/// <reference path="./.sst/platform/config.d.ts" />

const HOSTED_ZONES = {
  dev: "Z02972441FJY8D495AN6Z",
  prod: "Z00675953HJM3LQ4W0ECR",
};

const PROFILES = {
  dev: "vagancia-project-dev",
  prod: "vagancia-project-prod",
};

function getHostedZone(stage: string): string {
  if (stage === "prod") return HOSTED_ZONES.prod;

  return HOSTED_ZONES.dev;
}

export default $config({
  app(input) {
    return {
      name: "convex-test", // ‼️ this must be unique and cannot be shared with other apps, can mess the whole infrastructure
      removal: input?.stage === "prod" ? "retain" : "remove",
      protect: ["prod"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          region: "us-east-2",
          profile: input.stage === "prod" ? PROFILES.prod : PROFILES.dev,
        },
      },
    };
  },
  async run() {
    const stageDomain =
      $app.stage === "prod"
        ? `${$app.name}.prod.app.vaganzia.com`
        : `${$app.stage}.${$app.name}.dev.app.vaganzia.com`;

    const dns = sst.aws.dns({
      zone: getHostedZone($app.stage),
    });

    const router = new sst.aws.Router("MyRouter", {
      domain: {
        name: stageDomain,
        aliases: [`*.${stageDomain}`],
        dns,
      },
    });

    const vpc = new sst.aws.Vpc("Vpc"); // you can add a `bastion` if you want
    const cluster = new sst.aws.Cluster("Cluster", {
      vpc,
    });

    const database = new sst.aws.Mysql("Database", {
      vpc,
      // database: "convex_self_hosted",
      database: "instanceName",
      dev: {
        // database: "convex_self_hosted",
        database: "instanceName",
        host: "localhost",
        port: 3306,
        username: "root",
        password: "root",
      },
    });

    const exportsBucket = new sst.aws.Bucket("ExportsBucket", {});
    const snapshotImportsBucket = new sst.aws.Bucket(
      "SnapshotImportsBucket",
      {},
    );
    const modulesBucket = new sst.aws.Bucket("ModulesBucket", {});
    const filesBucket = new sst.aws.Bucket("FilesBucket", {});
    const searchBucket = new sst.aws.Bucket("SearchBucket", {});

    const convexUser = new aws.iam.User("ConvexUser");
    const convexUserPolicy = new aws.iam.UserPolicy("ConvexUserPolicy", {
      user: convexUser.name,
      policy: {
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "ExportsBucketAccess",
            Effect: "Allow",
            Action: ["s3:*"],
            Resource: [exportsBucket.arn, $interpolate`${exportsBucket.arn}/*`],
          },
          {
            Sid: "SnapshotImportsBucketAccess",
            Effect: "Allow",
            Action: ["s3:*"],
            Resource: [
              snapshotImportsBucket.arn,
              $interpolate`${snapshotImportsBucket.arn}/*`,
            ],
          },
          {
            Sid: "ModulesBucketAccess",
            Effect: "Allow",
            Action: ["s3:*"],
            Resource: [modulesBucket.arn, $interpolate`${modulesBucket.arn}/*`],
          },
          {
            Sid: "FilesBucketAccess",
            Effect: "Allow",
            Action: ["s3:*"],
            Resource: [filesBucket.arn, $interpolate`${filesBucket.arn}/*`],
          },
          {
            Sid: "SearchBucketAccess",
            Effect: "Allow",
            Action: ["s3:*"],
            Resource: [searchBucket.arn, $interpolate`${searchBucket.arn}/*`],
          },
        ],
      },
    });
    const convexUserAccessKey = new aws.iam.AccessKey("ConvexUserAccessKey", {
      user: convexUser.name,
    });

    const convex = new sst.aws.Service("Convex", {
      cluster,
      image: "ghcr.io/get-convex/convex-backend:latest",
      cpu: "0.5 vCPU",
      memory: "1 GB",
      scaling: {
        min: 1,
        max: 1,
      },
      link: [
        router,
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
          aliases: [`api.convex.${stageDomain}`],
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
        INSTANCE_NAME: "instanceName",
        INSTANCE_SECRET:
          "637837f21466495283aad0c09692efa07cd439aced03ce051e1abaa35375a0ef",
        S3_STORAGE_EXPORTS_BUCKET: exportsBucket.name,
        S3_STORAGE_SNAPSHOT_IMPORTS_BUCKET: snapshotImportsBucket.name,
        S3_STORAGE_MODULES_BUCKET: modulesBucket.name,
        S3_STORAGE_FILES_BUCKET: filesBucket.name,
        S3_STORAGE_SEARCH_BUCKET: searchBucket.name,
        REDACT_LOGS_TO_CLIENT: "true",
        ...($dev
          ? {
              MYSQL_URL: $interpolate`mysql://${database.username}:${database.password}@host.docker.internal:${database.port}`,
              CONVEX_CLOUD_ORIGIN: "http://127.0.0.1:3210",
              CONVEX_SITE_ORIGIN: "http://127.0.0.1:3211",
              DO_NOT_REQUIRE_SSL: "true",
              DISABLE_BEACON: "true",
            }
          : {
              MYSQL_URL: $interpolate`mysql://${database.username}:${database.password}@${database.host}:${database.port}`,
              CONVEX_CLOUD_ORIGIN: $interpolate`https://api.convex.${stageDomain}`,
              CONVEX_SITE_ORIGIN: $interpolate`https://convex.${stageDomain}`,
              DO_NOT_REQUIRE_SSL: "true",
              // AWS_ACCESS_KEY_ID: convexUserAccessKey.id,
              // AWS_SECRET_ACCESS_KEY: convexUserAccessKey.secret,
            }),
      },
      dev: {
        url: "http://127.0.0.1:3210",
        command: "bun run scripts/docker-backend.ts",
      },
      transform: {
        service: {
          enableExecuteCommand: true,
        },
      },
      wait: true,
    });

    const dashboard = new sst.aws.Service("Dashboard", {
      cluster,
      image: "ghcr.io/get-convex/convex-dashboard:latest",
      environment: {
        NEXT_PUBLIC_DEPLOYMENT_URL: $dev
          ? "http://127.0.0.1:3210"
          : $interpolate`https://api.convex.${stageDomain}`,
      },
      link: [convex],
      dev: {
        url: "http://127.0.0.1:6791",
        command: "bun run scripts/docker-dashboard.ts",
      },
      serviceRegistry: {
        port: 6791,
      },
      cpu: "0.25 vCPU",
      memory: "0.5 GB",
    });

    if (!$dev) {
      const api = new sst.aws.ApiGatewayV2("Api", {
        vpc,
        domain: {
          name: `dashboard.${stageDomain}`,
          dns,
        },
      });
      api.routePrivate("$default", dashboard.nodes.cloudmapService.arn);
    }

    const convexDev = new sst.x.DevCommand(
      "ConvexDevServer",
      { dev: { command: "bun run convex dev" } },
      { dependsOn: [convex] },
    );

    const site = new sst.aws.StaticSite("Site", {
      dev: {
        command: "bun run dev",
        url: "http://127.0.0.1:5173",
      },
      build: {
        command: "bun run build",
        output: "./dist",
      },
      environment: {
        VITE_CONVEX_URL: $dev
          ? "http://127.0.0.1:3210"
          : $interpolate`https://api.convex.${stageDomain}`,
      },
      domain: {
        name: `static.${stageDomain}`,
        dns,
      },
    });

    if (!$dev) {
      // Output the Cluster and Service Names so you can find the task
      $resolve([cluster.nodes.cluster.name, convex.nodes.service.name]).apply(
        async ([clusterName, serviceName]) => {
          console.log("\n\x1b[32m--- ECS INFO ---\x1b[0m");
          console.log("Cluster Name:", clusterName);
          console.log("Service Name:", serviceName);

          console.log("\x1b[33mTo get the Task ID run:\x1b[0m");
          console.log(
            `aws ecs list-tasks --cluster ${clusterName} --service-name ${serviceName} --profile ${$app.stage === "prod" ? PROFILES.prod : PROFILES.dev}`,
          );
          console.log("\x1b[32m----------------\x1b[0m\n");

          const scripts = await import("./infra/scripts");

          const { runGenerateAdminKey, waitForService } = scripts.default(
            $app.stage === "prod" ? PROFILES.prod : PROFILES.dev,
          );

          const task = await waitForService(clusterName, serviceName);

          await runGenerateAdminKey(clusterName, serviceName, task);
        },
      );
    }
  },
});
