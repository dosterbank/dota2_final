# Publicar Counter Ledger en GitHub Pages

Este proyecto funciona como **frontend 100% estático**. El navegador contiene la lógica de selección de héroes, el ranking ponderado de counterpicks, las explicaciones del transcript y el cálculo de tesoros. No necesita Node, Express, una API, una base de datos ni un servidor ejecutándose después del build.

## Publicación automática recomendada

Sube el contenido del proyecto a un repositorio de GitHub y usa la rama `main`. El workflow `.github/workflows/deploy-pages.yml` instala las dependencias, ejecuta `pnpm build`, toma `dist/public` como artefacto y lo publica mediante GitHub Pages.

En el repositorio, abre **Settings → Pages → Build and deployment** y selecciona **GitHub Actions** como source. Después de cada push a `main`, GitHub volverá a construir y publicar el sitio.

Después del primer push, abre **Actions** y confirma que el workflow `Deploy static site to GitHub Pages` finalizó en verde. Si Pages permanece configurado como **Deploy from a branch**, GitHub intentará buscar `index.html` en la raíz de la rama y mostrará un 404 si el proyecto todavía no tiene el artefacto publicado. La configuración correcta para el workflow incluido es **Source → GitHub Actions**.

## Publicación manual opcional

Si prefieres generar el sitio localmente, ejecuta:

```bash
pnpm install
pnpm build
```

El contenido publicable queda en `dist/public`. Puedes subir esa carpeta mediante cualquier flujo de Pages que acepte artefactos estáticos.

El repositorio incluye un `index.html` raíz únicamente como ayuda diagnóstica. Como `dist/` está excluido del control de versiones, **Deploy from a branch → main → /(root)** no es una configuración válida para este proyecto fuente: mostrará 404 o una página de redirección sin destino. Usa **Source → GitHub Actions** para que el workflow construya y publique `dist/public` automáticamente.

Si ya aparece un 404, cambia esa opción en **Settings → Pages → Build and deployment → Source → GitHub Actions**, guarda, abre **Actions**, ejecuta `Deploy static site to GitHub Pages` mediante **Run workflow** y espera a que los jobs `build` y `deploy` terminen correctamente. Después abre la URL de Pages desde el environment `github-pages` del workflow.

## Nota sobre rutas y assets

Vite está configurado con `base: "./"`, por lo que los bundles y las imágenes se cargan con rutas relativas. Los assets de marca están dentro de `client/public/assets` y se copian automáticamente a `dist/public/assets`; por eso el sitio no depende del proxy de almacenamiento de Manus.
