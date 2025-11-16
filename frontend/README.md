# Frontend - Sistema de Gestión de Vehículos

Aplicación web desarrollada con Next.js 14 y React para la gestión de operaciones diarias de vehículos y entregas.

## Características

- Autenticación con JWT
- Dashboard con KPIs en tiempo real
- Gestión de operaciones diarias
- Registro de vehículos y placas
- Seguimiento de entregas y facturas
- Upload de fotos de evidencia
- Interfaz responsive con Tailwind CSS

## Tecnologías

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Axios
- React Icons
- Recharts (para gráficos)

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.local.example .env.local
# Editar .env.local con la URL de tu API
```

3. Ejecutar en desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en http://localhost:3000

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/                 # Páginas (App Router)
│   │   ├── login/          # Página de login
│   │   ├── dashboard/      # Dashboard principal
│   │   ├── operaciones/    # Gestión de operaciones
│   │   └── entregas/       # Gestión de entregas
│   ├── components/         # Componentes reutilizables
│   │   ├── layout/         # Layouts
│   │   └── ui/             # Componentes UI
│   ├── contexts/           # React Contexts (Auth)
│   ├── lib/                # Utilidades y API client
│   └── types/              # TypeScript types
├── public/                 # Archivos estáticos
└── package.json
```

## Páginas Principales

### Login
- Autenticación de usuarios
- Gestión de sesiones con localStorage
- Redirección automática

### Dashboard
- KPIs generales del sistema
- Vehículos activos del día
- Entregas pendientes y cumplidas
- Lista de entregas recientes

### Operaciones
- Crear operación diaria
- Definir cantidad de vehículos necesarios
- Agregar vehículos (placas) a la operación
- Ver estadísticas por operación

### Entregas
- Registrar facturas/clientes por vehículo
- Marcar entregas como cumplidas
- Subir fotos de evidencia
- Filtrar por estado

## Credenciales por Defecto

- Usuario: `admin`
- Contraseña: `admin123`

## Build para Producción

```bash
npm run build
npm start
```

## Variables de Entorno

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Notas de Desarrollo

- La aplicación usa el App Router de Next.js 14
- Todos los componentes de página usan 'use client' para interactividad
- El contexto de autenticación maneja la sesión globalmente
- Las llamadas a la API se centralizan en `src/lib/api.ts`
