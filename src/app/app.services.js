import { resolve, sessionEnded } from './shared/infrastructure/services.js';

// Each context owns its registrations. The base can start before contexts arrive.
const modules = Object.values(import.meta.glob('./*/application/*.module.js', { eager: true }));
export function configureServices() {
  for (const module of modules) module.configure?.();
}
export function useServices() {
  const services = {};
  for (const module of modules) {
    for (const [name, token] of Object.entries(module.services ?? {})) services[name] = resolve(token);
  }
  return services;
}
export function clearSessionData() {
  sessionEnded.next();
  for (const module of modules) module.clearSession?.();
}
