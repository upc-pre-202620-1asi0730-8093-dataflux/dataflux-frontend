import { CompanyProfile } from "../domain/model/company-profile.entity.js";
import { Address } from "../domain/value-object/address.value-object.js";
export class ProfilesAssembler {
  toEntitiesFromResponse(response) {
    return response.profiles.map((resource) =>
      this.toEntityFromResource(resource),
    );
  }
  toEntityFromResource(resource) {
    const address = resource.address ?? {};
    return new CompanyProfile({
      id: resource.id,
      userId: resource.userId,
      firstName: resource.firstName ?? "",
      lastName: resource.lastName ?? "",
      contactEmail: resource.contactEmail ?? "",
      phoneNumber: resource.phoneNumber ?? "",
      companyName: resource.companyName ?? "",
      address: new Address({
        street: address.street ?? "",
        district: address.district ?? "",
        city: address.city ?? "",
        country: address.country ?? "",
        latitude: address.latitude ?? 0,
        longitude: address.longitude ?? 0,
      }),
    });
  }
  toResourceFromEntity(entity) {
    return {
      id: entity.id,
      userId: entity.userId,
      firstName: entity.firstName,
      lastName: entity.lastName,
      contactEmail: entity.contactEmail,
      phoneNumber: entity.phoneNumber,
      companyName: entity.companyName,
      address: {
        street: entity.address.street,
        district: entity.address.district,
        city: entity.address.city,
        country: entity.address.country,
        latitude: entity.address.latitude,
        longitude: entity.address.longitude,
      },
    };
  }
}
