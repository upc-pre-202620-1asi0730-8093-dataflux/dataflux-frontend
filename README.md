# RentBuild — Vue y JavaScript

Aplicación integrada de RentBuild con IAM, Profiles, Inventory, Rentals, Subscriptions, Maintenance y Shared. Las ramas de trabajo se sincronizan con develop para compartir la misma base funcional.

## Ejecutar en WebStorm

Abre la carpeta que contiene package.json y usa la terminal PowerShell. Requisitos: Node.js 22.18 o superior, npm y Git.

```powershell
npm ci
npm run dev:mock
```

Abre http://127.0.0.1:5173. La Fake API inicia en http://127.0.0.1:3000/api/v1. Ctrl+C detiene ambos procesos. También puedes usar npm run api y npm run dev en terminales separadas.

La base publicada no contiene usuarios. Registra cuentas ficticias, eligiendo empresa de alquiler o constructora. El registro crea el perfil de la empresa. Los datos generados permanecen en server/db.json: no los incluyas en commits.

## Estructura

```text
public/                      # Logo y símbolo de RentBuild
src/
  app/
    iam/                     # Registro, login y sesión
    profiles/                # Consulta y edición de perfil
    shared/                  # Transporte HTTP, idiomas y componentes comunes
    App.vue                  # Componente principal
    app.routes.js            # Rutas y control de sesión
    app.services.js          # Composición de servicios
  environments/              # URL de API y modo simulado
  locales/                   # Español e inglés
  main.js                    # Inicio de Vue
  i18n.js                    # Configuración de idiomas
  styles.css                 # Estilos globales
server/                      # Fake API local de usuarios y perfiles
index.html
package.json
package-lock.json
vite.config.js
jsconfig.json
.gitignore
```

Cada contexto organiza domain, infrastructure, application y presentation. Las pruebas se mantienen dentro de las carpetas existentes. .idea, .vscode, node_modules, dist y los archivos .env no se suben.

## Validación

```powershell
npm test
npx vitest run scripts/domain-http.test.js
npm run test:e2e
npm run build
npm run preview
```

Las pruebas cubren sesión de ambos roles, perfiles, suscripciones, preferencias de idioma, validación monetaria y transporte HTTP. Las pruebas de navegador usan una copia aislada de los datos y comprueban registro, ingreso, edición del perfil, planes y maquinaria. La Fake API es para desarrollo y no reemplaza la autenticación y autorización de un backend real.

Para otra API, define VITE_API_BASE_URL en .env.local y VITE_USE_FAKE_API=false. Los datos de ejemplo son locales.

## Integración del equipo

Los PR van a develop. Conserva main para la versión integrada y probada. La composición de servicios y adaptadores ACL está en src/app/app.services.js; las rutas y los controles de acceso están en src/app/app.routes.js. Al ampliar un contexto, conecta sus servicios, rutas, traducciones y endpoints en esos archivos.

Todas las ramas feature contienen la base integrada. Cada integrante modifica su contexto y su PR muestra solamente los cambios posteriores a la última sincronización con develop. Los commits nuevos deben usar Conventional Commits en inglés, por ejemplo `fix(iam): prevent stale session responses` o `feat(profiles): add company contact validation`.

Antes de continuar, guarda tus cambios y actualiza tu rama con git fetch origin y git merge origin/develop. No copies ni vuelvas a añadir toda la base para generar tu commit.

## Créditos

Migración del proyecto MaquiGest de CleanCode a Vue 3 y JavaScript, con identidad visual RentBuild.
