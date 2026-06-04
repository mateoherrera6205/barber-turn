# BarberTurn

Sistema de gestión de turnos para barberías. Permite a los barberos administrar sus slots horarios y a los clientes reservar turnos. Incluye analytics histórico y predicciones de demanda basadas en datos reales.

---

## Requisitos

- [Node.js](https://nodejs.org/) v22.x
- [Meteor](https://www.meteor.com/install) v3.4.1
- [MongoDB](https://www.mongodb.com/) v6.x (local o Atlas)

---

## Instalación en un equipo nuevo

### 1. Instalar Node.js v22

Usando [nvm](https://github.com/nvm-sh/nvm) (recomendado):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc   # o ~/.zshrc según tu shell
nvm install 22
nvm use 22
```

### 2. Instalar Meteor

```bash
curl https://install.meteor.com/ | sh
```

Verificar que la versión sea la correcta:

```bash
meteor --version
# Meteor 3.4.1
```

### 3. Clonar el repositorio

```bash
git clone <url-del-repo>
cd barber-turn
```

### 4. Instalar dependencias npm del proyecto

```bash
meteor npm install
```

### 5. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto o exportar las variables:

```bash
export MONGO_URL='mongodb://localhost:27017/barberturn'
export ROOT_URL='http://localhost:3000'
export PORT=3000
```

> Si usás MongoDB Atlas reemplazá `MONGO_URL` con tu connection string completo.

### 6. Levantar la aplicación en modo desarrollo

```bash
meteor run
```

La app queda disponible en [http://localhost:3000](http://localhost:3000).

---

## Usuarios de prueba

El sistema genera automáticamente datos históricos y usuarios de prueba al arrancar por primera vez si la base de datos está vacía.

| Rol | Email | Contraseña |
|-----|-------|------------|
| Barbero (demo) | `barbero@demo.com` | `123456` |
| Barbero | `carlos@barberturn.com` | `123456` |
| Barbero | `luis@barberturn.com` | `123456` |
| Barbero | `pedro@barberturn.com` | `123456` |
| Cliente | `juan@test.com` | `123456` |
| Cliente | `maria@test.com` | `123456` |

---

## Estructura del proyecto

```
barber-turn/
├── client/
│   └── main.jsx              # Punto de entrada del cliente
├── server/
│   └── main.js               # Punto de entrada del servidor
├── imports/
│   ├── api/
│   │   ├── appointments/     # Colección, métodos y publicaciones de turnos
│   │   ├── slots/            # Colección, métodos y publicaciones de slots
│   │   ├── users/            # Métodos de registro de usuarios
│   │   ├── predictions/      # Algoritmo de predicción de demanda
│   │   └── analytics/        # Publicaciones de analytics
│   ├── ui/
│   │   ├── pages/            # LoginPage, RegisterPage, DashboardPage, BookingPage, AnalyticsPage, PredictionPage
│   │   ├── components/       # AppointmentCard, SlotCard, SlotGenerator, PrivateRoute
│   │   └── hooks/            # useAuth, useAppointments, useSlots, useAnalytics, usePredictions
│   ├── startup/server/
│   │   └── accounts.js       # Validación y hooks del sistema de cuentas
│   └── utils/
│       └── constants.js      # Roles, rutas y estados globales
└── bot/
    └── seed.js               # Bot de simulación de datos históricos realistas
```

---

## Scripts disponibles

```bash
meteor run                    # Desarrollo con hot reload
meteor run --production       # Desarrollo en modo producción
meteor build ../output        # Generar bundle para deploy
meteor test                   # Correr tests
```

---

## Deploy (bundle)

Para generar el bundle de producción:

```bash
meteor build ../barber-turn-output --server-only
```

El bundle generado en `../barber-turn-output/bundle/` incluye un `README` y un `Dockerfile` con las instrucciones de deploy. Ver ese `README` para los pasos exactos.

Variables de entorno requeridas en producción:

```bash
MONGO_URL=mongodb://...
ROOT_URL=https://tu-dominio.com
PORT=3000
```
