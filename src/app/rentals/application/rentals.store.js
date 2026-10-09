import { defineStore } from "pinia";
import { registerStore, exposeStore } from "../../shared/infrastructure/services.js";
import { resolve, sessionEnded } from '../../shared/infrastructure/services.js';
import { shallowRef, shallowReadonly, computed } from 'vue';
import { takeUntil } from 'rxjs';
import { EMPTY, forkJoin, map, of, switchMap } from 'rxjs';
import { Delivery } from '../domain/model/delivery.entity.js';
import { EquipmentReturn } from '../domain/model/equipment-return.entity.js';
import { Rental } from '../domain/model/rental.entity.js';
import { RentalRequest } from '../domain/model/rental-request.entity.js';
import { RentalRequestStatus } from '../domain/model/rental-request-status.enum.js';
import { RentalStatus } from '../domain/model/rental-status.enum.js';
import { RentalsApi } from '../infrastructure/rentals-api.js';
import { EQUIPMENT_INFORMATION_PORT } from '../infrastructure/equipment-information.port.js';
import { EQUIPMENT_OPERATION_PORT } from '../infrastructure/equipment-operation.port.js';
import { PARTICIPANT_INFORMATION_PORT } from '../infrastructure/participant-information.port.js';
import { SUBSCRIPTION_ACCESS_PORT } from '../infrastructure/subscription-access.port.js';
import { RentalRequestEligibilityPolicy } from '../domain/policy/rental-request-eligibility.policy.js';
import { EQUIPMENT_REQUEST_AVAILABILITY_PORT } from '../infrastructure/equipment-request-availability.port.js';
import { MAINTENANCE_INCIDENT_RESTRICTION_PORT } from '../infrastructure/maintenance-incident-restriction.port.js';
import { RENTAL_REQUESTER_ACCESS_PORT } from '../infrastructure/rental-requester-access.port.js';
import { RentalOperations } from './rental-operations.js';
export class RentalsStore {
  #rentalsApi = resolve(RentalsApi);
  #requesterAccess = resolve(RENTAL_REQUESTER_ACCESS_PORT);
  #subscriptionAccess = resolve(SUBSCRIPTION_ACCESS_PORT);
  #equipmentInformation = resolve(EQUIPMENT_INFORMATION_PORT);
  #equipmentOperation = resolve(EQUIPMENT_OPERATION_PORT);
  #equipmentRequestAvailability = resolve(EQUIPMENT_REQUEST_AVAILABILITY_PORT);
  #maintenanceIncidentRestriction = resolve(MAINTENANCE_INCIDENT_RESTRICTION_PORT);
  #participantInformation = resolve(PARTICIPANT_INFORMATION_PORT);
  #operations = new RentalOperations({
    rentalsApi: this.#rentalsApi,
    equipmentOperation: this.#equipmentOperation,
    incidentRestriction: this.#maintenanceIncidentRestriction,
  });
  #readRequestVersion = 0;
  #rentalRequestsState = shallowRef([]);
  rentalRequests = shallowReadonly(this.#rentalRequestsState);
  #selectedRentalRequestState = shallowRef(null);
  selectedRentalRequest = shallowReadonly(this.#selectedRentalRequestState);
  #rentalRequestNotFoundState = shallowRef(false);
  rentalRequestNotFound = shallowReadonly(this.#rentalRequestNotFoundState);
  #rentalsState = shallowRef([]);
  rentals = shallowReadonly(this.#rentalsState);
  #equipmentInformationState = shallowRef(new Map());
  #participantInformationState = shallowRef(new Map());
  pendingRequestCount = computed(
    () =>
      this.rentalRequests.value.filter((request) => request.status === RentalRequestStatus.PENDING)
        .length,
  );
  approvedRequestCount = computed(
    () =>
      this.rentalRequests.value.filter((request) => request.status === RentalRequestStatus.APPROVED)
        .length,
  );
  rejectedRequestCount = computed(
    () =>
      this.rentalRequests.value.filter((request) => request.status === RentalRequestStatus.REJECTED)
        .length,
  );
  confirmedRentalCount = computed(
    () => this.rentals.value.filter((rental) => rental.isConfirmed).length,
  );
  activeRentalCount = computed(() => this.rentals.value.filter((rental) => rental.isActive).length);
  upcomingReturnCount = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(limit.getDate() + 7);
    return this.rentals.value.filter(
      (rental) =>
        rental.isActive && rental.period.endDate >= today && rental.period.endDate <= limit,
    ).length;
  });
  overdueRentalCount = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.rentals.value.filter((rental) => rental.isActive && rental.period.endDate < today)
      .length;
  });
  #latestCreatedRequestState = shallowRef(null);
  latestCreatedRequest = shallowReadonly(this.#latestCreatedRequestState);
  #loadingState = shallowRef(false);
  loading = shallowReadonly(this.#loadingState);
  #updatingRequestIdState = shallowRef(null);
  updatingRequestId = shallowReadonly(this.#updatingRequestIdState);
  #updatingRentalIdState = shallowRef(null);
  updatingRentalId = shallowReadonly(this.#updatingRentalIdState);
  #operationSuccessState = shallowRef(null);
  operationSuccess = shallowReadonly(this.#operationSuccessState);
  #errorState = shallowRef(null);
  error = shallowReadonly(this.#errorState);
  #subscriptionRequiredState = shallowRef(false);
  subscriptionRequired = shallowReadonly(this.#subscriptionRequiredState);
  canManageRentals(userId) {
    return this.#subscriptionAccess.canManageRentals(userId);
  }
  loadRentalRequestsForCompany(rentalCompanyUserId) {
    const readVersion = ++this.#readRequestVersion;
    this.#loadingState.value = true;
    this.#errorState.value = null;
    this.#rentalsApi
      .getRentalRequests()
      .pipe(
        map((requests) =>
          requests
            .filter((request) => request.rentalCompanyUserId === rentalCompanyUserId)
            .sort(
              (firstRequest, secondRequest) =>
                secondRequest.createdAt.getTime() - firstRequest.createdAt.getTime(),
            ),
        ),
        switchMap((requests) => {
          if (requests.length === 0) {
            return of({
              requests,
              equipmentInformation: [],
              participantInformation: [],
            });
          }
          const equipmentIds = Array.from(new Set(requests.map((request) => request.equipmentId)));
          const participantUserIds = Array.from(
            new Set(requests.map((request) => request.constructionUserId)),
          );
          return forkJoin({
            equipmentInformation:
              this.#equipmentInformation.getEquipmentInformationByIds(equipmentIds),
            participantInformation:
              this.#participantInformation.getParticipantInformationByUserIds(participantUserIds),
          }).pipe(
            map(({ equipmentInformation, participantInformation }) => ({
              requests,
              equipmentInformation,
              participantInformation,
            })),
          );
        }),
        takeUntil(sessionEnded),
      )
      .subscribe({
        next: ({ requests, equipmentInformation, participantInformation }) => {
          if (readVersion !== this.#readRequestVersion) return;
          this.#rentalRequestsState.value = requests;
          this.#equipmentInformationState.value = new Map(
            equipmentInformation.map((equipment) => [equipment.id, equipment]),
          );
          this.#participantInformationState.value = new Map(
            participantInformation.map((participant) => [participant.userId, participant]),
          );
          this.#loadingState.value = false;
          this.#errorState.value = null;
        },
        error: (error) => {
          if (readVersion !== this.#readRequestVersion) return;
          this.clearRentalRequests();
          this.#errorState.value = this.#formatError(error, 'Failed to load rental requests');
          this.#loadingState.value = false;
        },
      });
  }
  loadRentalRequestsForConstructionCompany(constructionUserId) {
    const readVersion = ++this.#readRequestVersion;
    this.#loadingState.value = true;
    this.#errorState.value = null;
    this.#rentalsApi
      .getRentalRequests()
      .pipe(
        map((requests) =>
          requests
            .filter((request) => request.constructionUserId === constructionUserId)
            .sort(
              (firstRequest, secondRequest) =>
                secondRequest.createdAt.getTime() - firstRequest.createdAt.getTime(),
            ),
        ),
        switchMap((requests) => {
          if (requests.length === 0) {
            return of({
              requests,
              equipmentInformation: [],
            });
          }
          const equipmentIds = Array.from(new Set(requests.map((request) => request.equipmentId)));
          return this.#equipmentInformation.getEquipmentInformationByIds(equipmentIds).pipe(
            map((equipmentInformation) => ({
              requests,
              equipmentInformation,
            })),
          );
        }),
        takeUntil(sessionEnded),
      )
      .subscribe({
        next: ({ requests, equipmentInformation }) => {
          if (readVersion !== this.#readRequestVersion) return;
          this.#rentalRequestsState.value = requests;
          this.#equipmentInformationState.value = new Map(
            equipmentInformation.map((equipment) => [equipment.id, equipment]),
          );
          this.#participantInformationState.value = new Map();
          this.#loadingState.value = false;
          this.#errorState.value = null;
        },
        error: (error) => {
          if (readVersion !== this.#readRequestVersion) return;
          this.clearRentalRequests();
          this.#errorState.value = this.#formatError(error, 'Failed to load my rental requests');
          this.#loadingState.value = false;
        },
      });
  }
  loadRentalRequestDetail(requestId, constructionUserId) {
    const readVersion = ++this.#readRequestVersion;
    this.#loadingState.value = true;
    this.#errorState.value = null;
    this.#rentalRequestNotFoundState.value = false;
    this.#selectedRentalRequestState.value = null;
    this.#rentalsApi
      .getRentalRequest(requestId)
      .pipe(
        switchMap((request) => {
          if (request.constructionUserId !== constructionUserId) {
            return of({
              request: null,
              equipmentInformation: [],
            });
          }
          return this.#equipmentInformation
            .getEquipmentInformationByIds([request.equipmentId])
            .pipe(
              map((equipmentInformation) => ({
                request: request,
                equipmentInformation,
              })),
            );
        }),
        takeUntil(sessionEnded),
      )
      .subscribe({
        next: ({ request, equipmentInformation }) => {
          if (readVersion !== this.#readRequestVersion) return;
          if (!request) {
            this.#selectedRentalRequestState.value = null;
            this.#equipmentInformationState.value = new Map();
            this.#rentalRequestNotFoundState.value = true;
            this.#loadingState.value = false;
            return;
          }
          this.#selectedRentalRequestState.value = request;
          this.#equipmentInformationState.value = new Map(
            equipmentInformation.map((equipment) => [equipment.id, equipment]),
          );
          this.#rentalRequestNotFoundState.value = false;
          this.#loadingState.value = false;
          this.#errorState.value = null;
        },
        error: (error) => {
          if (readVersion !== this.#readRequestVersion) return;
          this.#selectedRentalRequestState.value = null;
          this.#equipmentInformationState.value = new Map();
          const message = this.#formatError(error, 'Failed to load rental request');
          if (message.includes('Resource not found')) {
            this.#rentalRequestNotFoundState.value = true;
            this.#errorState.value = null;
          } else {
            this.#rentalRequestNotFoundState.value = false;
            this.#errorState.value = message;
          }
          this.#loadingState.value = false;
        },
      });
  }
  loadActiveRentalsForCompany(rentalCompanyUserId) {
    const readVersion = ++this.#readRequestVersion;
    this.#loadingState.value = true;
    this.#errorState.value = null;
    this.#operationSuccessState.value = null;
    this.#rentalsApi
      .getRentals()
      .pipe(
        map((rentals) =>
          rentals
            .filter(
              (rental) =>
                rental.rentalCompanyUserId === rentalCompanyUserId &&
                (rental.isConfirmed || rental.isActive),
            )
            .sort(
              (firstRental, secondRental) =>
                firstRental.period.endDate.getTime() - secondRental.period.endDate.getTime(),
            ),
        ),
        switchMap((rentals) => {
          if (rentals.length === 0) {
            return of({
              rentals,
              equipmentInformation: [],
              participantInformation: [],
            });
          }
          const equipmentIds = Array.from(new Set(rentals.map((rental) => rental.equipmentId)));
          const participantUserIds = Array.from(
            new Set(rentals.map((rental) => rental.constructionUserId)),
          );
          return forkJoin({
            equipmentInformation:
              this.#equipmentInformation.getEquipmentInformationByIds(equipmentIds),
            participantInformation:
              this.#participantInformation.getParticipantInformationByUserIds(participantUserIds),
          }).pipe(
            map(({ equipmentInformation, participantInformation }) => ({
              rentals,
              equipmentInformation,
              participantInformation,
            })),
          );
        }),
        takeUntil(sessionEnded),
      )
      .subscribe({
        next: ({ rentals, equipmentInformation, participantInformation }) => {
          if (readVersion !== this.#readRequestVersion) return;
          this.#rentalsState.value = rentals;
          this.#equipmentInformationState.value = new Map(
            equipmentInformation.map((equipment) => [equipment.id, equipment]),
          );
          this.#participantInformationState.value = new Map(
            participantInformation.map((participant) => [participant.userId, participant]),
          );
          this.#loadingState.value = false;
          this.#errorState.value = null;
        },
        error: (error) => {
          if (readVersion !== this.#readRequestVersion) return;
          this.clearRentals();
          this.#errorState.value = this.#formatError(error, 'Failed to load rentals');
          this.#loadingState.value = false;
        },
      });
  }
  getEquipmentInformation(equipmentId) {
    return this.#equipmentInformationState.value.get(equipmentId);
  }
  getParticipantInformation(userId) {
    return this.#participantInformationState.value.get(userId);
  }
  approveRentalRequest(requestId) {
    this.#resolveRentalRequest(requestId, RentalRequestStatus.APPROVED);
  }
  rejectRentalRequest(requestId) {
    this.#resolveRentalRequest(requestId, RentalRequestStatus.REJECTED);
  }
  createRentalRequest(rentalRequest) {
    if (!this.#requesterAccess.canSubmitRentalRequest(rentalRequest.constructionUserId)) {
      this.#latestCreatedRequestState.value = null;
      this.#errorState.value = 'Only construction companies can request equipment rental';
      this.#loadingState.value = false;
      return;
    }
    this.#loadingState.value = true;
    this.#errorState.value = null;
    this.#subscriptionRequiredState.value = false;
    this.#latestCreatedRequestState.value = null;
    this.#subscriptionAccess
      .hasActiveSubscription(rentalRequest.rentalCompanyUserId)
      .pipe(
        switchMap((hasActiveSubscription) => {
          if (!hasActiveSubscription) {
            this.#subscriptionRequiredState.value = true;
            this.#loadingState.value = false;
            return EMPTY;
          }
          return forkJoin({
            equipment: this.#equipmentRequestAvailability.assertAvailableForRequest(
              rentalRequest.equipmentId,
              rentalRequest.rentalCompanyUserId,
              rentalRequest.period.startDate,
              rentalRequest.period.endDate,
            ),
            hasOpenBlockingIncident: this.#maintenanceIncidentRestriction.hasOpenBlockingIncident(
              rentalRequest.equipmentId,
            ),
            rentals: this.#rentalsApi.getRentals(),
          }).pipe(
            switchMap(({ hasOpenBlockingIncident, rentals }) => {
              if (hasOpenBlockingIncident) {
                throw new Error('Equipment has an open blocking maintenance incident');
              }
              RentalRequestEligibilityPolicy.ensureNoOverlappingCommittedRental(
                rentalRequest,
                rentals,
              );
              return this.#rentalsApi.createRentalRequest(rentalRequest);
            }),
          );
        }),
        takeUntil(sessionEnded),
      )
      .subscribe({
        next: (createdRequest) => {
          this.#latestCreatedRequestState.value = createdRequest;
          this.#subscriptionRequiredState.value = false;
          this.#loadingState.value = false;
          this.#errorState.value = null;
        },
        error: (error) => {
          this.#errorState.value = this.#formatError(error, 'Failed to create rental request');
          this.#subscriptionRequiredState.value = false;
          this.#loadingState.value = false;
        },
      });
  }
  registerDelivery(rentalId, deliveredAt, notes) {
    if (this.#updatingRentalIdState.value !== null || this.#updatingRequestIdState.value !== null) return;
    const currentRental = this.rentals.value.find((rental) => rental.id === rentalId);
    if (!currentRental) {
      this.#errorState.value = 'Rental not found';
      return;
    }
    const updatedRental = new Rental({
      id: currentRental.id,
      equipmentId: currentRental.equipmentId,
      constructionUserId: currentRental.constructionUserId,
      rentalCompanyUserId: currentRental.rentalCompanyUserId,
      period: currentRental.period,
      status: currentRental.status,
      rentalRequestId: currentRental.rentalRequestId,
    });
    try {
      updatedRental.registerDelivery();
    } catch (error) {
      this.#errorState.value = this.#formatError(error, 'Failed to register delivery');
      return;
    }
    let delivery;
    try {
      delivery = new Delivery({
        id: 0,
        rentalId,
        deliveredAt,
        notes: notes.trim(),
      });
    } catch (error) {
      this.#errorState.value = this.#formatError(error, 'Failed to register delivery');
      return;
    }
    this.#updatingRentalIdState.value = rentalId;
    this.#operationSuccessState.value = null;
    this.#errorState.value = null;
    this.#operations.deliver(currentRental, updatedRental, delivery)
      .pipe(takeUntil(sessionEnded))
      .subscribe({
        next: (savedRental) => {
          this.#rentalsState.value = ((rentals) =>
            rentals.map((rental) => (rental.id === savedRental.id ? savedRental : rental)))(
            this.#rentalsState.value,
          );
          this.#updatingRentalIdState.value = null;
          this.#operationSuccessState.value = 'DELIVERY';
          this.#errorState.value = null;
        },
        error: (error) => {
          this.#updatingRentalIdState.value = null;
          this.#operationSuccessState.value = null;
          this.#errorState.value = this.#formatError(error, 'Failed to register delivery');
        },
      });
  }
  registerReturn(rentalId, returnedAt, notes, maintenanceRequired) {
    if (this.#updatingRentalIdState.value !== null || this.#updatingRequestIdState.value !== null) return;
    const currentRental = this.rentals.value.find((rental) => rental.id === rentalId);
    if (!currentRental) {
      this.#errorState.value = 'Rental not found';
      return;
    }
    const updatedRental = new Rental({
      id: currentRental.id,
      equipmentId: currentRental.equipmentId,
      constructionUserId: currentRental.constructionUserId,
      rentalCompanyUserId: currentRental.rentalCompanyUserId,
      period: currentRental.period,
      status: currentRental.status,
      rentalRequestId: currentRental.rentalRequestId,
    });
    try {
      updatedRental.registerReturn();
    } catch (error) {
      this.#errorState.value = this.#formatError(error, 'Failed to register return');
      return;
    }
    let equipmentReturn;
    try {
      equipmentReturn = new EquipmentReturn({
        id: 0,
        rentalId,
        returnedAt,
        notes: notes.trim(),
        maintenanceRequired,
      });
    } catch (error) {
      this.#errorState.value = this.#formatError(error, 'Failed to register return');
      return;
    }
    this.#updatingRentalIdState.value = rentalId;
    this.#operationSuccessState.value = null;
    this.#errorState.value = null;
    this.#operations.returnEquipment(currentRental, updatedRental, equipmentReturn)
      .pipe(takeUntil(sessionEnded))
      .subscribe({
        next: (savedRental) => {
          this.#rentalsState.value = ((rentals) =>
            rentals.filter((rental) => rental.id !== savedRental.id))(this.#rentalsState.value);
          this.#updatingRentalIdState.value = null;
          this.#operationSuccessState.value = 'RETURN';
          this.#errorState.value = null;
        },
        error: (error) => {
          this.#updatingRentalIdState.value = null;
          this.#operationSuccessState.value = null;
          this.#errorState.value = this.#formatError(error, 'Failed to register return');
        },
      });
  }
  clearForIdentityChange() {
    ++this.#readRequestVersion;
    this.clearRentalRequests();
    this.clearRentalRequestDetail();
    this.clearRentals();
    this.clearCreationState();
    this.#loadingState.value = false;
    this.#updatingRequestIdState.value = null;
    this.#updatingRentalIdState.value = null;
    this.#errorState.value = null;
  }
  clearRentalRequests() {
    this.#rentalRequestsState.value = [];
    this.#equipmentInformationState.value = new Map();
    this.#participantInformationState.value = new Map();
    this.#updatingRequestIdState.value = null;
  }
  clearRentalRequestDetail() {
    this.#selectedRentalRequestState.value = null;
    this.#rentalRequestNotFoundState.value = false;
    this.#equipmentInformationState.value = new Map();
    this.#errorState.value = null;
  }
  clearRentals() {
    this.#rentalsState.value = [];
    this.#equipmentInformationState.value = new Map();
    this.#participantInformationState.value = new Map();
    this.#updatingRentalIdState.value = null;
    this.#operationSuccessState.value = null;
  }
  clearCreationState() {
    this.#latestCreatedRequestState.value = null;
    this.#errorState.value = null;
    this.#subscriptionRequiredState.value = false;
  }
  clearOperationFeedback() {
    this.#errorState.value = null;
    this.#operationSuccessState.value = null;
  }
  #resolveRentalRequest(requestId, targetStatus) {
    if (this.#updatingRentalIdState.value !== null || this.#updatingRequestIdState.value !== null) return;
    const currentRequest = this.rentalRequests.value.find((request) => request.id === requestId);
    if (!currentRequest) {
      this.#errorState.value = 'Rental request not found';
      return;
    }
    if (!currentRequest.isPending) {
      this.#errorState.value = 'Only pending rental requests can be updated';
      return;
    }
    const updatedRequest = new RentalRequest({
      id: currentRequest.id,
      equipmentId: currentRequest.equipmentId,
      constructionUserId: currentRequest.constructionUserId,
      rentalCompanyUserId: currentRequest.rentalCompanyUserId,
      period: currentRequest.period,
      status: currentRequest.status,
      createdAt: currentRequest.createdAt,
    });
    try {
      if (targetStatus === RentalRequestStatus.APPROVED) {
        updatedRequest.approve();
      } else if (targetStatus === RentalRequestStatus.REJECTED) {
        updatedRequest.reject();
      } else {
        return;
      }
    } catch (error) {
      this.#errorState.value = this.#formatError(error, 'Failed to update rental request');
      return;
    }
    this.#updatingRequestIdState.value = requestId;
    this.#errorState.value = null;
    let operation;
    if (targetStatus === RentalRequestStatus.APPROVED) {
      const confirmedRental = new Rental({
        id: 0,
        equipmentId: currentRequest.equipmentId,
        constructionUserId: currentRequest.constructionUserId,
        rentalCompanyUserId: currentRequest.rentalCompanyUserId,
        period: currentRequest.period,
        status: RentalStatus.CONFIRMED,
        rentalRequestId: currentRequest.id,
      });
      operation = this.#operations.approve(updatedRequest, confirmedRental);
    } else {
      operation = this.#rentalsApi.updateRentalRequest(updatedRequest);
    }
    operation.pipe(takeUntil(sessionEnded)).subscribe({
      next: (savedRequest) => {
        this.#rentalRequestsState.value = ((requests) =>
          requests.map((request) => (request.id === savedRequest.id ? savedRequest : request)))(
          this.#rentalRequestsState.value,
        );
        this.#updatingRequestIdState.value = null;
        this.#errorState.value = null;
      },
      error: (error) => {
        this.#updatingRequestIdState.value = null;
        this.#errorState.value = this.#formatError(error, 'Failed to update rental request');
      },
    });
  }
  #formatError(error, fallbackMessage) {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallbackMessage;
  }
}

export const useRentalsStore = defineStore("rentals", () => exposeStore(new RentalsStore()));
registerStore(RentalsStore, useRentalsStore);
