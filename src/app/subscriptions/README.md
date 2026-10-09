# Subscriptions — demo académica TB1

Integra el contexto Subscriptions recibido en el paquete Vue compartido por el equipo, adaptado a la composición y las rutas de la base común de `develop`. Este aporte incluye la integración, las correcciones de vigencia y sesión, la interfaz de confirmación y sus pruebas.

El contexto permite consultar planes de referencia y registrar una selección o un cambio de plan con la Fake API de RentBuild. La ruta `/subscriptions/plans` requiere una sesión de empresa de alquiler (`rental_company`) en la interfaz. El control del navegador no constituye autorización de un backend real.

## Comportamiento

- El catálogo muestra planes `ACTIVE` con precios, nombres y características en inglés o español. Los formatos usan `en-US` y `es-419`; se aceptan los alias `en`, `es`, `en_US` y `es_419`.
- El plan actual debe pertenecer al usuario, tener estado `ACTIVE` e incluir el momento consultado en su periodo. Una fila vencida o futura no se presenta como suscripción vigente.
- Seleccionar un plan abre una confirmación antes de escribir. La vista bloquea nuevas confirmaciones durante la solicitud y bloquea selección y confirmación si falla la carga. El botón de reintento vuelve a consultar catálogo y suscripción.
- Una nueva selección registra un mes calendario desde la confirmación, ajustando el día al último día del mes siguiente cuando corresponda. Cambiar un plan aún vigente conserva su periodo y su preferencia de renovación.
- Después de recargar una suscripción vencida se puede seleccionar el mismo plan y crear otro registro, conservando el anterior. Si el periodo cargado vence antes de confirmar un cambio, el store calcula un periodo nuevo para el registro actualizado.
- El mensaje de éxito aparece después de recibir la suscripción guardada. La vista traduce errores conocidos y usa mensajes generales para detalles técnicos inesperados. Una respuesta inválida exige recargar: una escritura puede haberse persistido antes de fallar su conversión a entidad.
- Cerrar sesión restablece catálogo, suscripción, errores y estados de carga; las respuestas de solicitudes anteriores no modifican una sesión nueva. Un ingreso posterior puede volver a cargar los planes sin recargar el navegador.

Los precios y las características son datos de referencia de la demo. No hay pasarela de pago, cobros, facturas, prorrateo, tareas programadas de renovación ni aplicación de límites comerciales a otros contextos. `autoRenew` es una preferencia guardada; no ejecuta renovaciones ni cobros.

## Ejecutar

Desde la raíz del repositorio, con Node.js 22.18 o superior:

```powershell
npm ci
npm run dev:mock
```

Vite sirve la interfaz en `http://127.0.0.1:5173` y la Fake API en `http://127.0.0.1:3000/api/v1`. Registra una cuenta ficticia de empresa de alquiler y abre Planes en la navegación. El catálogo de referencia está en `server/db.json`; la base entregada no necesita cuentas ni suscripciones personales. Las interacciones locales escriben en esa base: no incluir cuentas ni datos generados en los commits.

`VITE_API_BASE_URL` configura la URL de la API; por defecto apunta a la API local. `VITE_USE_FAKE_API=false` selecciona el modo previsto para una API compatible, pero esta feature no implementa ni verifica un backend de producción. `npm run build` genera archivos estáticos y no inicia la Fake API.

## Contrato utilizado

Todas las rutas siguientes son relativas a `VITE_API_BASE_URL`:

| Método | Ruta                       | Uso                                                                        |
| ------ | -------------------------- | -------------------------------------------------------------------------- |
| `GET`  | `/subscription-plans`      | Consultar el catálogo; mostrar únicamente planes activos.                  |
| `GET`  | `/user-subscriptions`      | Consultar registros; seleccionar localmente el vigente del usuario actual. |
| `POST` | `/user-subscriptions`      | Registrar una nueva suscripción de demo.                                   |
| `PUT`  | `/user-subscriptions/{id}` | Guardar un cambio de plan o actualizar un periodo cargado que venció.      |

Los planes incluyen `id`, `name`, `description`, `priceAmount`, `priceCurrency`, `billingCycle` y `status`. Los registros de suscripción incluyen `id`, `userId`, `planId`, `startDate`, `endDate`, `status` y `autoRenew`; las fechas se serializan como ISO 8601. La Fake API ofrece colecciones para desarrollo y no aplica aislamiento por empresa, permisos comerciales ni concurrencia transaccional. El filtrado en el cliente solo sirve a esta demostración.

## Frontera y validaciones

`application` coordina estado y operaciones; `infrastructure` adapta recursos HTTP; `presentation` contiene ruta, vista y formatos. Las dependencias comunes se limitan a transporte, composición y componentes de `shared`; no se importa otro contexto de negocio.

Los value objects `Money` y `DateRange` son locales al contexto para que la feature funcione sobre la base actual de `develop`, que no trae las implementaciones equivalentes en Shared. Esta ubicación es una decisión temporal de integración: se conserva su API y no se añade un Shared alternativo ni dependencias de otro contexto.

- `Money` exige un número finito y no negativo y un código de moneda de tres letras ASCII; normaliza espacios y mayúsculas. Valida también sus setters y conserva el valor previo si una modificación falla. Valida la sintaxis del código, sin mantener un registro ISO de monedas. Usa `number` para precios de demostración, sin garantizar aritmética monetaria exacta.
- `DateRange` exige dos objetos `Date` válidos y un intervalo no negativo. `contains` y `overlaps` incluyen ambos extremos; las consultas inválidas devuelven `false`. Las entradas y los getters usan copias defensivas para conservar el periodo. Los getters siguen devolviendo `Date` para el assembler y el store.
- Los formatos visuales muestran un guion cuando una fecha o un importe es inválido; no convierten datos corruptos en precios o periodos válidos. Las fechas visibles usan la zona horaria del navegador.

## Verificar

```powershell
npm test -- src/app/subscriptions
npm run build
```

Las pruebas del contexto cubren vigencia y renovación mensual, cambios que preservan periodos, confirmaciones repetidas, respuestas pendientes tras cambiar de identidad, importes y monedas inválidos, intervalos y límites inclusivos, copias defensivas, locales y traducción de errores. Para comprobar la interfaz: entrar como empresa de alquiler, cambiar de idioma, elegir y cancelar un plan, confirmar y recargar, cambiar a otro plan, y simular una carga fallida para comprobar el bloqueo y el reintento. El despliegue de la interfaz requiere una Fake API accesible o un backend compatible; este contexto no declara una URL pública de producción.
