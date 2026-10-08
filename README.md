# RentBuild — Vue y JavaScript

Base de la aplicación con IAM y Profiles. Los demás contextos se integrarán desde sus ramas cuando sus responsables los preparen.

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
npm run build
npm run preview
```

Las pruebas actuales cubren sesión de ambos roles y carga y guardado de perfiles. La Fake API es para desarrollo y no reemplaza la autenticación y autorización de un backend real.

Para otra API, define VITE_API_BASE_URL en .env.local y VITE_USE_FAKE_API=false. Los datos de ejemplo son locales.

## Integración del equipo

Los PR van a develop. Conserva main para la versión integrada y probada. Al añadir un contexto, registra sus servicios en app.services.js, sus rutas en app.routes.js y sus opciones de navegación en App.vue. Añade únicamente las traducciones y endpoints que requiera ese contexto.

## Créditos

Migración del proyecto MaquiGest de CleanCode a Vue 3 y JavaScript, con identidad visual RentBuild.
