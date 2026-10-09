import { beforeEach, describe, expect, it, vi } from "vitest";
import { defer, of, Subject, throwError } from "rxjs";

const state = vi.hoisted(() => ({
  api: {
    getProfileByUserId: vi.fn(),
    updateProfile: vi.fn(),
    createProfile: vi.fn(),
  },
  ended: null,
}));
vi.mock("../../shared/infrastructure/services.js", async (importOriginal) => {
  const { Subject } = await import("rxjs");
  state.ended = new Subject();
  return {
    ...(await importOriginal()),
    resolve: () => state.api,
    sessionEnded: state.ended,
  };
});
import { ProfilesStore } from "./profiles.store.js";
import { ProfilesAssembler } from "../infrastructure/profiles-assembler.js";

const assembler = new ProfilesAssembler();
const profile = (overrides = {}) =>
  assembler.toEntityFromResource({
    id: 1,
    userId: 7,
    firstName: "Operador",
    lastName: "Prueba",
    contactEmail: "perfil@example.test",
    companyName: "Empresa de prueba",
    ...overrides,
  });
beforeEach(() => vi.resetAllMocks());

describe("Profiles: carga y guardado", () => {
  it.each([
    ["empresa de alquiler", 7, "Alquileres de prueba"],
    ["empresa constructora", 8, "Constructora de prueba"],
  ])("carga la información de %s por usuario", (_, userId, companyName) => {
    const expected = profile({ userId, companyName });
    state.api.getProfileByUserId.mockReturnValue(of(expected));
    const store = new ProfilesStore();
    store.loadProfileByUserId(userId);
    expect(state.api.getProfileByUserId).toHaveBeenCalledWith(userId);
    expect(store.profile.value.companyName).toBe(companyName);
    expect(store.profile.value.firstName).toBe("Operador");
    expect(store.profile.value.contactEmail).toBe("perfil@example.test");
    expect(store.loading.value).toBe(false);
    expect(store.error.value).toBeNull();
  });

  it("permite completar un perfil inexistente creando un registro", async () => {
    state.api.getProfileByUserId.mockReturnValue(of(undefined));
    const store = new ProfilesStore();
    store.loadProfileByUserId(7);
    expect(store.profile.value).toBeUndefined();
    expect(store.error.value).toBeNull();
    const draft = profile({ id: 0 });
    const created = profile({ id: 12 });
    state.api.createProfile.mockReturnValue(of(created));
    expect(await store.updateProfile(draft)).toBe(true);
    expect(state.api.createProfile).toHaveBeenCalledWith(draft);
    expect(state.api.updateProfile).not.toHaveBeenCalled();
    expect(store.profile.value.id).toBe(12);
  });

  it("conserva los campos disponibles cuando la dirección está incompleta", () => {
    const entity = profile({ address: { district: "La Molina" } });
    expect(entity.address.district).toBe("La Molina");
    expect(entity.address.street).toBe("");
    expect(entity.address.city).toBe("");
    expect(entity.address.latitude).toBe(0);
    expect(assembler.toResourceFromEntity(entity).address.district).toBe(
      "La Molina",
    );
  });

  it("actualiza un perfil existente sin crear un duplicado", async () => {
    const edited = profile({ firstName: "Actualizado" });
    state.api.updateProfile.mockReturnValue(of(edited));
    const store = new ProfilesStore();
    expect(await store.updateProfile(edited)).toBe(true);
    expect(store.profile.value.firstName).toBe("Actualizado");
    expect(state.api.updateProfile).toHaveBeenCalledWith(edited);
    expect(state.api.createProfile).not.toHaveBeenCalled();
  });

  it("reintenta un fallo transitorio de actualización y guarda el resultado", async () => {
    const edited = profile();
    let attempts = 0;
    state.api.updateProfile.mockReturnValue(
      defer(() => {
        if (++attempts < 3)
          return throwError(() => new Error("Servicio temporalmente caído"));
        return of(edited);
      }),
    );
    const store = new ProfilesStore();
    expect(await store.updateProfile(edited)).toBe(true);
    expect(attempts).toBe(3);
    expect(store.error.value).toBeNull();
  });

  it("no reintenta la creación para evitar perfiles duplicados", async () => {
    let attempts = 0;
    state.api.createProfile.mockReturnValue(
      defer(() => {
        attempts++;
        return throwError(() => new Error("No se pudo crear el perfil"));
      }),
    );
    const store = new ProfilesStore();
    expect(await store.updateProfile(profile({ id: 0 }))).toBe(false);
    expect(attempts).toBe(1);
    expect(store.error.value).toBe("No se pudo crear el perfil");
    expect(store.loading.value).toBe(false);
  });

  it("una carga anterior no reemplaza el perfil del usuario nuevo", () => {
    const first = new Subject();
    const second = new Subject();
    state.api.getProfileByUserId
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(second);
    const store = new ProfilesStore();
    store.loadProfileByUserId(7);
    store.loadProfileByUserId(8);
    second.next(profile({ userId: 8 }));
    first.next(profile({ userId: 7 }));
    expect(store.profile.value.userId).toBe(8);
  });

  it("permite volver a cargar después de un error", () => {
    state.api.getProfileByUserId
      .mockReturnValueOnce(throwError(() => new Error("Sin conexión")))
      .mockReturnValueOnce(of(profile()));
    const store = new ProfilesStore();
    store.loadProfileByUserId(7);
    expect(store.error.value).toBe("Sin conexión");
    expect(store.loading.value).toBe(false);
    store.loadProfileByUserId(7);
    expect(store.error.value).toBeNull();
    expect(store.profile.value.userId).toBe(7);
  });

  it("descarta el resultado de guardado después de limpiar la sesión", async () => {
    const response = new Subject();
    state.api.updateProfile.mockReturnValue(response);
    const store = new ProfilesStore();
    const pending = store.updateProfile(profile());
    store.clearProfile();
    state.ended.next();
    response.next(profile());
    expect(await pending).toBe(false);
    expect(store.profile.value).toBeUndefined();
    expect(store.loading.value).toBe(false);
    expect(store.error.value).toBeNull();
  });
});
