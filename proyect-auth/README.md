# 🎓 Hackscate - Asistente Universitario

Plataforma web universitaria con asistente de voz potenciado por **Gemini AI** que ayuda a estudiantes a gestionar su horario, eventos del campus y encontrar ubicaciones.

## 📋 Descripción

Hackscate es una aplicación full-stack que integra:
- **Asistente de voz con Gemini Live** para conversación en tiempo real
- **Gestión de horarios** con detección automática de ventanas libres
- **Sistema de eventos** del campus con ubicaciones
- **Mapa interactivo** del campus universitario
- **Sugerencias inteligentes** de eventos basadas en el horario del estudiante

## 🏗️ Estructura del Proyecto

```
proyect-auth/
├── client/          # Frontend React + Vite
├── server/          # Backend Express + MongoDB
├── IA/              # Módulo Next.js para pruebas de Gemini
└── README.md
```

## 🚀 Tecnologías

### Client (Frontend)
- **React 19** + **Vite**
- **Tailwind CSS** para estilos
- **Lucide React** para iconos
- **@google/genai** - Gemini Live API para voz en tiempo real
- **Axios** para peticiones HTTP

### Server (Backend)
- **Express 5** - Framework web
- **MongoDB** + **Mongoose** - Base de datos
- **Firebase Admin** - Autenticación
- **Desplegado en Railway**

### IA (Pruebas)
- **Next.js 14** + **TypeScript**
- **Gemini API** para pruebas de chatbot

## ⚙️ Instalación

### Requisitos previos
- Node.js >= 18.0.0
- MongoDB (local o Atlas)
- API Key de Google Gemini

### 1. Clonar el repositorio
```bash
git clone https://github.com/frani3/Auth.git
cd Auth/proyect-auth
```

### 2. Configurar el Cliente
```bash
cd client
npm install
```

Crear archivo `.env`:
```env
VITE_GEMINI_API_KEY=tu_api_key_de_gemini
```

### 3. Configurar el Servidor
```bash
cd server
npm install
```

Crear archivo `.env`:
```env
PORT=3000
MONGODB_URI=tu_uri_de_mongodb
FIREBASE_PROJECT_ID=tu_proyecto_firebase
```

### 4. Configurar módulo IA (opcional)
```bash
cd IA
npm install
```

## 🏃 Ejecución

### Desarrollo

**Cliente:**
```bash
cd client
npm run dev
```

**Servidor:**
```bash
cd server
npm run dev
```

**Módulo IA:**
```bash
cd IA
npm run dev
```

### Producción

**Cliente:**
```bash
cd client
npm run build
npm run preview
```

**Servidor:**
```bash
cd server
npm start
```

## 🔗 API Endpoints

El servidor está desplegado en: `https://auth-production-286b.up.railway.app`

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/horario` | GET | Obtener horario del estudiante |
| `/notas` | GET | Obtener notas del estudiante |
| `/evento` | GET | Listar todos los eventos |
| `/evento` | POST | Crear nuevo evento |
| `/evento/:id` | DELETE | Eliminar evento |
| `/ubicaciones` | GET | Obtener ubicaciones del campus |

📖 Documentación completa en [`server/API_DOCS.md`](./server/API_DOCS.md)

## ✨ Características Principales

### 🎤 Asistente de Voz (Gemini Live)
- Conversación en tiempo real con audio bidireccional
- Consultas sobre horario y clases
- Sugerencias de eventos en ventanas libres
- Terminación por palabras clave ("adiós", "gracias", "terminar")

### 📅 Gestión Académica
- Visualización de horario semanal
- Detección automática de ventanas libres
- Sistema de notas por asignatura

### 🎉 Sistema de Eventos
- Creación de eventos por voz o formulario
- Eventos con ubicación en el mapa
- Sugerencias inteligentes de Gemini

### 🗺️ Mapa del Campus
- Mapa interactivo con ubicaciones
- Navegación a salas y edificios
- Resaltado de eventos sugeridos

## 👥 Equipo

Desarrollado para Hackathon 2025

## 📄 Licencia

ISC
