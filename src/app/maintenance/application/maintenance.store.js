import { resolve, sessionEnded } from '../../shared/infrastructure/services.js';
import { shallowRef, shallowReadonly } from 'vue';
import { takeUntil } from 'rxjs';
import { forkJoin, map } from 'rxjs';
import { Maintenance } from '../domain/model/maintenance.entity.js';
import { MaintenanceStatus } from '../domain/model/maintenance-status.enum.js';
import { MaintenanceApi } from '../infrastructure/maintenance-api.js';
import { MAINTENANCE_EQUIPMENT_INFORMATION_PORT } from '../infrastructure/equipment-information.port.js';
export class MaintenanceStore {
  #maintenanceApi = resolve(MaintenanceApi);
  #equipmentInformation = resolve(MAINTENANCE_EQUIPMENT_INFORMATION_PORT);
  #loadVersion = 0;
  #maintenancesState = shallowRef([]);
  maintenances = shallowReadonly(this.#maintenancesState);
  #equipmentInformationState = shallowRef([]);
  equipmentInformation = shallowReadonly(this.#equipmentInformationState);
  #loadingState = shallowRef(false);
  loading = shallowReadonly(this.#loadingState);
  #savingState = shallowRef(false);
  saving = shallowReadonly(this.#savingState);
  #saveSucceededState = shallowRef(false);
  saveSucceeded = shallowReadonly(this.#saveSucceededState);
  #errorState = shallowRef(null);
  error = shallowReadonly(this.#errorState);
  loadForCompany(userId) {
    const version = ++this.#loadVersion;
    this.#loadingState.value = true;
    this.#errorState.value = null;
    forkJoin({
      equipmentInformation: this.#equipmentInformation.getEquipmentInformationByUserId(userId),
      maintenances: this.#maintenanceApi.getMaintenances(),
    })
      .pipe(
        map(({ equipmentInformation, maintenances }) => {
          const equipmentIds = new Set(equipmentInformation.map((equipment) => equipment.id));
          return {
            equipmentInformation,
            maintenances: maintenances
              .filter((maintenance) => equipmentIds.has(maintenance.equipmentId))
              .sort(
                (firstMaintenance, secondMaintenance) =>
                  secondMaintenance.performedAt.getTime() - firstMaintenance.performedAt.getTime(),
              ),
          };
        }),
        takeUntil(sessionEnded),
      )
      .subscribe({
        next: ({ equipmentInformation, maintenances }) => {
          if (version !== this.#loadVersion) return;
          this.#equipmentInformationState.value = equipmentInformation;
          this.#maintenancesState.value = maintenances;
          this.#loadingState.value = false;
          this.#errorState.value = null;
        },
        error: (error) => {
          if (version !== this.#loadVersion) return;
          this.#equipmentInformationState.value = [];
          this.#maintenancesState.value = [];
          this.#loadingState.value = false;
          this.#errorState.value = this.#formatError(error, 'Failed to load maintenance records');
        },
      });
  }
  registerMaintenance(userId, equipmentId, performedAt, type) {
    this.#saveSucceededState.value = false;
    this.#errorState.value = null;
    const equipment = this.#equipmentInformationState.value.find(
      (currentEquipment) =>
        currentEquipment.id === equipmentId && currentEquipment.ownerUserId === userId,
    );
    if (!equipment) {
      this.#errorState.value = 'The selected equipment does not exist for this company';
      return;
    }
    let maintenance;
    try {
      maintenance = new Maintenance({
        id: 0,
        equipmentId,
        performedAt,
        type,
        status: MaintenanceStatus.COMPLETED,
      });
    } catch (error) {
      this.#errorState.value = this.#formatError(error, 'Invalid maintenance information');
      return;
    }
    this.#savingState.value = true;
    this.#maintenanceApi
      .createMaintenance(maintenance)
      .pipe(takeUntil(sessionEnded))
      .subscribe({
        next: (createdMaintenance) => {
          this.#maintenancesState.value = ((maintenances) => [createdMaintenance, ...maintenances])(
            this.#maintenancesState.value,
          );
          this.#savingState.value = false;
          this.#saveSucceededState.value = true;
          this.#errorState.value = null;
        },
        error: (error) => {
          this.#savingState.value = false;
          this.#saveSucceededState.value = false;
          this.#errorState.value = this.#formatError(error, 'Failed to register maintenance');
        },
      });
  }
  scheduleMaintenance(userId, equipmentId, scheduledAt, type) {
    this.#saveSucceededState.value = false;
    this.#errorState.value = null;
    const equipment = this.#equipmentInformationState.value.find(
      (currentEquipment) =>
        currentEquipment.id === equipmentId && currentEquipment.ownerUserId === userId,
    );
    if (!equipment) {
      this.#errorState.value = 'The selected equipment does not exist for this company';
      return;
    }
    let maintenance;
    try {
      maintenance = Maintenance.schedule({
        id: 0,
        equipmentId,
        scheduledAt,
        type,
      });
    } catch (error) {
      this.#errorState.value = this.#formatError(
        error,
        'Invalid scheduled maintenance information',
      );
      return;
    }
    this.#savingState.value = true;
    this.#maintenanceApi
      .createMaintenance(maintenance)
      .pipe(takeUntil(sessionEnded))
      .subscribe({
        next: (createdMaintenance) => {
          this.#maintenancesState.value = ((maintenances) => [createdMaintenance, ...maintenances])(
            this.#maintenancesState.value,
          );
          this.#savingState.value = false;
          this.#saveSucceededState.value = true;
          this.#errorState.value = null;
        },
        error: (error) => {
          this.#savingState.value = false;
          this.#saveSucceededState.value = false;
          this.#errorState.value = this.#formatError(error, 'Failed to schedule maintenance');
        },
      });
  }
  clearSaveState() {
    this.#saveSucceededState.value = false;
    this.#errorState.value = null;
  }
  clear() {
    ++this.#loadVersion;
    this.#maintenancesState.value = [];
    this.#equipmentInformationState.value = [];
    this.#loadingState.value = false;
    this.#savingState.value = false;
    this.#saveSucceededState.value = false;
    this.#errorState.value = null;
  }
  getEquipmentInformation(equipmentId) {
    return this.#equipmentInformationState.value.find((equipment) => equipment.id === equipmentId);
  }
  #formatError(error, fallbackMessage) {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallbackMessage;
  }
}
