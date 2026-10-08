import { register, resolve, sessionEnded } from './shared/infrastructure/services.js';
import { environment } from '../environments/environment.js';
import { SIGN_IN_PORT } from './iam/infrastructure/sign-in.port.js';
import { SignInApiEndpoint } from './iam/infrastructure/sign-in-api-endpoint.js';
import { FakeSignInApiEndpoint } from './iam/infrastructure/fake-sign-in-api-endpoint.js';
import { SUBSCRIPTION_ACCESS_PORT } from './rentals/infrastructure/subscription-access.port.js';
import { SubscriptionAccessAclAdapter } from './rentals/infrastructure/subscription-access-acl-adapter.js';
import { EQUIPMENT_INFORMATION_PORT } from './rentals/infrastructure/equipment-information.port.js';
import { InventoryEquipmentInformationAclAdapter } from './rentals/infrastructure/inventory-equipment-information-acl-adapter.js';
import { PARTICIPANT_INFORMATION_PORT } from './rentals/infrastructure/participant-information.port.js';
import { ProfilesParticipantInformationAclAdapter } from './rentals/infrastructure/profiles-participant-information-acl-adapter.js';
import { EQUIPMENT_OPERATION_PORT } from './rentals/infrastructure/equipment-operation.port.js';
import { InventoryEquipmentOperationAclAdapter } from './rentals/infrastructure/inventory-equipment-operation-acl-adapter.js';
import { INVENTORY_ACCESS_PORT } from './inventory/infrastructure/inventory-access.port.js';
import { SubscriptionInventoryAccessAclAdapter } from './inventory/infrastructure/subscription-inventory-access-acl-adapter.js';
import { MAINTENANCE_EQUIPMENT_INFORMATION_PORT } from './maintenance/infrastructure/equipment-information.port.js';
import { InventoryEquipmentInformationAclAdapter as MaintenanceInventoryEquipmentInformationAclAdapter } from './maintenance/infrastructure/inventory-equipment-information-acl-adapter.js';
import { MAINTENANCE_ACCESS_PORT } from './maintenance/infrastructure/maintenance-access.port.js';
import { SubscriptionMaintenanceAccessAclAdapter } from './maintenance/infrastructure/subscription-maintenance-access-acl-adapter.js';
import { MAINTENANCE_EQUIPMENT_OPERATION_PORT } from './maintenance/infrastructure/equipment-incident-operation.port.js';
import { InventoryEquipmentIncidentOperationAclAdapter } from './maintenance/infrastructure/inventory-equipment-incident-operation-acl-adapter.js';
import { MAINTENANCE_RENTAL_ACTIVITY_PORT } from './maintenance/infrastructure/rental-activity.port.js';
import { RentalsRentalActivityAclAdapter } from './maintenance/infrastructure/rentals-rental-activity-acl-adapter.js';
import { EQUIPMENT_REQUEST_AVAILABILITY_PORT } from './rentals/infrastructure/equipment-request-availability.port.js';
import { InventoryEquipmentRequestAvailabilityAclAdapter } from './rentals/infrastructure/inventory-equipment-request-availability-acl-adapter.js';
import { MAINTENANCE_INCIDENT_RESTRICTION_PORT } from './rentals/infrastructure/maintenance-incident-restriction.port.js';
import { MaintenanceIncidentRestrictionAclAdapter } from './rentals/infrastructure/maintenance-incident-restriction-acl-adapter.js';
import { RENTAL_REQUESTER_ACCESS_PORT } from './rentals/infrastructure/rental-requester-access.port.js';
import { IamRentalRequesterAccessAclAdapter } from './rentals/infrastructure/iam-rental-requester-access-acl-adapter.js';
import { EQUIPMENT_RENTAL_REQUEST_PORT } from './inventory/infrastructure/equipment-rental-request.port.js';
import { RentalsEquipmentRentalRequestAclAdapter } from './inventory/infrastructure/rentals-equipment-rental-request-acl-adapter.js';
import { IamStore } from './iam/application/iam.store.js';
import { ProfilesStore } from './profiles/application/profiles.store.js';
import { InventoryStore } from './inventory/application/inventory.store.js';
import { RentalsStore } from './rentals/application/rentals.store.js';
import { SubscriptionsStore } from './subscriptions/application/subscriptions.store.js';
import { MaintenanceStore } from './maintenance/application/maintenance.store.js';
import { IncidentStore } from './maintenance/application/incident.store.js';
export function configureServices() {
  register(SIGN_IN_PORT, environment.production ? SignInApiEndpoint : FakeSignInApiEndpoint);
  register(SUBSCRIPTION_ACCESS_PORT, SubscriptionAccessAclAdapter);
  register(EQUIPMENT_INFORMATION_PORT, InventoryEquipmentInformationAclAdapter);
  register(PARTICIPANT_INFORMATION_PORT, ProfilesParticipantInformationAclAdapter);
  register(EQUIPMENT_REQUEST_AVAILABILITY_PORT, InventoryEquipmentRequestAvailabilityAclAdapter);
  register(MAINTENANCE_INCIDENT_RESTRICTION_PORT, MaintenanceIncidentRestrictionAclAdapter);
  register(RENTAL_REQUESTER_ACCESS_PORT, IamRentalRequesterAccessAclAdapter);
  register(EQUIPMENT_OPERATION_PORT, InventoryEquipmentOperationAclAdapter);
  register(EQUIPMENT_RENTAL_REQUEST_PORT, RentalsEquipmentRentalRequestAclAdapter);
  register(INVENTORY_ACCESS_PORT, SubscriptionInventoryAccessAclAdapter);
  register(
    MAINTENANCE_EQUIPMENT_INFORMATION_PORT,
    MaintenanceInventoryEquipmentInformationAclAdapter,
  );
  register(MAINTENANCE_RENTAL_ACTIVITY_PORT, RentalsRentalActivityAclAdapter);
  register(MAINTENANCE_EQUIPMENT_OPERATION_PORT, InventoryEquipmentIncidentOperationAclAdapter);
  register(MAINTENANCE_ACCESS_PORT, SubscriptionMaintenanceAccessAclAdapter);
}
export function useServices() {
  return {
    iam: resolve(IamStore),
    profiles: resolve(ProfilesStore),
    inventory: resolve(InventoryStore),
    rentals: resolve(RentalsStore),
    subscriptions: resolve(SubscriptionsStore),
    maintenance: resolve(MaintenanceStore),
    incidents: resolve(IncidentStore),
  };
}
export function clearSessionData() {
  sessionEnded.next();
  const s = useServices();
  s.profiles.clearProfile();
  s.inventory.clearEquipment();
  s.inventory.clearSaveState();
  s.inventory.refreshCategories();
  s.rentals.clearForIdentityChange();
  s.subscriptions.clearCurrentSubscription();
  s.maintenance.clear();
  s.incidents.clear();
}
