# Comandos de creación de la estructura de carpetas:
# Directorios de Assets
mkdir -p src/assets/images,src/assets/fonts
mkdir -p src/styles

# Directorios de la Capa de Frontend y Testing
mkdir -p src/features/asesoria,src/features/perfil
mkdir -p src/tests

# Directorios de la Capa de Backend (src/server) y Lógica Interna
mkdir -p src/server/api/controllers
mkdir -p src/server/lib/ports,src/server/lib/adapters,src/server/lib/db,src/server/lib/domain,src/server/lib/auth
# Features y Testing del Backend
mkdir -p src/server/lib/features/asesoria,src/server/lib/features/perfil
mkdir -p src/server/lib/tests
mkdir -p src/server/tests

##
# Instalación de dependencias de Testing (desarrollo)
pnpm install vitest playwright @playwright/test @astrojs/ts-plugin -D