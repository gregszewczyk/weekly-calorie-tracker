// Garmin Connect Integration - Proxy-based approach
export { GarminProxyService, garminProxyService } from '../services/GarminProxyService';
export type { GarminActivity, GarminUserProfile } from '../services/GarminProxyService';

// All other Garmin integrations have been removed and replaced with the proxy server approach
// See garmin-proxy-server/ directory for the Node.js backend implementation