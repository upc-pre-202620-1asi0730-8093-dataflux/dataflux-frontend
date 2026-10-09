import { test, expect } from "@playwright/test";
let rentalEmail;

for (const role of ["rental_company", "construction_company"]) {
  test(`registration, login and profile editing for ${role}`, async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem("language", "es-419"));
    const email = `qa-${role}-${Date.now()}@rentbuild.example`;
    if (role === "rental_company") rentalEmail = email;
    const errors = [];
    const failedRequests = [];
    page.on("response", (response) => {
      if (response.url().includes("/api/v1/") && response.status() >= 400)
        failedRequests.push(
          `${response.status()} ${new URL(response.url()).pathname}`,
        );
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/iam/sign-up");
    await page.getByLabel("Nombres", { exact: true }).fill("Prueba");
    await page.getByLabel("Apellidos", { exact: true }).fill("DataFlux");
    await page
      .getByLabel("Nombre de la empresa", { exact: true })
      .fill("Empresa de prueba");
    await page.getByLabel("Correo electrónico", { exact: true }).fill(email);
    await page
      .getByRole("combobox", { name: /Tipo de organización/ })
      .selectOption(role);
    await page.getByLabel("Contraseña", { exact: true }).fill("RentBuild123!");
    await page
      .getByLabel("Confirmar contraseña", { exact: true })
      .fill("RentBuild123!");
    await page
      .getByRole("button", { name: "Crear cuenta", exact: true })
      .click();
    await expect(page).toHaveURL(/\/iam\/sign-in/);
    await page.getByLabel("Correo electrónico", { exact: true }).fill(email);
    await page.getByLabel("Contraseña", { exact: true }).fill("RentBuild123!");
    await page
      .getByRole("button", { name: "Iniciar sesión", exact: true })
      .click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(
      page.getByText("Invalid PrimeUI License", { exact: true }),
    ).toHaveCount(0);
    await page.goto("/profiles/profile");
    for (const title of [
      "Información personal",
      "Información de contacto",
      "Información de la organización",
    ]) {
      await expect(
        page.getByRole("heading", { name: title, exact: true }),
      ).toBeVisible();
    }
    await page
      .getByRole("button", { name: "Editar perfil", exact: true })
      .click();
    await page
      .getByLabel("Nombre de la empresa", { exact: true })
      .fill("Empresa actualizada");
    await page
      .getByRole("button", { name: "Guardar cambios", exact: true })
      .click();
    await expect(
      page.getByText("Empresa actualizada", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText("Empresa actualizada", { exact: true }),
    ).toBeVisible();
    if (role === "rental_company") {
      await page.goto("/subscriptions/plans");
      await page
        .getByRole("button", { name: "Seleccionar plan", exact: true })
        .last()
        .click();
      await page
        .getByRole("button", { name: "Confirmar", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Plan actual", exact: true }),
      ).toBeVisible();
      await page.goto("/inventory/equipment/new");
      await page.getByLabel("Código", { exact: true }).fill("QA-001");
      await page.getByLabel("Nombre", { exact: true }).fill("Excavadora QA");
      await page
        .getByLabel("Descripción", { exact: true })
        .fill("Equipo de prueba");
      await page.getByLabel("Ubicación", { exact: true }).fill("Lima");
      const category = page.getByLabel("Categoría", { exact: true });
      await expect(category.locator("option").nth(1)).toBeAttached();
      await category.selectOption(
        await category.locator("option").nth(1).getAttribute("value"),
      );
      await page.getByLabel("Tarifa diaria", { exact: true }).fill("15");
      await page.getByLabel("Tarifa semanal", { exact: true }).fill("80");
      await page.getByLabel("Moneda", { exact: true }).selectOption("USD");
      await page
        .getByRole("button", { name: "Registrar maquinaria", exact: true })
        .click();
      await expect(page).toHaveURL(/\/inventory\/equipment$/);
      const row = page.getByRole("row").filter({ hasText: "Excavadora QA" });
      await expect(row).toContainText(/(?:USD|US\$)/);
      await row
        .getByRole("link", { name: "Editar maquinaria", exact: true })
        .click();
      await expect(page.getByLabel("Moneda", { exact: true })).toHaveValue(
        "USD",
      );
      await page.getByLabel("Tarifa diaria", { exact: true }).fill("16");
      await page
        .getByRole("button", { name: "Actualizar maquinaria", exact: true })
        .click();
      await expect(page).toHaveURL(/\/inventory\/equipment$/);
      await expect(row).toContainText(/(?:USD|US\$)/);
      for (const path of [
        "/rentals/requests",
        "/rentals/active",
        "/maintenance",
        "/maintenance/incidents",
      ]) {
        await page.goto(path);
        await expect(page).toHaveURL(new RegExp(path + "$"));
        await expect(page.locator("main h1")).toBeVisible();
      }
    } else {
      await page.goto("/inventory/search");
      await expect(
        page.getByText("Excavadora QA", { exact: true }),
      ).toBeVisible();
      await page
        .getByRole("link", { name: "Ver detalles", exact: true })
        .first()
        .click();
      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + 2);
      const day = (value) =>
        `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
      await page
        .getByLabel("Fecha de inicio", { exact: true })
        .fill(day(start));
      await page.getByLabel("Fecha de fin", { exact: true }).fill(day(end));
      await page
        .getByRole("button", { name: "Consultar disponibilidad", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Solicitar alquiler", exact: true }),
      ).toBeEnabled();
      await page
        .getByRole("button", { name: "Solicitar alquiler", exact: true })
        .click();
      await expect(
        page.getByText("Solicitud de alquiler registrada correctamente.", {
          exact: true,
        }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Cerrar sesión", exact: true })
        .click();
      await expect(page).toHaveURL(/\/iam\/sign-in/);
      await page
        .getByLabel("Correo electrónico", { exact: true })
        .fill(rentalEmail);
      await page
        .getByLabel("Contraseña", { exact: true })
        .fill("RentBuild123!");
      await page
        .getByRole("button", { name: "Iniciar sesión", exact: true })
        .click();
      await expect(page).toHaveURL(/\/dashboard/);
      await page.goto("/rentals/requests");
      await page.getByRole("button", { name: "Aprobar", exact: true }).click();
      await expect(
        page.getByRole("row").filter({ hasText: "Excavadora QA" }),
      ).toContainText("Aprobada");
      await page.goto("/rentals/active");
      await page
        .getByRole("button", { name: "Registrar entrega", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Confirmar entrega", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Registrar devolución", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Registrar devolución", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Confirmar devolución", exact: true })
        .click();
      await expect(
        page.getByText(
          "La devolución se registró correctamente y el alquiler fue completado.",
          { exact: true },
        ),
      ).toBeVisible();
    }
    await page
      .getByRole("button", { name: "Cerrar sesión", exact: true })
      .click();
    await expect(page).toHaveURL(/\/iam\/sign-in/);
    expect(errors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });
}
