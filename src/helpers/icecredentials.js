export const TURN_CREDENTIAL_LIFETIME_SECONDS = 55 * 60;
export const XIRSYS_CREDENTIAL_LIFETIME_SECONDS = 60;
export const XIRSYS_CACHE_SAFETY_SECONDS = 10;

export function getIceServerCacheLifetimeMs({
  xirsysConfigured = false,
  xirsysServersAdded = false
} = {}) {
  if (xirsysConfigured && !xirsysServersAdded) {
    return 30_000;
  }
  if (xirsysServersAdded) {
    return (XIRSYS_CREDENTIAL_LIFETIME_SECONDS - XIRSYS_CACHE_SAFETY_SECONDS) * 1000;
  }
  return (TURN_CREDENTIAL_LIFETIME_SECONDS - 60) * 1000;
}
