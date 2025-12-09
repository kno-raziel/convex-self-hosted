// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

import { convexApiUrl, convexUrl } from './resources/convex'
import { dashboardUrl } from './resources/dashboard'
import './resources/database'
import './resources/s3Storage'
import { siteUrl } from './resources/site'
import './resources/user'

export async function run() {
  return {
    site: siteUrl,
    dashboard: dashboardUrl,
    convex: convexApiUrl,
    api: convexUrl,
  }
}
