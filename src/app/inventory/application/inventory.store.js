import { resolve, sessionEnded } from '../../shared/infrastructure/services.js';
import { shallowRef, shallowReadonly, computed } from 'vue';
import { takeUntil } from 'rxjs';
import { EMPTY, forkJoin, map, retry, switchMap, tap } from 'rxjs';

import { InventoryApi } from '../infrastructure/inventory-api.js';
import { INVENTORY_ACCESS_PORT } from '../infrastructure/inventory-access.port.js';
export class InventoryStore {
  #inventoryApi = resolve(InventoryApi);
  #inventoryAccess = resolve(INVENTORY_ACCESS_PORT);
  #equipmentState = shallowRef([]);
  equipment = shallowReadonly(this.#equipmentState);
  #categoriesState = shallowRef([]);
  categories = shallowReadonly(this.#categoriesState);
  equipmentCount = computed(() => this.equipment.value.length);
  #loadingState = shallowRef(false);
  #pendingOperationCount = 0;
  #beginOperation() {
    this.#pendingOperationCount += 1;
    this.#loadingState.value = true;
  }
  #finishOperation() {
    this.#pendingOperationCount = Math.max(0, this.#pendingOperationCount - 1);
    this.#loadingState.value = this.#pendingOperationCount > 0;
  }
  loading = shallowReadonly(this.#loadingState);
  #errorState = shallowRef(null);
  error = shallowReadonly(this.#errorState);
  #accessDeniedState = shallowRef(false);
  accessDenied = shallowReadonly(this.#accessDeniedState);
  #listRequestVersion = 0;
  #detailRequestVersion = 0;
  #saveSucceededState = shallowRef(false);
  saveSucceeded = shallowReadonly(this.#saveSucceededState);
  constructor() {
    this.#loadCategories();
  }
  canManageInventory(userId) {
    return this.#inventoryAccess.canManageInventory(userId);
  }
  getCategoryById(id) {
    return computed(() =>
      id ? this.categories.value.find((category) => category.id === id) : undefined,
    );
  }
  getEquipmentById(id) {
    return computed(() =>
      id ? this.equipment.value.find((equipment) => equipment.id === id) : undefined,
    );
  }
  getEquipmentForEdit(id, ownerUserId) {
    return this.#inventoryApi.getEquipmentById(id).pipe(
      map((equipment) => {
        if (equipment.userId !== ownerUserId) {
          throw new Error('Equipment does not belong to the current company');
        }
        return equipment;
      }),
      tap((equipment) => this.#upsertEquipment(equipment)),
    );
  }
  verifyEquipmentAvailability(id, period) {
    return this.#inventoryApi.getEquipmentById(id).pipe(
      tap((equipment) => this.#upsertEquipment(equipment)),
      map((equipment) => equipment.isAvailableFor(period)),
    );
  }
  #upsertEquipment(equipment) {
    const refreshed = this.#assignCategoryToEquipment(equipment);
    this.#equipmentState.value = ((list) => {
      const exists = list.some((item) => item.id === refreshed.id);
      return exists
        ? list.map((item) => (item.id === refreshed.id ? refreshed : item))
        : [...list, refreshed];
    })(this.#equipmentState.value);
  }
  loadMarketplaceEquipment(background = false) {
    const requestVersion = ++this.#listRequestVersion;
    if (!background) {
      this.#beginOperation();
      this.#errorState.value = null;
    }
    forkJoin({
      equipment: this.#inventoryApi.getEquipment(),
      activeProviderUserIds: this.#inventoryAccess.getActiveProviderUserIds(),
    })
      .pipe(takeUntil(sessionEnded))
      .subscribe({
        next: ({ equipment, activeProviderUserIds }) => {
          if (requestVersion !== this.#listRequestVersion) {
            if (!background) this.#finishOperation();
            return;
          }
          const activeProviderIds = new Set(activeProviderUserIds);
          const marketplaceEquipment = equipment.filter((currentEquipment) =>
            activeProviderIds.has(currentEquipment.userId),
          );
          this.#equipmentState.value = marketplaceEquipment;
          this.#assignCategoriesToEquipment();
          this.#errorState.value = null;
          if (!background) this.#finishOperation();
        },
        error: (err) => {
          if (requestVersion !== this.#listRequestVersion) {
            if (!background) this.#finishOperation();
            return;
          }
          this.#equipmentState.value = [];
          this.#errorState.value = this.#formatError(
            err,
            'Failed to synchronize marketplace equipment',
          );
          if (!background) this.#finishOperation();
        },
      });
  }
  loadEquipmentById(id) {
    const detailRequestVersion = ++this.#detailRequestVersion;
    this.#beginOperation();
    this.#errorState.value = null;
    this.#inventoryApi
      .getEquipmentById(id)
      .pipe(takeUntil(sessionEnded))
      .subscribe({
        next: (equipment) => {
          if (detailRequestVersion !== this.#detailRequestVersion) {
            this.#finishOperation();
            return;
          }
          equipment = this.#assignCategoryToEquipment(equipment);
          this.#equipmentState.value = ((equipmentCollection) => {
            const exists = equipmentCollection.some(
              (currentEquipment) => currentEquipment.id === equipment.id,
            );
            if (exists) {
              return equipmentCollection.map((currentEquipment) =>
                currentEquipment.id === equipment.id ? equipment : currentEquipment,
              );
            }
            return [...equipmentCollection, equipment];
          })(this.#equipmentState.value);
          this.#finishOperation();
          this.#errorState.value = null;
        },
        error: (err) => {
          if (detailRequestVersion !== this.#detailRequestVersion) {
            this.#finishOperation();
            return;
          }
          this.#errorState.value = this.#formatError(err, 'Failed to load equipment');
          this.#finishOperation();
        },
      });
  }
  loadEquipmentByUserId(userId) {
    const requestVersion = ++this.#listRequestVersion;
    this.#beginOperation();
    this.#errorState.value = null;
    this.#inventoryApi
      .getEquipmentByUserId(userId)
      .pipe(takeUntil(sessionEnded))
      .subscribe({
        next: (equipment) => {
          if (requestVersion !== this.#listRequestVersion) {
            this.#finishOperation();
            return;
          }
          this.#equipmentState.value = equipment;
          this.#finishOperation();
          this.#errorState.value = null;
          this.#assignCategoriesToEquipment();
        },
        error: (err) => {
          if (requestVersion !== this.#listRequestVersion) {
            this.#finishOperation();
            return;
          }
          this.#errorState.value = this.#formatError(err, 'Failed to load equipment');
          this.#finishOperation();
        },
      });
  }
  addEquipment(equipment) {
    this.#prepareSaveOperation();
    this.#inventoryAccess
      .canManageInventory(equipment.userId)
      .pipe(
        switchMap((canManageInventory) => {
          if (!canManageInventory) {
            this.#accessDeniedState.value = true;
            this.#finishOperation();
            return EMPTY;
          }
          return this.#inventoryApi.createEquipment(equipment);
        }),
        takeUntil(sessionEnded),
      )
      .subscribe({
        next: (createdEquipment) => {
          createdEquipment = this.#assignCategoryToEquipment(createdEquipment);
          this.#equipmentState.value = ((equipmentCollection) => [
            ...equipmentCollection,
            createdEquipment,
          ])(this.#equipmentState.value);
          this.#finishOperation();
          this.#errorState.value = null;
          this.#accessDeniedState.value = false;
          this.#saveSucceededState.value = true;
        },
        error: (err) => {
          this.#errorState.value = this.#formatError(err, 'Failed to create equipment');
          this.#finishOperation();
          this.#saveSucceededState.value = false;
        },
      });
  }
  updateEquipment(equipment) {
    this.#prepareSaveOperation();
    this.#inventoryAccess
      .canManageInventory(equipment.userId)
      .pipe(
        switchMap((canManageInventory) => {
          if (!canManageInventory) {
            this.#accessDeniedState.value = true;
            this.#finishOperation();
            return EMPTY;
          }
          return this.#inventoryApi.updateEquipment(equipment).pipe(retry(2));
        }),
        takeUntil(sessionEnded),
      )
      .subscribe({
        next: (updatedEquipment) => {
          updatedEquipment = this.#assignCategoryToEquipment(updatedEquipment);
          this.#equipmentState.value = ((equipmentCollection) =>
            equipmentCollection.map((currentEquipment) =>
              currentEquipment.id === updatedEquipment.id ? updatedEquipment : currentEquipment,
            ))(this.#equipmentState.value);
          this.#finishOperation();
          this.#errorState.value = null;
          this.#accessDeniedState.value = false;
          this.#saveSucceededState.value = true;
        },
        error: (err) => {
          this.#errorState.value = this.#formatError(err, 'Failed to update equipment');
          this.#finishOperation();
          this.#saveSucceededState.value = false;
        },
      });
  }
  clearSaveState() {
    this.#accessDeniedState.value = false;
    this.#saveSucceededState.value = false;
  }
  clearEquipment() {
    ++this.#listRequestVersion;
    ++this.#detailRequestVersion;
    this.#equipmentState.value = [];
    this.#errorState.value = null;
    this.#pendingOperationCount = 0;
    this.#loadingState.value = false;
  }
  #prepareSaveOperation() {
    this.#beginOperation();
    this.#errorState.value = null;
    this.#accessDeniedState.value = false;
    this.#saveSucceededState.value = false;
  }
  refreshCategories() {
    this.#loadCategories();
  }
  #loadCategories() {
    this.#beginOperation();
    this.#errorState.value = null;
    this.#inventoryApi
      .getCategories()
      .pipe(takeUntil(sessionEnded))
      .subscribe({
        next: (categories) => {
          this.#categoriesState.value = categories;
          this.#finishOperation();
          this.#errorState.value = null;
          this.#assignCategoriesToEquipment();
        },
        error: (err) => {
          this.#errorState.value = this.#formatError(err, 'Failed to load equipment categories');
          this.#finishOperation();
        },
      });
  }
  #assignCategoriesToEquipment() {
    this.#equipmentState.value = ((equipmentCollection) =>
      equipmentCollection.map((equipment) => this.#assignCategoryToEquipment(equipment)))(
      this.#equipmentState.value,
    );
  }
  #assignCategoryToEquipment(equipment) {
    const categoryId = equipment.categoryId ?? 0;
    equipment.category = categoryId ? (this.getCategoryById(categoryId).value ?? null) : null;
    return equipment;
  }
  #formatError(error, fallback) {
    if (error instanceof Error) {
      return error.message.includes('Resource not found')
        ? `${fallback}: Not found`
        : error.message;
    }
    return fallback;
  }
}
