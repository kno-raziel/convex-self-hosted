import { hostedZone } from "../utils";

export const dns = sst.aws.dns({
  zone: hostedZone,
});

export const vpc = new sst.aws.Vpc("Vpc"); // you can add a `bastion` if you want
export const cluster = new sst.aws.Cluster("Cluster", {
  vpc,
});

// Required Secrets
export const INSTANCE_NAME = new sst.Secret("INSTANCE_NAME", "devInstance"); // Replace with your instance name
export const INSTANCE_SECRET = new sst.Secret(
  "INSTANCE_SECRET",
  "6a7cde9266de08cf51617415ec4175fc64537c74392f413eedbfdc4092af0e7d",
); // Replace with your instance secret, create it using openssl rand -hex 32
// Optional Secrets
export const NEXT_PUBLIC_ADMIN_KEY = new sst.Secret(
  "NEXT_PUBLIC_ADMIN_KEY",
  "", // Replace with your admin key, it will be printed in the console
);
