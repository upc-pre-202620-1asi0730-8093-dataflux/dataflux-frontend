import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import seed from '../../server/db.json';

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal()),
  createWebHistory: () => undefined,
  createRouter: () => ({ beforeEach() {}, afterEach() {} }),
}));

let app;
let requests;
beforeEach(async () => {
  vi.resetModules();
  requests = [];
  const saved = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, String(value)),
    removeItem: (key) => saved.delete(key),
  });
  const { register, HttpClient } = await import('./shared/infrastructure/services.js');
  class ContractHttp {
    get(endpoint) {
      const pathname = new URL(endpoint).pathname;
      const collection = pathname.replace(/^\/api\/v1\//, '');
      requests.push(collection);
      if (!Object.hasOwn(seed, collection)) throw new Error(`Unknown collection: ${collection}`);
      return of(structuredClone(seed[collection]));
    }
  }
  register(HttpClient, ContractHttp);
  app = await import('./app.services.js');
  app.configureServices();
}, 30000);
afterEach(() => vi.unstubAllGlobals());

describe('TB1: runtime context integration', () => {
  it('resolves every context and loads real stores through configured API contracts', () => {
    const services = app.useServices();
    expect(Object.keys(services).sort()).toEqual([
      'iam', 'incidents', 'inventory', 'maintenance', 'profiles', 'rentals', 'subscriptions',
    ]);
    services.inventory.loadEquipmentByUserId(17);
    services.inventory.loadMarketplaceEquipment();
    services.rentals.loadRentalRequestsForCompany(17);
    services.rentals.loadRentalRequestsForConstructionCompany(18);
    services.rentals.loadActiveRentalsForCompany(17);
    services.maintenance.loadForCompany(17);
    services.incidents.loadForCompany(17);
    services.subscriptions.loadPlans();
    services.subscriptions.loadCurrentSubscription(17);

    for (const name of ['inventory', 'rentals', 'maintenance', 'incidents', 'subscriptions']) {
      expect(services[name].error.value, `${name} failed to load`).toBeNull();
      expect(services[name].loading.value, `${name} remained busy`).toBe(false);
    }
    expect(services.subscriptions.subscriptionError.value).toBeNull();
    expect(services.subscriptions.plans.value).toHaveLength(3);
    expect(services.inventory.categories.value).toHaveLength(4);
    expect(new Set(requests)).toEqual(new Set([
      'equipment-categories', 'equipment', 'rental-requests', 'rentals',
      'maintenances', 'incidents', 'subscription-plans', 'user-subscriptions',
    ]));
  });

  it('clears the composed session without leaving subscription or operation state', () => {
    const services = app.useServices();
    services.subscriptions.loadPlans();
    expect(services.subscriptions.plans.value).toHaveLength(3);
    expect(() => app.clearSessionData()).not.toThrow();
    expect(services.subscriptions.plans.value).toEqual([]);
    expect(services.inventory.equipment.value).toEqual([]);
    expect(services.rentals.rentalRequests.value).toEqual([]);
    expect(services.incidents.incidents.value).toEqual([]);
    expect(services.maintenance.maintenances.value).toEqual([]);
  });

  it('loads every Inventory, Rentals and Maintenance view referenced by its route', async () => {
    const { routes } = await import('./app.routes.js');
    const views = routes.filter((route) => route.component &&
      /^\/(inventory|rentals|maintenance)(\/|$)/.test(route.path));
    expect(views).toHaveLength(11);
    await Promise.all(views.map(async (route) => {
      const loaded = await route.component();
      expect(loaded.default, `${route.path} has no view`).toBeDefined();
    }));
  }, 30000);
});
