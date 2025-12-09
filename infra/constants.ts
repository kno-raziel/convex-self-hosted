export const APP_NAME = "convex-self-hosted"; // Replace with your app name
export const REGION = "us-east-2" as const; // Replace with your region

export const CONFIG = {
  prod: {
    profile: "vagancia-project-prod", // Replace with your profile name
    hostedZone: "Z00675953HJM3LQ4W0ECR", // Replace with your hosted zone ID
    domain: "prod.app.vaganzia.com", // Replace with your domain name
  },
  dev: {
    profile: "vagancia-project-dev", // Replace with your profile name
    hostedZone: "Z02972441FJY8D495AN6Z", // Replace with your hosted zone ID
    domain: "dev.app.vaganzia.com", // Replace with your domain name
  },
} as const;
