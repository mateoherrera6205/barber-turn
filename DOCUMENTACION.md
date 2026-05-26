# BarberTurn — Documentación Técnica Exhaustiva

> Generada el 2026-05-25 a partir del código fuente. Refleja el estado actual del proyecto.

---

## Tabla de Contenidos

1. [Visión General del Proyecto](#1-visión-general-del-proyecto)
2. [Estructura de Carpetas](#2-estructura-de-carpetas)
3. [Capa de Datos (Colecciones MongoDB)](#3-capa-de-datos-colecciones-mongodb)
4. [Methods (Mutations del servidor)](#4-methods-mutations-del-servidor)
5. [Publications (Queries reactivas)](#5-publications-queries-reactivas)
6. [Capa de UI](#6-capa-de-ui)
7. [Autenticación y Autorización](#7-autenticación-y-autorización)
8. [Flujos Completos del Sistema](#8-flujos-completos-del-sistema)
9. [Constantes y Configuración](#9-constantes-y-configuración)
10. [Cómo Correr el Proyecto](#10-cómo-correr-el-proyecto)
11. [Estado Actual y Pendientes](#11-estado-actual-y-pendientes)

---

## 1. Visión General del Proyecto

### Nombre y Propósito

**BarberTurn** es una aplicación web de gestión de turnos para barberías. Permite a los barberos configurar sus horarios disponibles y a los clientes reservar turnos en tiempo real.

**Caso de uso real:**
1. Un barbero inicia sesión y define qué horas tiene disponibles ese día (ej.: 09:00, 10:00, 14:00).
2. Un cliente inicia sesión, ve los turnos libres y reserva uno.
3. El barbero ve el turno en su dashboard y lo confirma o cancela.
4. Cuando un slot se ocupa, desaparece de la vista del cliente **automáticamente** (reactivo en tiempo real vía DDP/WebSockets, sin polling).

### Stack Tecnológico Completo

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework full-stack | Meteor | 3.4.1 |
| Base de datos | MongoDB (vía paquete Meteor `mongo`) | 2.3.0 (paquete) / npm-mongo 6.16.1 |
| UI Library | React | 18.2.0 |
| Routing cliente | React Router DOM | 7.15.1 |
| Integración Meteor-React | react-meteor-data | 4.0.1 |
| Bundler | Rspack (reemplaza Webpack) | 1.1.0 (paquete) / @meteorjs/rspack 2.0.1 |
| Transpilador | SWC (vía Rspack) + Babel | - |
| TypeScript (disponible) | typescript (paquete Meteor) | 5.10.0 |
| Autenticación | accounts-base + accounts-password | 3.2.1 / 3.2.3 |
| Data fetching reactivo | TanStack React Query | 5.100.14 (instalado, no usado aún) |
| Protocolo cliente-servidor | DDP (Distributed Data Protocol) — WebSockets | ddp 1.4.2 |
| Node.js (runtime de Meteor) | Node.js | bundled con Meteor 3.4.1 |

### Arquitectura General

```
┌─────────────────────────────────────────────────────┐
│                   CLIENTE (Browser)                  │
│  React 18 + React Router v7                          │
│  useTracker() → suscripción reactiva a MongoDB       │
│  Meteor.call() → invoca methods en servidor          │
└──────────────────┬──────────────────────────────────┘
                   │  DDP sobre WebSocket
┌──────────────────▼──────────────────────────────────┐
│                  SERVIDOR (Node.js/Meteor)            │
│  Meteor.publish() → cursor reactivo de MongoDB       │
│  Meteor.methods() → mutaciones con validación        │
│  Accounts → autenticación                            │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                  MongoDB                             │
│  Colecciones: slots, appointments, users             │
└──────────────────────────────────────────────────────┘
```

**Flujo de datos reactivo:** Cuando el servidor modifica un documento en MongoDB, Meteor detecta el cambio (observer de MongoDB), lo envía por WebSocket al cliente vía DDP, y actualiza el MiniMongo local del navegador. Los componentes React suscritos via `useTracker` se re-renderizan automáticamente.

---

## 2. Estructura de Carpetas

```
barber-turn/
├── .meteor/                        # Configuración interna de Meteor
│   ├── packages                    # Paquetes Meteor instalados
│   ├── versions                    # Versiones exactas de cada paquete (lock)
│   ├── release                     # Versión de Meteor: METEOR@3.4.1
│   └── .id                         # ID único del proyecto
│
├── _build/                         # Artefactos de build (ignorar en desarrollo)
│   ├── main-dev/                   # Build de desarrollo
│   ├── main-prod/                  # Build de producción
│   └── test/                       # Build de tests
│
├── client/
│   ├── main.html                   # Punto de entrada HTML: define <div id="react-target">
│   ├── main.jsx                    # Punto de entrada JS del cliente: monta React en #react-target
│   └── main.css                    # CSS global mínimo (body padding)
│
├── server/
│   └── main.js                     # Punto de entrada del servidor: importa todo + crea usuario demo
│
├── imports/                        # Código lazy-loaded (Meteor sólo carga lo que se importa)
│   ├── api/                        # Capa de datos y lógica de negocio (server + shared)
│   │   ├── appointments/
│   │   │   ├── appointments.js         # Colección MongoDB 'appointments'
│   │   │   ├── appointments.methods.js # Methods: book, updateStatus, cancel
│   │   │   └── appointments.publications.js # Publications: myBarber, today + slots.available (duplicada)
│   │   ├── slots/
│   │   │   ├── slots.js                # Colección MongoDB 'slots' (fuente única de verdad)
│   │   │   ├── slots.methods.js        # Methods: generateForDay
│   │   │   └── slots.publications.js   # Publications: slots.available, slots.myDay
│   │   ├── users/
│   │   │   └── users.methods.js        # Method: users.register
│   │   └── links.js                    # Colección 'links' (residuo del template inicial, NO USADA)
│   │
│   ├── startup/
│   │   └── server/
│   │       └── accounts.js             # Hooks de Accounts: validateNewUser + onCreateUser
│   │
│   ├── ui/                         # Capa de presentación (sólo cliente)
│   │   ├── App.jsx                  # Raíz React: define el router con todas las rutas
│   │   ├── styles.css               # Sistema de diseño completo con CSS variables
│   │   ├── meteor-logo.svg          # Asset SVG del logo de Meteor (del template)
│   │   │
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx        # Página de inicio de sesión
│   │   │   ├── RegisterPage.jsx     # Página de registro de usuario
│   │   │   ├── DashboardPage.jsx    # Dashboard del barbero (ruta /dashboard)
│   │   │   └── BookingPage.jsx      # Página de reserva del cliente (componente listo, NO conectado al router aún)
│   │   │
│   │   ├── components/
│   │   │   ├── PrivateRoute.jsx     # Guarda de ruta: verifica autenticación y rol
│   │   │   ├── AppointmentCard.jsx  # Tarjeta de turno con botones Confirmar/Cancelar
│   │   │   └── SlotGenerator.jsx    # UI para que el barbero configure sus horas disponibles
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js           # Datos reactivos del usuario autenticado
│   │   │   ├── useAppointments.js   # Suscripción y datos de turnos del barbero
│   │   │   └── useSlots.js          # Suscripción y datos de slots disponibles (hook creado, no usado en páginas aún)
│   │   │
│   │   └── startup/                 # Archivos vacíos (residuo del template)
│   │       ├── client/index.js
│   │       └── server/
│   │           ├── accounts.js
│   │           └── index.js
│   │
│   └── utils/
│       └── constants.js             # Constantes del dominio: ROLES, ROUTES, APPOINTMENT_STATUS
│
├── tests/
│   └── main.js                      # Tests básicos del template (no tests de dominio)
│
├── rspack.config.js                 # Configuración de Rspack: soporte SVG como componente React
├── .swcrc                           # Configuración SWC: JSX automatic runtime
├── package.json                     # Dependencias npm y configuración de Meteor
└── DOCUMENTACION.md                 # Este archivo
```

### Decisiones Arquitectónicas

**¿Por qué `imports/`?**
En Meteor, los archivos fuera de `imports/` se cargan automáticamente en el orden del sistema de archivos. Los archivos dentro de `imports/` son lazy — sólo se ejecutan cuando algo los importa. Esto permite control total sobre el orden de carga y evita efectos secundarios no deseados.

**¿Por qué `client/main.jsx` y `server/main.js` separados?**
Meteor tiene dos entry points: uno para el cliente y otro para el servidor, definidos en `package.json → meteor.mainModule`. Desde estos archivos se importa todo lo necesario para cada contexto.

**¿Por qué Rspack en lugar de Webpack?**
Rspack es un bundler compatible con Webpack pero escrito en Rust. Ofrece tiempos de compilación significativamente más rápidos. `@meteorjs/rspack` es la integración oficial del equipo de Meteor.

---

## 3. Capa de Datos (Colecciones MongoDB)

### 3.1 Colección `slots`

**Archivo:** `imports/api/slots/slots.js`

```js
export const Slots = new Mongo.Collection('slots');
```

Representa un hueco de tiempo disponible en la agenda de un barbero.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `_id` | String | ID generado automáticamente por MongoDB |
| `barberId` | String | `userId` del barbero propietario del slot |
| `date` | Date | Fecha del slot (normalizada a medianoche, ej.: `2026-05-25T00:00:00.000Z`) |
| `hour` | String | Hora en formato `"HH:MM"` (ej.: `"09:00"`, `"14:30"`) |
| `isAvailable` | Boolean | `true` = libre para reservar, `false` = ya ocupado |
| `appointmentId` | String \| null | ID del turno asociado si está ocupado, `null` si libre |
| `createdAt` | Date | Fecha de creación del slot |

**Relaciones:**
- `barberId` → `Meteor.users._id`
- `appointmentId` → `appointments._id` (nullable)

**Índices:** Ninguno definido explícitamente. Los queries frecuentes son por `{ barberId, date }` y `{ date, isAvailable }` — se recomienda crear índices compuestos en producción.

---

### 3.2 Colección `appointments`

**Archivo:** `imports/api/appointments/appointments.js`

```js
export const Appointments = new Mongo.Collection('appointments');
```

Representa una reserva de turno realizada por un cliente.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `_id` | String | ID generado automáticamente |
| `slotId` | String | Referencia al slot reservado |
| `clientName` | String | Nombre del cliente |
| `clientPhone` | String | Teléfono del cliente |
| `barberId` | String | `userId` del barbero (copiado desde el slot al crear) |
| `date` | Date | Fecha del turno (copiada desde el slot) |
| `hour` | String | Hora del turno (copiada desde el slot, ej.: `"10:00"`) |
| `status` | String | Estado: `'pending'` \| `'confirmed'` \| `'cancelled'` |
| `createdAt` | Date | Fecha de creación de la reserva |
| `updatedAt` | Date | Fecha de última actualización del estado (agregado por `updateStatus`) |
| `cancelledAt` | Date | Fecha de cancelación (agregado por `cancel`) |

**Relaciones:**
- `slotId` → `slots._id`
- `barberId` → `Meteor.users._id`

---

### 3.3 Colección `users` (Meteor.users)

Gestionada por el paquete `accounts-base`. No es una colección custom, pero tiene campos del perfil del dominio.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `_id` | String | ID del usuario |
| `emails[].address` | String | Email del usuario |
| `emails[].verified` | Boolean | Si el email fue verificado |
| `profile.name` | String | Nombre completo del usuario |
| `profile.role` | String | Rol: `'barbero'` \| `'cliente'` |
| `profile.createdAt` | Date | Fecha de creación del perfil |
| `services.password` | Object | Hash de contraseña (gestionado por accounts-password) |
| `createdAt` | Date | Timestamp de creación (Meteor lo agrega automáticamente) |

---

### 3.4 Colección `links` (NO USADA)

**Archivo:** `imports/api/links.js`

```js
export const LinksCollection = new Mongo.Collection('links');
```

Residuo del template inicial de Meteor. No está importada en ningún archivo activo del proyecto. Puede eliminarse con seguridad.

---

## 4. Methods (Mutations del Servidor)

### 4.1 `users.register`

**Archivo:** `imports/api/users/users.methods.js`

**Descripción:** Crea una nueva cuenta de usuario con rol asignado.

**Parámetros:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `name` | String | Nombre completo del usuario |
| `email` | String | Dirección de email (usada como login) |
| `password` | String | Contraseña en texto plano (Meteor la hashea internamente) |
| `role` | String | Rol: `'barbero'` o `'cliente'` |

**Validaciones:**
- `check(name, String)` — name debe ser string
- `check(email, String)` — email debe ser string
- `check(password, String)` — password debe ser string
- `check(role, String)` — role debe ser string
- El hook `Accounts.validateNewUser` en `imports/startup/server/accounts.js` valida que `role` sea `'barbero'` o `'cliente'`; si no, lanza `Meteor.Error('invalid-role')`

**Lógica paso a paso:**
1. Valida los tipos de los parámetros con `check()`
2. Llama a `Accounts.createUser({ email, password, profile: { name, role } })`
3. `Accounts.onCreateUser` en `accounts.js` intercepta la creación y construye el `profile` final con `createdAt`
4. Retorna el `userId` del usuario creado

**Retorna:** `String` — el `_id` del usuario recién creado

**Errores posibles:**
- `invalid-role` — el rol no es ni `'barbero'` ni `'cliente'`
- `Email already exists` — Meteor lanza este error si el email ya está registrado

**Nota:** Este método **no es async** (usa la API callback/sync de `Accounts.createUser`). En Meteor 3.x esto es compatible pero se recomienda migrar a la variante async.

---

### 4.2 `slots.generateForDay`

**Archivo:** `imports/api/slots/slots.methods.js`

**Descripción:** Genera o reemplaza los slots disponibles de un barbero para un día específico. Sólo elimina los slots libres (no toca los ocupados).

**Parámetros:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `date` | Date | Fecha del día a configurar (debe ser medianoche UTC) |
| `hours` | [String] | Array de horas en formato `"HH:MM"` (ej.: `["09:00","10:00"]`) |

**Validaciones:**
- `check(date, Date)` — debe ser un objeto Date
- `check(hours, [String])` — debe ser array de strings
- `if (!this.userId)` → lanza `Meteor.Error('not-logged-in')` si no hay sesión activa

**Lógica paso a paso:**
1. Verifica que el usuario esté autenticado
2. Elimina todos los slots del barbero para ese día que estén libres (`isAvailable: true`), preservando los ya reservados
3. Para cada hora en `hours`, inserta un nuevo slot con `isAvailable: true` y `appointmentId: null`

**Retorna:** `undefined`

**Errores posibles:**
- `not-logged-in` — usuario no autenticado

**Comportamiento importante:** Si un slot ya está ocupado (`isAvailable: false`) para ese día, no se elimina. Esto protege los turnos ya reservados cuando el barbero reconfigura su agenda.

---

### 4.3 `appointments.book`

**Archivo:** `imports/api/appointments/appointments.methods.js`

**Descripción:** Reserva un turno disponible para un cliente. Crea el appointment y marca el slot como ocupado.

**Parámetros:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `slotId` | String | ID del slot a reservar |
| `clientName` | String | Nombre del cliente |
| `clientPhone` | String | Teléfono del cliente |

**Validaciones:**
- `check(slotId, String)`
- `check(clientName, String)`
- `check(clientPhone, String)`
- Verifica que el slot exista y esté disponible (`isAvailable: true`); si no, lanza `slot-unavailable`

**Lógica paso a paso:**
1. Busca el slot con `Slots.findOneAsync({ _id: slotId, isAvailable: true })`
2. Si el slot no existe o no está disponible, lanza error
3. Crea el appointment con los datos del cliente + datos copiados del slot (`barberId`, `date`, `hour`)
4. Actualiza el slot: `isAvailable: false`, `appointmentId: <nuevo id>`
5. Retorna el `appointmentId`

**Retorna:** `String` — el `_id` del appointment creado

**Errores posibles:**
- `slot-unavailable` — el slot no existe o ya fue reservado (condición de carrera cubierta)

**Nota sobre concurrencia:** El `findOneAsync` + `updateAsync` no es atómico. En producción con alta concurrencia podría haber una condición de carrera. La solución robusta sería usar una operación atómica de MongoDB (`findOneAndUpdate` con `$set: { isAvailable: false }` como condición).

---

### 4.4 `appointments.updateStatus`

**Archivo:** `imports/api/appointments/appointments.methods.js`

**Descripción:** Cambia el estado de un turno. Si se cancela, libera el slot correspondiente.

**Parámetros:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `appointmentId` | String | ID del turno a actualizar |
| `status` | String | Nuevo estado: `'pending'`, `'confirmed'` o `'cancelled'` |

**Validaciones:**
- `check(appointmentId, String)`
- `check(status, String)`
- Verifica que `status` esté en `Object.values(APPOINTMENT_STATUS)` → `['pending', 'confirmed', 'cancelled']`
- Verifica que el appointment exista; si no, lanza `not-found`
- Verifica que `this.userId === appt.barberId`; si no, lanza `not-authorized`

**Lógica paso a paso:**
1. Valida parámetros y autenticación
2. Busca el appointment
3. Verifica que el usuario autenticado sea el barbero propietario
4. Actualiza el `status` y agrega `updatedAt`
5. Si el nuevo status es `'cancelled'`, también actualiza el slot: `isAvailable: true`, `appointmentId: null` (libera el hueco)

**Retorna:** `undefined`

**Errores posibles:**
- `invalid-status` — el status enviado no es válido
- `not-found` — el appointment no existe
- `not-authorized` — el usuario no es el barbero del turno

---

### 4.5 `appointments.cancel`

**Archivo:** `imports/api/appointments/appointments.methods.js`

**Descripción:** Cancela un turno y libera el slot. Similar a `updateStatus` con `'cancelled'` pero sin verificación de rol de barbero (puede ser llamado por el cliente).

**Parámetros:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `appointmentId` | String | ID del turno a cancelar |

**Validaciones:**
- `check(appointmentId, String)`
- Verifica que el appointment exista; si no, lanza `not-found`

**Lógica paso a paso:**
1. Busca el appointment
2. Actualiza status a `'cancelled'` y agrega `cancelledAt`
3. Libera el slot: `isAvailable: true`, `appointmentId: null`

**Retorna:** `undefined`

**Errores posibles:**
- `not-found` — el appointment no existe

**Diferencia con `appointments.updateStatus`:** `cancel` NO verifica que `this.userId === appt.barberId`, lo que en teoría permite que cualquier usuario autenticado cancele cualquier turno. **Es una vulnerabilidad de autorización pendiente de corregir.**

---

## 5. Publications (Queries Reactivas)

### 5.1 `slots.available`

**Archivos:** `imports/api/slots/slots.publications.js` y `imports/api/appointments/appointments.publications.js`

> **ADVERTENCIA:** Esta publication está definida dos veces. La definición en `appointments.publications.js` usa `check` sin importarlo, lo que causará un error en runtime. La version correcta está en `slots.publications.js`.

**Descripción:** Publica todos los slots disponibles para una fecha específica. Usada por el cliente para ver qué horas puede reservar.

**Parámetros:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `date` | Date | Fecha para filtrar slots |

**Query:** `Slots.find({ date, isAvailable: true })`

**Cuándo usarla:** En la vista del cliente (`BookingPage`) para mostrar los turnos que se pueden reservar. Cuando un slot se ocupa, desaparece del cursor reactivo del cliente automáticamente.

---

### 5.2 `slots.myDay`

**Archivo:** `imports/api/slots/slots.publications.js`

**Descripción:** Publica todos los slots del barbero autenticado para una fecha (libres y ocupados).

**Parámetros:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `date` | Date | Fecha a consultar |

**Validaciones:**
- `check(date, Date)`
- Si `!this.userId` → `this.ready()` (no publica nada)

**Query:** `Slots.find({ barberId: this.userId, date })`

**Cuándo usarla:** Para que el barbero vea su configuración del día (qué horas configuró, cuáles están libres y cuáles ocupadas). **Esta publication existe pero no está siendo usada en ningún componente actualmente.**

---

### 5.3 `appointments.myBarber`

**Archivo:** `imports/api/appointments/appointments.publications.js`

**Descripción:** Publica todos los turnos activos (no cancelados) del barbero autenticado, ordenados cronológicamente.

**Parámetros:** Ninguno

**Validaciones:**
- Si `!this.userId` → `this.ready()`

**Query:** `Appointments.find({ barberId: this.userId, status: { $ne: 'cancelled' } }, { sort: { date: 1, hour: 1 } })`

**Cuándo usarla:** Para listar el historial de turnos del barbero. **Esta publication existe pero no está siendo usada en ningún componente actualmente.**

---

### 5.4 `appointments.today`

**Archivo:** `imports/api/appointments/appointments.publications.js`

**Descripción:** Publica todos los turnos del barbero autenticado para el día de hoy (de medianoche a 23:59:59).

**Parámetros:** Ninguno

**Validaciones:**
- Si `!this.userId` → `this.ready()`

**Query:**
```js
Appointments.find({
  barberId: this.userId,
  date: { $gte: start, $lte: end }  // start = hoy 00:00, end = hoy 23:59:59.999
})
```

**Cuándo usarla:** En el Dashboard del barbero para mostrar los turnos de hoy. Es la que usa el hook `useAppointments`.

---

## 6. Capa de UI

### 6.1 Páginas

#### `LoginPage` — `/login`

**Archivo:** `imports/ui/pages/LoginPage.jsx`

**Rol requerido:** Ninguno (pública)

**Qué renderiza:** Formulario de login con campos de email y contraseña, enlace a `/register`, y manejo de errores.

**Hooks usados:** `useState` (React) para email, password y error

**Lógica:**
1. Llama a `Meteor.loginWithPassword(email, password, callback)`
2. En el callback, lee `Meteor.user()?.profile?.role`
3. Si es `'barbero'` → navega a `/dashboard`; si es `'cliente'` → navega a `/booking`

**Métodos de Meteor llamados:** `Meteor.loginWithPassword` (no es un method HTTP, es parte del protocolo DDP de accounts)

---

#### `RegisterPage` — `/register`

**Archivo:** `imports/ui/pages/RegisterPage.jsx`

**Rol requerido:** Ninguno (pública)

**Qué renderiza:** Formulario de registro con campos de nombre, email, contraseña y selector de rol (cliente/barbero).

**Estado local:** `form = { name, email, password, role }` con `useState`

**Lógica:**
1. Llama a `Meteor.call('users.register', form, callback)`
2. Si hay error, muestra el mensaje
3. Si el registro es exitoso, llama a `Meteor.loginWithPassword` para logear automáticamente
4. Redirige según el rol

**Métodos de Meteor llamados:** `users.register`

---

#### `DashboardPage` — `/dashboard`

**Archivo:** `imports/ui/pages/DashboardPage.jsx`

**Rol requerido:** `'barbero'` (protegida por `PrivateRoute`)

**Qué renderiza:**
- Header con nombre del barbero y botón de logout
- 3 tarjetas de estadísticas: Pendientes, Confirmados, Total hoy
- Componente `SlotGenerator` para configurar horas del día
- Lista de `AppointmentCard` para cada turno del día

**Hooks usados:**
- `useAuth()` — para obtener el nombre del barbero
- `useAppointments()` — para obtener los turnos de hoy
- `useNavigate()` — para redirigir tras logout
- `useState` no tiene estado propio; los estados viven en los hooks

**Lógica de logout:**
```js
const handleLogout = () => {
  Meteor.logout(() => navigate('/login'));
};
```

**Dato importante:** `today` se calcula con `setHours(0, 0, 0, 0)` (medianoche local) y se pasa al `SlotGenerator`.

---

#### `BookingPage` — Componente listo pero NO conectado al router

**Archivo:** `imports/ui/pages/BookingPage.jsx`

**Estado:** Implementada como componente pero la ruta `/booking` en `App.jsx` renderiza sólo `<h1>Reservar Turno ✂️</h1>` en lugar de este componente.

**Props:**
| Prop | Tipo | Descripción |
|------|------|-------------|
| `selectedDate` | Date | Fecha para la que se muestran los slots disponibles |

**Qué renderiza:** Lista de botones, uno por slot disponible, con la hora.

**Hooks usados:** `useTracker` directamente (no usa el hook `useSlots` que también existe)

**Suscripción:** `Meteor.subscribe('slots.available', { date: selectedDate })`

**Query local:** `Slots.find({ isAvailable: true }).fetch()`

**Métodos de Meteor llamados:** `appointments.book`

**Problema de implementación:** Los datos del cliente (`clientName`, `clientPhone`) están hardcodeados como `'Juan Pérez'` y `'0991234567'`. Falta conectar con los datos reales del usuario autenticado o un formulario.

---

### 6.2 Componentes

#### `PrivateRoute`

**Archivo:** `imports/ui/components/PrivateRoute.jsx`

**Props:**
| Prop | Tipo | Descripción |
|------|------|-------------|
| `children` | ReactNode | El componente a renderizar si el acceso está permitido |
| `requiredRole` | String | Rol requerido: `'barbero'` o `'cliente'` |

**Lógica:**
1. Mientras `isLoading` → muestra `<p>Cargando...</p>`
2. Si `!isLoggedIn` → redirige a `/login`
3. Si el rol no coincide → redirige: barbero va a `/dashboard`, cliente va a `/booking`
4. Si todo OK → renderiza `children`

**Hooks usados:** `useAuth()`

---

#### `AppointmentCard`

**Archivo:** `imports/ui/components/AppointmentCard.jsx`

**Props:**
| Prop | Tipo | Descripción |
|------|------|-------------|
| `appointment` | Object | Documento de appointment de MongoDB |

**Qué renderiza:** Tarjeta con hora, nombre del cliente, teléfono, badge de estado (coloreado), y botones Confirmar/Cancelar si el estado es `'pending'`.

**Colores por estado:**
- `pending` → `#f59e0b` (amarillo)
- `confirmed` → `#10b981` (verde)
- `cancelled` → `#ef4444` (rojo)

**Métodos de Meteor llamados:**
- `appointments.updateStatus` con `status: 'confirmed'` (botón Confirmar)
- `appointments.updateStatus` con `status: 'cancelled'` (botón Cancelar)

**Nota:** Los botones sólo se muestran si el `status === 'pending'`. Los turnos confirmados y cancelados son de sólo lectura.

---

#### `SlotGenerator`

**Archivo:** `imports/ui/components/SlotGenerator.jsx`

**Props:**
| Prop | Tipo | Descripción |
|------|------|-------------|
| `date` | Date | Fecha para la que se generan los slots |

**Horas predeterminadas hardcodeadas:**
```js
const DEFAULT_HOURS = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'];
```

**Estado local:**
- `selected: []` — array de horas seleccionadas
- `saved: false` — indica si el último guardado fue exitoso

**Lógica de toggle:** Al hacer click en una hora, si ya está seleccionada se deselecciona y viceversa. El botón "Guardar" se muestra deshabilitado si no hay horas seleccionadas.

**Métodos de Meteor llamados:** `slots.generateForDay({ date, hours: selected })`

---

### 6.3 Hooks Personalizados

#### `useAuth`

**Archivo:** `imports/ui/hooks/useAuth.js`

**Descripción:** Hook reactivo que expone los datos del usuario autenticado. Se re-ejecuta automáticamente cuando cambia la sesión.

**Retorna:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `user` | Object \| null | Documento completo del usuario de Meteor.users |
| `userId` | String \| null | ID del usuario autenticado |
| `isLoggedIn` | Boolean | `true` si hay sesión activa |
| `isLoading` | Boolean | `true` mientras Meteor está verificando la sesión (evita flashes) |
| `role` | String \| null | `'barbero'`, `'cliente'` o `null` |
| `isBarbero` | Boolean | Shorthand para `role === 'barbero'` |
| `isCliente` | Boolean | Shorthand para `role === 'cliente'` |
| `name` | String | Nombre del usuario o string vacío |

**Tecnología:** `useTracker` de `react-meteor-data` — el hook de Meteor que hace reactivo el componente React ante cambios en la sesión.

---

#### `useAppointments`

**Archivo:** `imports/ui/hooks/useAppointments.js`

**Descripción:** Suscribe al barbero autenticado a sus turnos del día y retorna los datos reactivos.

**No recibe parámetros.**

**Retorna:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `isLoading` | Boolean | `true` mientras la suscripción no está lista |
| `appointments` | Array | Turnos del día ordenados por hora (`sort: { hour: 1 }`) |

**Publication usada:** `appointments.today`

**Query local MiniMongo:** `Appointments.find({}, { sort: { hour: 1 } }).fetch()`

**Nota:** El filtro del día está en el servidor (publication). El cliente recibe sólo los documentos del día actual.

---

#### `useSlots`

**Archivo:** `imports/ui/hooks/useSlots.js`

**Descripción:** Hook creado pero no usado en ninguna página actualmente. Está destinado a la `BookingPage` pero esa página tiene su propio `useTracker` inline.

**Parámetros:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `date` | Date | Fecha para filtrar slots |

**Retorna:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `isLoading` | Boolean | `true` mientras la suscripción no está lista |
| `slots` | Array | Slots disponibles para la fecha dada |

**Publication usada:** `slots.available`

**Query local:** `Slots.find({ date }).fetch()` — nota: no filtra por `isAvailable: true` en el cliente (ese filtro está en el servidor).

---

## 7. Autenticación y Autorización

### Flujo de Registro

```
RegisterPage
    │
    ▼ Meteor.call('users.register', { name, email, password, role })
    │
    ▼ [servidor] users.methods.js
    │   check() valida tipos
    │   Accounts.createUser({ email, password, profile: { name, role } })
    │
    ▼ [servidor] imports/startup/server/accounts.js → validateNewUser
    │   Verifica que role sea 'barbero' o 'cliente'
    │   Si no → lanza Meteor.Error('invalid-role')
    │
    ▼ [servidor] accounts.js → onCreateUser
    │   Construye user.profile = { name, role, createdAt }
    │   Retorna el user con el profile correcto
    │
    ▼ [cliente] callback de 'users.register'
        Llama a Meteor.loginWithPassword(email, password)
        Redirige según rol
```

### Flujo de Login

```
LoginPage
    │
    ▼ Meteor.loginWithPassword(email, password, callback)
    │   (DDP, no es un Meteor.method custom)
    │
    ▼ [servidor] accounts-password verifica credenciales en Meteor.users
    │
    ▼ [cliente] callback
        Lee Meteor.user()?.profile?.role
        Si 'barbero' → navigate('/dashboard')
        Si 'cliente' → navigate('/booking')
        Si error → muestra mensaje de error
```

### Sistema de Roles

| Rol | Valor en DB | Puede hacer |
|-----|-------------|-------------|
| Barbero | `'barbero'` | Acceder a `/dashboard`, generar slots, confirmar/cancelar turnos |
| Cliente | `'cliente'` | Acceder a `/booking`, reservar turnos |

### Protección de Rutas (Cliente)

`PrivateRoute` en `imports/ui/components/PrivateRoute.jsx` wrappea cada ruta protegida. Evalúa:
1. ¿Está la sesión cargando? → espera
2. ¿Hay sesión? → si no, redirige a `/login`
3. ¿El rol coincide con `requiredRole`? → si no, redirige a la ruta del rol correcto

```jsx
// App.jsx — ejemplo de uso
<Route path="/dashboard" element={
  <PrivateRoute requiredRole="barbero">
    <DashboardPage />
  </PrivateRoute>
} />
```

### Protección de Methods (Servidor)

Cada method verifica manualmente las condiciones necesarias:

- **Autenticación:** `if (!this.userId) throw new Meteor.Error('not-logged-in')`
- **Autorización de rol:** `if (this.userId !== appt.barberId) throw new Meteor.Error('not-authorized')`
- **Existencia de recursos:** `if (!appt) throw new Meteor.Error('not-found')`

### Estado de Seguridad Actual

> **IMPORTANTE:** El proyecto tiene los paquetes `autopublish` e `insecure` activados en `.meteor/packages`. Estos son paquetes de prototipado que:
> - `autopublish` → publica TODOS los documentos de TODAS las colecciones a TODOS los clientes
> - `insecure` → permite escribir en MongoDB directamente desde el cliente sin pasar por los methods

**Ambos deben eliminarse antes de ir a producción** con:
```bash
meteor remove autopublish
meteor remove insecure
```

---

## 8. Flujos Completos del Sistema

### Flujo 1: Barbero Genera Slots del Día

```
1. DashboardPage monta → calcula today = new Date() con setHours(0,0,0,0)
2. Pasa date={today} a <SlotGenerator date={today} />
3. SlotGenerator renderiza 8 botones con DEFAULT_HOURS
4. Barbero hace click en horas deseadas (toggle: selected/deselected)
5. Barbero hace click en "Guardar slots"
6. [cliente] Meteor.call('slots.generateForDay', { date: today, hours: selected })
7. [servidor] slots.methods.js:
   a. check(date, Date) ✓
   b. check(hours, [String]) ✓
   c. Verifica this.userId ✓
   d. Slots.removeAsync({ barberId: userId, date, isAvailable: true })
      → elimina sólo slots libres de hoy, protege los reservados
   e. for (hour of hours) → Slots.insertAsync({ barberId, date, hour, isAvailable: true, ... })
8. MongoDB actualiza → Meteor detecta cambios
9. [cliente] Cualquier suscripción activa a slots se actualiza reactivamente
10. Callback del call: setSaved(true) → botón muestra "✓ Guardado"
```

### Flujo 2: Cliente Reserva un Turno

```
1. [Pendiente de conectar BookingPage al router]
   Por ahora la ruta /booking muestra <h1>Reservar Turno ✂️</h1>

Flujo completo cuando se conecte BookingPage:

1. BookingPage monta con selectedDate
2. useTracker: Meteor.subscribe('slots.available', { date: selectedDate })
3. [servidor] publication slots.available retorna cursor de Slots { date, isAvailable: true }
4. [cliente] MiniMongo recibe los slots; Slots.find({ isAvailable: true }).fetch() retorna el array
5. BookingPage renderiza un botón por slot con la hora
6. Cliente hace click en un horario → bookSlot(slot._id)
7. [cliente] Meteor.call('appointments.book', { slotId, clientName: 'Juan Pérez', clientPhone: '...' })
8. [servidor] appointments.methods.js:
   a. check() valida tipos
   b. Slots.findOneAsync({ _id: slotId, isAvailable: true }) → verifica disponibilidad
   c. Appointments.insertAsync({ slotId, clientName, clientPhone, barberId, date, hour, status:'pending', ... })
   d. Slots.updateAsync(slotId, { $set: { isAvailable: false, appointmentId } })
9. MongoDB actualiza ambas colecciones
10. [TIEMPO REAL] La publication slots.available detecta que isAvailable cambió a false
    → el slot se elimina del cursor reactivo
    → todos los clientes suscritos ven desaparecer ese slot automáticamente
11. [TIEMPO REAL] La publication appointments.today del barbero detecta el nuevo appointment
    → aparece en el dashboard del barbero sin refrescar
12. Callback del call: alert con el appointmentId
```

### Flujo 3: Barbero Confirma o Cancela un Turno

```
1. DashboardPage suscrito a 'appointments.today' via useAppointments()
2. Lista de AppointmentCard renderizadas, cada una con estado 'pending'
3. Barbero hace click en "Confirmar":
   Meteor.call('appointments.updateStatus', { appointmentId, status: 'confirmed' })
4. [servidor] appointments.methods.js:
   a. Valida parámetros
   b. Verifica que status sea válido
   c. Appointments.findOneAsync(appointmentId)
   d. Verifica this.userId === appt.barberId (autorización)
   e. Appointments.updateAsync(appointmentId, { $set: { status: 'confirmed', updatedAt } })
   f. status NO es 'cancelled' → el slot NO se modifica
5. MongoDB actualiza el appointment
6. [TIEMPO REAL] useAppointments se actualiza → AppointmentCard re-renderiza
   → badge cambia a verde 'confirmed', botones desaparecen

Si el barbero hace click en "Cancelar":
4e. Appointments.updateAsync → status: 'cancelled'
4f. status ES 'cancelled' → Slots.updateAsync(appt.slotId, { $set: { isAvailable: true, appointmentId: null } })
    → el slot vuelve a estar disponible para nuevas reservas
5. [TIEMPO REAL] Dos actualizaciones reactivas:
   → AppointmentCard cambia a rojo 'cancelled'
   → Si hay clientes suscritos a slots.available, el slot vuelve a aparecer
```

### Flujo 4: Realtime — Propagación de Cambios

```
Cliente A reserva un slot             Cliente B (otro cliente)
         │                                     │
         ▼                                     │
Meteor.call('appointments.book')               │
         │                                     │
         ▼                                     │
[servidor] Slots.updateAsync(...)              │
         │                                     │
         ▼                                     │
[MongoDB] isAvailable: false ──────────────────▼
         │                          Meteor observer detecta el cambio
         │                          (MongoDB oplog tailer en prod,
         │                           polling en dev)
         │                                     │
         │                                     ▼
         │                          DDP: servidor envía mensaje
         │                          { msg: 'changed', collection: 'slots',
         │                            id: slotId, fields: { isAvailable: false } }
         │                                     │
         │                                     ▼
         │                          MiniMongo del cliente B actualiza
         │                                     │
         │                                     ▼
         │                          useTracker re-ejecuta
         │                                     │
         │                                     ▼
         │                          Slots.find reactivo → nuevo array
         │                                     │
         │                                     ▼
         │                          React re-renderiza BookingPage
         │                          → el slot desaparece de la lista
         ▼
callback del call ejecuta
alert(`Turno reservado! ID: ${appointmentId}`)
```

---

## 9. Constantes y Configuración

### Constantes del Dominio

**Archivo:** `imports/utils/constants.js`

```js
export const ROLES = {
  BARBERO: 'barbero',
  CLIENTE: 'cliente',
};

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  BOOKING: '/booking',
};

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
};
```

**Nota:** `ROLES` y `ROUTES` están definidos pero **no se usan** en los componentes actuales (usan strings literales directamente). Se recomienda migrar todas las referencias a estas constantes.

### Constantes de UI (SlotGenerator)

```js
// imports/ui/components/SlotGenerator.jsx (hardcoded, no en constants.js)
const DEFAULT_HOURS = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'];
```

Las horas omitidas son `13:00` (horario de almuerzo) y las horas posteriores a las 17:00.

### Variables de Entorno

Meteor no requiere archivo `.env`. La configuración de entorno se pasa como variables de shell o mediante el archivo `settings.json`.

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `MONGO_URL` | URI de conexión a MongoDB | `mongodb://127.0.0.1:3001/meteor` (Meteor inicia MongoDB local automáticamente en dev) |
| `ROOT_URL` | URL base de la app | `http://localhost:3000` |
| `PORT` | Puerto del servidor | `3000` |
| `METEOR_SETTINGS` | JSON de configuración de la app | No configurado |

Para producción, pasar `MONGO_URL` a un MongoDB externo (ej.: Atlas) y `ROOT_URL` al dominio real.

### Usuario Demo (Seed)

El servidor crea automáticamente un usuario demo si no hay usuarios en la base de datos:

```js
// server/main.js
{
  email: 'barbero@demo.com',
  password: '123456',
  profile: { name: 'Carlos el Barbero', role: 'barbero' }
}
```

---

## 10. Cómo Correr el Proyecto

### Requisitos Previos

| Requisito | Versión mínima | Instalación |
|-----------|----------------|-------------|
| Node.js | 18+ (bundled con Meteor) | Automático al instalar Meteor |
| Meteor CLI | 3.4.1 | `npm install -g meteor` |
| Sistema operativo | Linux / macOS / Windows WSL2 | — |

MongoDB **no necesita instalación manual** — Meteor inicia su propia instancia de MongoDB local en desarrollo.

### Instalación

```bash
# 1. Clonar el repositorio (si aplica)
git clone <url-del-repo>
cd barber-turn

# 2. Instalar Meteor (si no está instalado)
curl https://install.meteor.com/ | sh

# 3. Instalar dependencias npm
meteor npm install

# 4. Correr en desarrollo
meteor run
```

### Desarrollo

```bash
meteor run
# App disponible en: http://localhost:3000
# MongoDB disponible en: mongodb://127.0.0.1:3001/meteor
# Meteor DevTools: http://localhost:3000/__meteor__/
```

El servidor inicia con Hot Module Replacement (HMR) activo — los cambios en el cliente se reflejan sin recargar la página. Los cambios en el servidor recargan el servidor automáticamente.

### Producción (Build + Deploy)

```bash
# Build para producción
meteor build ./output --architecture os.linux.x86_64

# El archivo generado es un tarball Node.js
cd output
tar -xzf barber-turn.tar.gz
cd bundle/programs/server
npm install

# Iniciar el servidor
MONGO_URL="mongodb://..." ROOT_URL="https://tudominio.com" PORT=3000 node main.js
```

**Deploy a Galaxy (plataforma oficial de Meteor):**
```bash
DEPLOY_HOSTNAME=galaxy.meteor.com meteor deploy tuapp.meteorapp.com --settings settings.json
```

### Tests

```bash
# Correr tests una vez
meteor test --once --driver-package meteortesting:mocha

# Correr tests en modo watch
TEST_WATCH=1 meteor test --full-app --driver-package meteortesting:mocha

# Visualizar bundle (análisis de tamaño)
meteor --production --extra-packages bundle-visualizer
```

---

## 11. Estado Actual y Pendientes

### Completamente Implementado

- [x] **Autenticación:** registro, login, logout con roles (barbero/cliente)
- [x] **Protección de rutas** por rol con `PrivateRoute`
- [x] **Generación de slots:** el barbero puede configurar sus horas disponibles para el día
- [x] **Dashboard del barbero:** muestra turnos del día con estadísticas (pendientes, confirmados, total)
- [x] **Confirmar turno:** el barbero puede cambiar status a `confirmed`
- [x] **Cancelar turno:** el barbero puede cambiar status a `cancelled` y libera el slot automáticamente
- [x] **Reactividad en tiempo real:** cambios en MongoDB se propagan automáticamente a todos los clientes suscritos vía DDP/WebSockets
- [x] **Validación de datos** con el paquete `check` en todos los methods
- [x] **Usuario demo** creado automáticamente en el primer startup
- [x] **Hooks personalizados:** `useAuth`, `useAppointments`, `useSlots`
- [x] **Sistema de diseño CSS** con variables en `styles.css`
- [x] **`appointments.book` method** con toda la lógica de reserva

### Parcialmente Implementado

- [~] **`BookingPage`:** el componente está listo (`imports/ui/pages/BookingPage.jsx`) con la lógica de suscripción y reserva, pero **la ruta `/booking` en `App.jsx` renderiza un `<h1>` placeholder** en lugar del componente real
- [~] **`useSlots` hook:** implementado en `imports/ui/hooks/useSlots.js` pero no usado en ningún componente
- [~] **`appointments.cancel` method:** funcional pero sin verificación de autorización (cualquier usuario puede cancelar cualquier turno)
- [~] **Datos del cliente en reserva:** `BookingPage` hardcodea `clientName: 'Juan Pérez'` y `clientPhone: '0991234567'` en lugar de usar los datos del usuario autenticado

### Pendiente de Construir

- [ ] **Conectar `BookingPage` al router:** cambiar `const Booking = () => <h1>Reservar Turno ✂️</h1>` en `App.jsx` por `<BookingPage selectedDate={...} />` y pasar la fecha correcta (ej.: vía state o query param)
- [ ] **Pasar datos reales del cliente** a `appointments.book` (usar `Meteor.user().profile.name` y un campo de teléfono)
- [ ] **Eliminar `autopublish` e `insecure`** antes de ir a producción: `meteor remove autopublish insecure`
- [ ] **Duplicación de `slots.available` publication:** definida en dos archivos (`slots.publications.js` y `appointments.publications.js`). Eliminar la de `appointments.publications.js` que además usa `check` sin importarlo
- [ ] **Vista de slots del barbero:** usar `slots.myDay` publication para que el barbero vea en su dashboard cuáles slots están libres y cuáles ocupados
- [ ] **Historial de turnos:** usar `appointments.myBarber` publication (existe pero sin uso en UI)
- [ ] **Autorización en `appointments.cancel`:** agregar `if (this.userId !== appt.barberId && this.userId !== appt.clientId) throw ...`
- [ ] **Índices en MongoDB:** crear índices compuestos en `slots` por `{ barberId, date }` y en `appointments` por `{ barberId, date }`
- [ ] **Selector de fecha en Dashboard:** actualmente el barbero sólo puede configurar el día de hoy. Agregar un date picker para configurar días futuros
- [ ] **Página de cliente completa:** autenticación del cliente, selección de fecha, selección de barbero (si hay múltiples), formulario de datos de contacto
- [ ] **Tests de dominio:** los tests actuales en `tests/main.js` son del template (verifican el nombre del package). No hay tests de los methods, publications ni componentes
- [ ] **Verificación de email:** el paquete `accounts-password` soporta verificación de email pero no está activado
- [ ] **Eliminar `links.js`** y su colección (residuo del template Meteor, nunca usada)
- [ ] **Eliminar componentes del template no usados:** `Counter.jsx`, `Header.jsx`, `Info.jsx` y los archivos vacíos en `imports/ui/startup/`
- [ ] **Usar constantes `ROLES` y `ROUTES`** en todos los componentes en lugar de strings literales
- [ ] **Migrar `users.register` a async/await** para consistencia con el resto del código en Meteor 3.x
- [ ] **Concurrencia en `appointments.book`:** reemplazar el findOneAsync+updateAsync por una operación atómica para evitar condición de carrera bajo alta concurrencia
