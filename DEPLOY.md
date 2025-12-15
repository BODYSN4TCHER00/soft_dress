# Guía de Despliegue en Render

## Prerrequisitos

1. Tener una cuenta en [Render](https://render.com)
2. Tener tu proyecto en un repositorio Git (GitHub, GitLab o Bitbucket)
3. Tener las credenciales de Supabase listas

## Pasos para Deployear

### Opción 1: Usando el Dashboard de Render (Recomendado)

1. **Conecta tu repositorio:**
   - Ve a [Render Dashboard](https://dashboard.render.com)
   - Haz clic en "New +" → "Static Site"
   - Conecta tu repositorio de Git

2. **Configura el servicio:**
   - **Name:** `soft-dress` (o el nombre que prefieras)
   - **Branch:** `main` (o la rama que uses)
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

3. **Configura las variables de entorno:**
   - Ve a la sección "Environment" en la configuración del servicio
   - Agrega las siguientes variables:
     - `VITE_SUPABASE_URL`: Tu URL de Supabase
     - `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`: Tu clave pública de Supabase

4. **Despliega:**
   - Haz clic en "Create Static Site"
   - Render comenzará a construir y desplegar tu aplicación

### Opción 2: Usando render.yaml (Infraestructura como Código)

Si ya tienes el archivo `render.yaml` en tu repositorio:

1. **Conecta tu repositorio:**
   - Ve a [Render Dashboard](https://dashboard.render.com)
   - Haz clic en "New +" → "Blueprint"
   - Conecta tu repositorio

2. **Render detectará automáticamente el archivo `render.yaml`**
   - Asegúrate de configurar las variables de entorno en el dashboard después de crear el servicio

3. **Despliega:**
   - Render usará la configuración del archivo `render.yaml`

## Variables de Entorno Requeridas

Asegúrate de configurar estas variables en Render:

```
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=tu_clave_publica_de_supabase
```

## Comandos de Build

El proyecto usa los siguientes comandos:

- **Instalar dependencias:** `npm install`
- **Build:** `npm run build` (genera la carpeta `dist/`)
- **Preview local:** `npm run preview` (para probar el build localmente)

## Verificación Post-Deploy

Después del despliegue:

1. Verifica que la URL de Render funcione
2. Prueba el login con credenciales válidas
3. Verifica que las conexiones a Supabase funcionen correctamente

## Notas Importantes

- Render regenerará tu sitio cada vez que hagas push a la rama principal
- Los builds pueden tardar 2-5 minutos
- La primera vez puede tardar más debido a la instalación de dependencias
- Asegúrate de que las variables de entorno estén configuradas antes del primer build

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Verifica que las variables de entorno estén configuradas en Render
- Asegúrate de que los nombres de las variables sean exactos (case-sensitive)

### Build falla
- Revisa los logs de build en Render
- Verifica que `package.json` tenga todos los scripts necesarios
- Asegúrate de que no haya errores de TypeScript (`npm run build` localmente)

### La aplicación no carga
- Verifica que el "Publish Directory" sea `dist`
- Revisa la consola del navegador para errores
- Verifica que las variables de entorno estén correctamente configuradas

