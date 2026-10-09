# TB1: controles, idiomas y navegación accesible

La integración común utiliza PrimeVue **4.5.5** (tag oficial `v4-stable`, licencia MIT) en modo `unstyled`, con `InputText` y `Button` en IAM y Profile. Conserva el CSS del proyecto. El plugin está registrado en `src/main.js`; los componentes se importan en cada vista. No se añadieron Inventory, Rentals, Maintenance ni Subscriptions.

## Idiomas y entrada desde la landing

El idioma inicial es `en-US`. La opción de español usa `es-419`. Las preferencias anteriores `en`, `es`, `en_US` y `es_419` se resuelven al locale canónico sin modificar el valor guardado hasta que el usuario cambie el idioma. `document.documentElement.lang` sigue el idioma elegido. Las traducciones existentes se conservan.

`/iam/sign-up?role=construction_company` y `/iam/sign-up?role=rental_company` preseleccionan el tipo de organización. Una query ausente, no admitida o repetida usa la opción inicial `construction_company`. El selector sigue siendo editable. Esta preferencia no autentica al usuario ni modifica permisos de una sesión.

## Etiquetas, teclado y foco

- Los campos de IAM y Profile tienen etiquetas visibles con `for` y un `id` explícito en el input o select. Se conservan los tipos email/password/tel, los campos obligatorios y el mínimo de contraseña existente.
- Los inputs y botones de PrimeVue elegidos renderizan controles HTML nativos. Tab/Shift+Tab recorren los controles; Enter envía el formulario y Enter/Espacio activan los botones. El selector de organización y la casilla de contraseña conservan el comportamiento nativo de teclado.
- Los formularios muestran `aria-busy` durante una operación y deshabilitan sus fieldsets/botones mientras esperan. El feedback existente anuncia carga/éxito con `role="status"` y errores con `role="alert"`.
- El enlace inicial «Saltar al contenido» apunta a `main-content`, foco programable con `tabindex="-1"`. Links, botones y campos tienen un contorno visible para el foco de teclado.
- Al editar Profile, el foco pasa al primer campo. Al guardar con éxito o cancelar, vuelve al botón de edición.
- El footer ofrece `/terms` en pantallas de acceso y en el workspace. La ruta de términos es pública, tiene títulos y selector de idioma, y describe el alcance académico de la demo en inglés y español.

## Validación y límites

`npm test` pasa **43/43**: los 18 tests existentes de IAM/Profile, 16 de resolución/catálogo de idioma y 9 de la query de registro. `npm run build` y `git diff --check` pasan. No se modificaron las reglas de dominio, stores ni adaptadores de IAM/Profile.

Estos checks comprueban compilación e invariantes locales; no certifican accesibilidad completa. La revisión visual local comprobó el enlace de salto por teclado, foco al editar y cancelar Profile, cambio EN/ES, términos sin sesión y desde el workspace, controles PrimeVue renderizados y registro por ambos segmentos desde la landing. A 375 × 812 px no se observó desbordamiento horizontal en acceso. Al abrir los términos, el foco pasa al main con su título accesible. Los dos CTA se probaron con una URL local configurada; la URL pública sigue pendiente del despliegue del equipo. No se realizó una prueba de lector de pantalla ni una evaluación formal de conformidad Material Design/WCAG.

Fuentes primarias: [configuración unstyled de PrimeVue 4.5.5](https://github.com/primefaces/primevue/blob/4.5.5/apps/showcase/doc/configuration/UnstyledDoc.vue), [InputText de PrimeVue 4.5.5](https://github.com/primefaces/primevue/blob/4.5.5/packages/primevue/src/inputtext/InputText.vue), [licencia y versión del paquete](https://registry.npmjs.org/primevue/4.5.5).
