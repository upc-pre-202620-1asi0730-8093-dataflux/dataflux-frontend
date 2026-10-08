import { resolve, sessionEnded } from '../../shared/infrastructure/services.js';
import { shallowRef, shallowReadonly, computed } from 'vue';
import { takeUntil } from 'rxjs';
import { forkJoin, map, switchMap, tap, throwError } from 'rxjs';
import { Incident } from '../domain/model/incident.entity.js';
import { IncidentStatus } from '../domain/model/incident-status.enum.js';
import { IncidentReactivationPolicy } from '../domain/model/incident-reactivation-policy.js';
import { MAINTENANCE_RENTAL_ACTIVITY_PORT } from '../infrastructure/rental-activity.port.js';
import { IncidentApi } from '../infrastructure/incident-api.js';
import { MAINTENANCE_EQUIPMENT_INFORMATION_PORT } from '../infrastructure/equipment-information.port.js';
import { MAINTENANCE_EQUIPMENT_OPERATION_PORT } from '../infrastructure/equipment-incident-operation.port.js';
export class IncidentStore {
  #incidentApi = resolve(IncidentApi);
  #equipmentInformation = resolve(MAINTENANCE_EQUIPMENT_INFORMATION_PORT);
  #equipmentOperation = resolve(MAINTENANCE_EQUIPMENT_OPERATION_PORT);
  #rentalActivity = resolve(MAINTENANCE_RENTAL_ACTIVITY_PORT);
  #loadVersion = 0;
  #incidentsState = shallowRef([]);
  incidents = shallowReadonly(this.#incidentsState);
  #equipmentInformationState = shallowRef([]);
  equipmentInformation = shallowReadonly(this.#equipmentInformationState);
  #loadingState = shallowRef(false);
  loading = shallowReadonly(this.#loadingState);
  #savingState = shallowRef(false);
  saving = shallowReadonly(this.#savingState);
  #saveSucceededState = shallowRef(false);
  saveSucceeded = shallowReadonly(this.#saveSucceededState);
  #resolvingIncidentIdState = shallowRef(null);
  resolvingIncidentId = shallowReadonly(this.#resolvingIncidentIdState);
  #resolveSucceededState = shallowRef(false);
  resolveSucceeded = shallowReadonly(this.#resolveSucceededState);
  #restrictingIncidentIdState = shallowRef(null);
  restrictingIncidentId = shallowReadonly(this.#restrictingIncidentIdState);
  #restrictionSucceededState = shallowRef(false);
  restrictionSucceeded = shallowReadonly(this.#restrictionSucceededState);
  #reactivatingEquipmentIdState = shallowRef(null);
  reactivatingEquipmentId = shallowReadonly(this.#reactivatingEquipmentIdState);
  #reactivationSucceededState = shallowRef(false);
  reactivationSucceeded = shallowReadonly(this.#reactivationSucceededState);
  reactivatableEquipment = computed(() =>
    this.#equipmentInformationState.value.filter(
      (equipment) =>
        equipment.status === 'MAINTENANCE' &&
        IncidentReactivationPolicy.canReactivate(equipment.id, this.#incidentsState.value),
    ),
  );
  #errorState = shallowRef(null);
  error = shallowReadonly(this.#errorState);
  loadForCompany(userId) {
    const loadVersion = ++this.#loadVersion;
    this.#loadingState.value = true;
    this.#saveSucceededState.value = false;
    this.#resolveSucceededState.value = false;
    this.#restrictionSucceededState.value = false;
    this.#reactivationSucceededState.value = false;
    this.#errorState.value = null;
    forkJoin({
      equipmentInformation: this.#equipmentInformation.getEquipmentInformationByUserId(userId),
      incidents: this.#incidentApi.getIncidents(),
    })
      .pipe(
        map(({ equipmentInformation, incidents }) => {
          const companyEquipment = equipmentInformation.filter(
            (equipment) => equipment.ownerUserId === userId,
          );
          const equipmentIds = new Set(companyEquipment.map((equipment) => equipment.id));
          return {
            equipmentInformation: companyEquipment,
            incidents: incidents
              .filter((incident) => equipmentIds.has(incident.equipmentId))
              .sort((first, second) => second.reportedAt.getTime() - first.reportedAt.getTime()),
          };
        }),
        takeUntil(sessionEnded),
      )
      .subscribe({
        next: ({ equipmentInformation, incidents }) => {
          if (loadVersion !== this.#loadVersion) return;
          this.#equipmentInformationState.value = equipmentInformation;
          this.#incidentsState.value = incidents;
          this.#loadingState.value = false;
          this.#errorState.value = null;
        },
        error: (error) => {
          if (loadVersion !== this.#loadVersion) return;
          this.#equipmentInformationState.value = [];
          this.#incidentsState.value = [];
          this.#loadingState.value = false;
          this.#errorState.value = this.#formatError(error, 'Failed to load incident records');
        },
      });
  }
  registerIncident(userId, equipmentId, description, blocksRental = false) {
    if (
      this.#savingState.value ||
      this.#resolvingIncidentIdState.value !== null ||
      this.#restrictingIncidentIdState.value !== null
    ) {
      return;
    }
    this.#saveSucceededState.value = false;
    this.#resolveSucceededState.value = false;
    this.#restrictionSucceededState.value = false;
    this.#errorState.value = null;
    const equipment = this.#equipmentInformationState.value.find(
      (item) => item.id === equipmentId && item.ownerUserId === userId,
    );
    if (!equipment) {
      this.#errorState.value = 'The selected equipment does not belong to this company';
      return;
    }
    let incident;
    try {
      incident = Incident.report({
        equipmentId,
        description,
        blocksRental,
      });
    } catch (error) {
      this.#errorState.value = this.#formatError(error, 'Invalid incident information');
      return;
    }
    this.#savingState.value = true;
    let equipmentWasChanged = false;
    const request$ = blocksRental
      ? this.#equipmentOperation.markAsMaintenance(userId, equipmentId).pipe(
          tap((transition) => {
            equipmentWasChanged = transition === 'CHANGED';
          }),
          switchMap(() => this.#incidentApi.createIncident(incident)),
        )
      : this.#incidentApi.createIncident(incident);
    request$.pipe(takeUntil(sessionEnded)).subscribe({
      next: (createdIncident) => {
        this.#incidentsState.value = ((incidents) =>
          [createdIncident, ...incidents].sort(
            (first, second) => second.reportedAt.getTime() - first.reportedAt.getTime(),
          ))(this.#incidentsState.value);
        if (blocksRental) this.#markEquipmentInMaintenance(equipmentId);
        this.#savingState.value = false;
        this.#saveSucceededState.value = true;
        this.#errorState.value = null;
      },
      error: (error) => {
        this.#savingState.value = false;
        this.#saveSucceededState.value = false;
        const message = this.#formatError(error, 'Failed to register incident');
        this.#errorState.value = equipmentWasChanged
          ? `${message}. The equipment was marked as MAINTENANCE. Check its status before trying again.`
          : message;
      },
    });
  }
  resolveIncident(userId, incidentId) {
    if (
      this.#savingState.value ||
      this.#resolvingIncidentIdState.value !== null ||
      this.#restrictingIncidentIdState.value !== null
    ) {
      return;
    }
    this.#saveSucceededState.value = false;
    this.#resolveSucceededState.value = false;
    this.#restrictionSucceededState.value = false;
    this.#errorState.value = null;
    const originalIncident = this.#incidentsState.value.find(
      (incident) => incident.id === incidentId,
    );
    if (!originalIncident || originalIncident.status !== IncidentStatus.OPEN) {
      this.#errorState.value = 'Incident is missing or already resolved';
      return;
    }
    const ownsEquipment = this.#equipmentInformationState.value.some(
      (equipment) =>
        equipment.id === originalIncident.equipmentId && equipment.ownerUserId === userId,
    );
    if (!ownsEquipment) {
      this.#errorState.value = 'Incident does not belong to this company';
      return;
    }
    let resolvedIncident;
    try {
      resolvedIncident = new Incident({
        id: originalIncident.id,
        equipmentId: originalIncident.equipmentId,
        description: originalIncident.description,
        reportedAt: originalIncident.reportedAt,
        blocksRental: originalIncident.blocksRental,
        status: originalIncident.status,
        resolvedAt: originalIncident.resolvedAt,
      });
      resolvedIncident.resolve();
    } catch (error) {
      this.#errorState.value = this.#formatError(error, 'Could not resolve incident');
      return;
    }
    this.#resolvingIncidentIdState.value = incidentId;
    this.#incidentApi
      .resolveIncident(resolvedIncident)
      .pipe(takeUntil(sessionEnded))
      .subscribe({
        next: (persistedIncident) => {
          this.#incidentsState.value = ((incidents) =>
            incidents.map((incident) =>
              incident.id === persistedIncident.id ? persistedIncident : incident,
            ))(this.#incidentsState.value);
          this.#resolvingIncidentIdState.value = null;
          this.#resolveSucceededState.value = true;
          this.#errorState.value = null;
        },
        error: (error) => {
          this.#resolvingIncidentIdState.value = null;
          this.#resolveSucceededState.value = false;
          this.#errorState.value = this.#formatError(error, 'Failed to resolve incident');
        },
      });
  }
  requireRentalRestriction(userId, incidentId) {
    if (
      this.#loadingState.value ||
      this.#savingState.value ||
      this.#resolvingIncidentIdState.value !== null ||
      this.#restrictingIncidentIdState.value !== null
    ) {
      return;
    }
    this.#saveSucceededState.value = false;
    this.#resolveSucceededState.value = false;
    this.#restrictionSucceededState.value = false;
    this.#errorState.value = null;
    const current = this.#incidentsState.value.find((incident) => incident.id === incidentId);
    if (!current || current.status !== IncidentStatus.OPEN || current.blocksRental) {
      this.#errorState.value = 'Only open incidents without a rental restriction can be updated';
      return;
    }
    const belongsToCompany = this.#equipmentInformationState.value.some(
      (equipment) => equipment.id === current.equipmentId && equipment.ownerUserId === userId,
    );
    if (!belongsToCompany) {
      this.#errorState.value = 'Incident does not belong to this company';
      return;
    }
    let updated;
    try {
      updated = new Incident({
        id: current.id,
        equipmentId: current.equipmentId,
        description: current.description,
        reportedAt: current.reportedAt,
        blocksRental: current.blocksRental,
        status: current.status,
        resolvedAt: current.resolvedAt,
      });
      updated.requireRentalRestriction();
    } catch (error) {
      this.#errorState.value = this.#formatError(error, 'Cannot update this incident');
      return;
    }
    this.#restrictingIncidentIdState.value = incidentId;
    let equipmentWasChanged = false;
    this.#equipmentOperation
      .markAsMaintenance(userId, current.equipmentId)
      .pipe(
        tap((transition) => {
          equipmentWasChanged = transition === 'CHANGED';
        }),
        switchMap(() => this.#incidentApi.requireRentalRestriction(updated)),
        takeUntil(sessionEnded),
      )
      .subscribe({
        next: (persisted) => {
          this.#incidentsState.value = ((incidents) =>
            incidents.map((incident) => (incident.id === persisted.id ? persisted : incident)))(
            this.#incidentsState.value,
          );
          this.#markEquipmentInMaintenance(current.equipmentId);
          this.#restrictingIncidentIdState.value = null;
          this.#restrictionSucceededState.value = true;
          this.#errorState.value = null;
        },
        error: (error) => {
          this.#restrictingIncidentIdState.value = null;
          this.#restrictionSucceededState.value = false;
          const message = this.#formatError(error, 'Failed to update rental restriction');
          this.#errorState.value = equipmentWasChanged
            ? `${message}. Equipment is already in MAINTENANCE. Verify the incident before retrying.`
            : message;
        },
      });
  }
  reactivateEquipment(userId, equipmentId, inspectionConfirmed) {
    if (
      this.#loadingState.value ||
      this.#savingState.value ||
      this.#resolvingIncidentIdState.value !== null ||
      this.#restrictingIncidentIdState.value !== null ||
      this.#reactivatingEquipmentIdState.value !== null
    ) {
      return;
    }
    this.clearSaveState();
    const equipment = this.#equipmentInformationState.value.find(
      (item) => item.id === equipmentId && item.ownerUserId === userId,
    );
    if (!inspectionConfirmed) {
      this.#errorState.value = 'Confirm the technical inspection before reactivating equipment';
      return;
    }
    if (!equipment || equipment.status !== 'MAINTENANCE') {
      this.#errorState.value = 'Only your equipment in MAINTENANCE can be reactivated';
      return;
    }
    if (!IncidentReactivationPolicy.canReactivate(equipmentId, this.#incidentsState.value)) {
      this.#errorState.value =
        'There are unresolved blocking incidents or no blocking incident history';
      return;
    }
    this.#reactivatingEquipmentIdState.value = equipmentId;
    forkJoin({
      incidents: this.#incidentApi.getIncidents(),
      hasActiveRental: this.#rentalActivity.hasActiveRental(equipmentId),
    })
      .pipe(
        switchMap(({ incidents, hasActiveRental }) => {
          if (!IncidentReactivationPolicy.canReactivate(equipmentId, incidents)) {
            return throwError(
              () => new Error('New or unresolved blocking incidents prevent reactivation'),
            );
          }
          if (hasActiveRental) {
            return throwError(() => new Error('The equipment still has an active rental'));
          }
          return this.#equipmentOperation.reactivateEquipment(userId, equipmentId);
        }),
        takeUntil(sessionEnded),
      )
      .subscribe({
        next: () => {
          this.#equipmentInformationState.value = ((items) =>
            items.map((item) =>
              item.id === equipmentId
                ? {
                    ...item,
                    status: 'AVAILABLE',
                  }
                : item,
            ))(this.#equipmentInformationState.value);
          this.#reactivatingEquipmentIdState.value = null;
          this.#reactivationSucceededState.value = true;
          this.#errorState.value = null;
        },
        error: (error) => {
          this.#reactivatingEquipmentIdState.value = null;
          this.#reactivationSucceededState.value = false;
          this.#errorState.value = this.#formatError(error, 'Failed to reactivate equipment');
        },
      });
  }
  getEquipmentInformation(equipmentId) {
    return this.#equipmentInformationState.value.find((equipment) => equipment.id === equipmentId);
  }
  clearSaveState() {
    this.#reactivationSucceededState.value = false;
    this.#saveSucceededState.value = false;
    this.#resolveSucceededState.value = false;
    this.#restrictionSucceededState.value = false;
    this.#errorState.value = null;
  }
  clear() {
    ++this.#loadVersion;
    this.#incidentsState.value = [];
    this.#equipmentInformationState.value = [];
    this.#loadingState.value = false;
    this.#savingState.value = false;
    this.#saveSucceededState.value = false;
    this.#resolvingIncidentIdState.value = null;
    this.#resolveSucceededState.value = false;
    this.#restrictingIncidentIdState.value = null;
    this.#restrictionSucceededState.value = false;
    this.#reactivatingEquipmentIdState.value = null;
    this.#reactivationSucceededState.value = false;
    this.#errorState.value = null;
  }
  #markEquipmentInMaintenance(equipmentId) {
    this.#equipmentInformationState.value = ((items) =>
      items.map((item) =>
        item.id === equipmentId
          ? {
              ...item,
              status: 'MAINTENANCE',
            }
          : item,
      ))(this.#equipmentInformationState.value);
  }
  #formatError(error, fallbackMessage) {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallbackMessage;
  }
}
