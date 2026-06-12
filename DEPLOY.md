# Guía de despliegue: VPS Debian 13 con Docker, Nginx y Let's Encrypt

## Requisitos

Este proyecto fue probado en un VPS con las siguientes especificaciones:

- Sistema operativo: Debian 13 x64
- Proveedor: DigitalOcean Droplet
- vCPU: 1
- RAM: 1 GB
- Disco: 25 GB

> **Nota:** Esta configuración es suficiente para fines académicos y de prueba. Para entornos de producción se recomienda asignar recursos adicionales según la carga esperada.

---

## 1. Configurar el DNS

Antes de desplegar la aplicación, crea un registro **A** en tu proveedor DNS (Namecheap, Cloudflare, etc.) apuntando tu dominio o subdominio a la IP pública del VPS.

Ejemplo:

| Tipo | Host | Valor      |
| ---- | ---- | ---------- |
| A    | app  | IP_DEL_VPS |

Esto permite acceder a la aplicación en:

```
app.tudominio.com
```

Verifica la propagación del DNS:

```bash
nslookup app.tudominio.com
```

o

```bash
dig app.tudominio.com
```

La respuesta debe devolver la IP pública del servidor.

---

## 2. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd <NOMBRE_DEL_PROYECTO>
```

---

## 3. Instalar Docker y Docker Compose

Actualizar el sistema:

```bash
apt update && apt upgrade -y
```

Instalar Docker:

```bash
curl -fsSL https://get.docker.com | sh
```

Verificar la instalación:

```bash
docker --version
docker compose version
```

---

## 4. Configurar Nginx

Antes de desplegar, reemplaza todas las apariciones de:

```
$DOMAIN
```

por tu dominio real, por ejemplo:

```
app.tudominio.com
```

### Configuración inicial (solo HTTP)

En el primer despliegue los certificados SSL aún no existen. Usa únicamente la siguiente configuración para evitar errores de inicio:

```nginx
server {
    listen 80;
    server_name app.tudominio.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://app:3000;
    }
}
```

No habilites el bloque HTTPS (`listen 443 ssl`) hasta que los certificados hayan sido generados.

---

## 5. Levantar los contenedores

Construir e iniciar la aplicación:

```bash
docker compose up -d --build
```

Verificar que todos los contenedores estén activos:

```bash
docker compose ps
```

Resultado esperado:

```
app       Up
nginx     Up
certbot   Up
```

---

## 6. Generar el certificado SSL

Una vez que la aplicación responda correctamente por HTTP, genera el certificado de Let's Encrypt.

Reemplaza `app.tudominio.com` y `correo@ejemplo.com` por tus valores reales.

```bash
docker run --rm \
  -v nombreproyecto_certbot-webroot:/var/www/certbot \
  -v nombreproyecto_certbot-certs:/etc/letsencrypt \
  certbot/certbot certonly \
  --webroot \
  -w /var/www/certbot \
  -d app.tudominio.com \
  --email correo@ejemplo.com \
  --agree-tos \
  --no-eff-email
```

Si el proceso fue exitoso, la salida incluirá:

```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/app.tudominio.com/fullchain.pem
```

---

## 7. Habilitar HTTPS

Una vez generado el certificado, reemplaza la configuración temporal de Nginx por la siguiente:

```nginx
server {
    listen 80;
    server_name app.tudominio.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name app.tudominio.com;

    ssl_certificate     /etc/letsencrypt/live/app.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.tudominio.com/privkey.pem;

    location / {
        proxy_pass         http://app:3000;
        proxy_http_version 1.1;

        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 8. Reiniciar los contenedores

Aplicar la nueva configuración:

```bash
docker compose down
docker compose up -d
```

Verificar el estado de los contenedores:

```bash
docker compose ps
```

---

## 9. Verificar el despliegue

Comprobar que los puertos requeridos estén abiertos:

```bash
ss -tlnp | grep -E ':80|:443'
```

Verificar la respuesta HTTPS:

```bash
curl -I https://app.tudominio.com
```

Abrir la aplicación en el navegador:

```
https://app.tudominio.com
```

Si el navegador muestra un certificado HTTPS válido y la aplicación carga correctamente, el despliegue se completó de forma exitosa.

---

## Solución de problemas

### Nginx entra en un ciclo de reinicios

Si `docker compose ps` muestra:

```
Restarting (1)
```

es probable que el bloque HTTPS haya sido habilitado antes de generar los certificados SSL.

Solución:

1. Eliminar el bloque `listen 443 ssl` de la configuración de Nginx.
2. Levantar los contenedores solo con HTTP.
3. Generar el certificado con Certbot.
4. Restaurar la configuración HTTPS.
5. Reiniciar los contenedores.

---

### Let's Encrypt devuelve "Connection refused"

Verifica lo siguiente:

- El registro A del DNS apunta a la IP correcta del VPS.
- El contenedor de Nginx está en ejecución.
- El puerto 80 es accesible desde Internet.
- El bloque de verificación ACME está presente en la configuración de Nginx:

```nginx
location /.well-known/acme-challenge/ {
    root /var/www/certbot;
}
```

---

## Comandos de utilidad

Ver logs de Nginx:

```bash
docker compose logs nginx --tail=100
```

Ver logs de la aplicación:

```bash
docker compose logs app --tail=100
```

Ver estado de los contenedores:

```bash
docker compose ps
```
