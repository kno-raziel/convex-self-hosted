// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.sst/platform/config.d.ts" />

const CONFIG = {
  prod: {
    instanceName: "prodInstance",
    hostedZone: "Z00675953HJM3LQ4W0ECR",
  },
  dev: {
    instanceName: "devInstance",
    hostedZone: "Z02972441FJY8D495AN6Z",
  },
};

function _getConfig() {
  if ($app.stage === "prod") return CONFIG.prod;

  return CONFIG.dev;
}

function getHostedZone(): string {
  return _getConfig().hostedZone;
}

const instanceSecret = new sst.Secret("InstanceSecretKey").value; // This secret should be set manually and stored securely
const instanceName = _getConfig().instanceName;
const databaseName = _getConfig().instanceName;

export default {
  getHostedZone,
  instanceSecret,
  instanceName,
  databaseName,
};
