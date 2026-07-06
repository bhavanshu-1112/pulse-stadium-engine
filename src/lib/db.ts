import { Incident } from '../types';

// Persist database across hot-reloads during Next.js local development
const globalForDb = global as unknown as { incidents: Incident[] };

export const incidents: Incident[] = globalForDb.incidents || [];

if (process.env.NODE_ENV !== 'production') {
  globalForDb.incidents = incidents;
}
