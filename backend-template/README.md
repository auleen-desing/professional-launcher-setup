# NovaEra API - Backend Template

Backend Node.js + Express para el servidor privado NovaEra NosTale.

## 📋 Requisitos

- Node.js 18+
- SQL Server (base de datos NosTale)
- IIS con iisnode (para producción en Windows)

## 🚀 Instalación

### 1. Clonar/Copiar archivos

Copia toda la carpeta `backend-template` a tu servidor.

### 2. Instalar dependencias

```bash
cd backend-template
npm install
```

### 3. Configurar variables de entorno

Renombra `.env.example` a `.env` y configura:

```env
DB_SERVER=localhost
DB_NAME=opennos
DB_USER=sa
DB_PASSWORD=tu_password
JWT_SECRET=cambiar_esto_por_algo_seguro
SERVER_IP=127.0.0.1
PORT=3000
```

### 4. Ejecutar script SQL

Ejecuta `sql/setup.sql` en tu base de datos NosTale para crear las tablas necesarias.

### 5. Iniciar servidor

**Desarrollo:**
```bash
npm run dev
```

**Producción:**
```bash
npm start
```

## 🌐 Configuración IIS

### Requisitos IIS
1. Instalar [iisnode](https://github.com/Azure/iisnode/releases)
2. Instalar [URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite)

### Pasos
1. Crear nuevo sitio en IIS
2. Apuntar al directorio de la API
3. El archivo `web.config` ya está configurado
4. Asegurar que el Application Pool tenga permisos

## 📡 Endpoints

### Auth
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar cuenta
- `GET /api/auth/session` - Verificar sesión
- `POST /api/auth/logout` - Cerrar sesión

### User
- `GET /api/user/profile` - Obtener perfil
- `GET /api/user/coins` - Obtener balance de coins
- `POST /api/user/password` - Cambiar contraseña
- `GET /api/user/characters` - Listar personajes

### Shop
- `GET /api/shop/items` - Listar items
- `GET /api/shop/categories` - Listar categorías
- `POST /api/shop/purchase` - Comprar item
- `GET /api/shop/packages` - Paquetes de coins

### Rankings
- `GET /api/rankings/level` - Top nivel
- `GET /api/rankings/reputation` - Top reputación
- `GET /api/rankings/pvp` - Top PvP

### Server
- `GET /api/server/status` - Estado del servidor
- `GET /api/server/channels` - Lista de canales

### Daily
- `GET /api/daily/status` - Estado recompensa diaria
- `POST /api/daily/claim` - Reclamar recompensa

### Roulette
- `GET /api/roulette/prizes` - Lista de premios
- `POST /api/roulette/spin` - Girar ruleta

### Tickets
- `GET /api/tickets` - Listar tickets
- `POST /api/tickets/create` - Crear ticket
- `GET /api/tickets/:id` - Ver ticket
- `POST /api/tickets/:id/reply` - Responder ticket
- `POST /api/tickets/:id/close` - Cerrar ticket

### Coupons
- `POST /api/coupons/redeem` - Canjear cupón

### Character
- `POST /api/character/unbug` - Desbuggear personaje
- `GET /api/character/list` - Listar personajes
- `GET /api/character/:name` - Info de personaje

## 🔒 Seguridad

- Todas las rutas protegidas requieren token JWT en header `Authorization: Bearer <token>`
- Cambiar `JWT_SECRET` en producción
- Configurar CORS apropiadamente para tu dominio

## 📝 Notas

- Las queries SQL están diseñadas para OpenNos/NosTale database schema
- Ajustar nombres de tablas/columnas según tu emulador
- El conteo de jugadores en `/api/server/status` es mock, implementar según tu sistema
