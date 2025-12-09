// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  async app(input) {
    // ‼️  sst.config.ts cannot have top level imports 🤷‍♂️
    const { CONFIG, REGION, APP_NAME } = await import("./infra/constants");

    function _getConfig() {
      if (input.stage === "prod") return CONFIG.prod;

      return CONFIG.dev;
    }

    return {
      name: APP_NAME, // ‼️ this must be unique and cannot be shared with other apps, can mess the whole infrastructure
      removal: input?.stage === "prod" ? "retain" : "remove",
      protect: ["prod"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          region: REGION,
          profile: _getConfig().profile,
        },
      },
    };
  },
  async run() {
    // ‼️  sst.config.ts cannot have top level imports 🤷‍♂️
    const { run } = await import("./infra/run/index");
    return await run();
  },
});
