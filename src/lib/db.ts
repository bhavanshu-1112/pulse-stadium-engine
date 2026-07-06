/**
 * @fileoverview In-memory incident persistence store.
 *
 * Uses a module-level array to store incident records. During Next.js
 * development mode (with hot-reloading), the array is attached to the
 * global object to survive module re-evaluations, ensuring data
 * consistency across API requests without requiring an external database.
 *
 * @module db
 */

import { Incident } from '../types';

/** Extend the global object type to hold the incidents array across hot-reloads. */
const globalForDb = global as unknown as { incidents: Incident[] };

/**
 * The in-memory incidents array used as the application's data store.
 * All API routes read from and write to this shared array.
 */
export const incidents: Incident[] = globalForDb.incidents || [];

// Persist the array reference on the global object during development
// to prevent data loss when Next.js hot-reloads the module.
if (process.env.NODE_ENV !== 'production') {
  globalForDb.incidents = incidents;
}
