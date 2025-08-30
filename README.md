# NotesApp - Webapp Moderna para Guardar Notas

Una aplicación web moderna y minimalista para guardar, organizar y gestionar notas con integración de IA.

## 🚀 Características

- **Interfaz Moderna**: Diseño limpio y minimalista con animaciones suaves
- **Menú Hamburguesa**: Navegación lateral intuitiva y responsive
- **Organización por Carpetas**: Crea y organiza tus notas en carpetas personalizables
- **Vista de Calendario**: Filtra y organiza notas por fecha
- **Integración con IA**: Preparado para usar Google Gemini AI
- **Editor Avanzado**: Editor de texto con funciones de guardado automático
- **Búsqueda Inteligente**: Busca en títulos y contenido de notas
- **Responsive**: Funciona perfectamente en móvil, tablet y escritorio

## 🛠️ Tecnologías

- **React 18** con TypeScript
- **Vite** como bundler
- **Tailwind CSS** para estilos
- **Lucide React** para iconos
- **Date-fns** para manejo de fechas
- **Google Gemini AI** para funciones inteligentes

## 🎨 Funciones de IA (Gemini)

- Mejorar y expandir contenido de notas
- Generar títulos automáticamente
- Crear resúmenes de notas largas
- Sugerir mejoras de escritura

## 📱 Responsive Design

- **Móvil** (<768px): Menú lateral colapsable
- **Tablet** (768-1024px): Interfaz adaptada
- **Escritorio** (>1024px): Vista completa con sidebar fijo

## 🔧 Configuración de IA

1. Obtén tu API key de [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Haz clic en el botón de configuración (⚙️) en la esquina inferior derecha
3. Ingresa tu API key y configura
4. ¡Ya puedes usar las funciones de IA!

## 🚀 Instalación y Uso

```bash
npm install
npm run dev
```

## 📂 Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── Sidebar.tsx     # Menú lateral hamburguesa
│   ├── NotesList.tsx   # Lista de notas
│   ├── NoteEditor.tsx  # Editor de notas
│   ├── FolderList.tsx  # Gestión de carpetas
│   ├── CalendarView.tsx # Vista de calendario
│   └── Modales/        # Modales para configuración
├── hooks/              # Custom hooks
├── services/           # Servicios (Gemini AI)
├── types/              # Definiciones TypeScript
└── styles/             # Estilos CSS
```

## 🎯 Próximas Funciones

- Exportar notas a PDF/Markdown
- Sincronización en la nube
- Colaboración en tiempo real
- Plantillas de notas
- Recordatorios y notificaciones