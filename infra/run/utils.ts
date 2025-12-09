/**
 * This utils are only callable from infra/run files, since asume is being executed by run scope.
 */

import { CONFIG } from '../constants'

function _getConfig() {
  if ($app.stage === 'prod') return CONFIG.prod

  return CONFIG.dev
}

export const { domain, hostedZone, profile } = _getConfig()

export const stageDomain =
  $app.stage === 'prod'
    ? `${$app.name}.${_getConfig().domain}`
    : `${$app.stage}-${$app.name}.${_getConfig().domain}`
