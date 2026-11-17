# Backend Favorcito

Usa Node.js 22 y `npm ci` para instalar las versiones del lockfile.
`npm run dev` inicia el servidor con la vigilancia integrada de Node.
La configuración de la aplicación está descrita en `.env.example`.

## Pruebas completas antes de integrar a main

Las pruebas de inventario, reportes y concurrencia necesitan un MongoDB replica
set. Usa una instancia aislada; nunca uses la URI de producción para probar.
Cada prueba crea y elimina su propia base de datos de prueba.

```bash
docker run --detach --name favorcito-mongo --publish 127.0.0.1:27019:27019 mongo:8.0 --replSet favorcitoTest --bind_ip_all --port 27019
# Cuando mongosh pueda conectarse:
docker exec favorcito-mongo mongosh --port 27019 --quiet --eval 'rs.initiate({_id:"favorcitoTest",members:[{_id:0,host:"127.0.0.1:27019"}]})'
# Espera a que este comando termine con código 0 antes de ejecutar la suite:
docker exec favorcito-mongo mongosh --port 27019 --quiet --eval 'if (!db.hello().isWritablePrimary) quit(1)'
MONGO_TEST_URI='mongodb://127.0.0.1:27019/?replicaSet=favorcitoTest' npm run test:integration
npm audit
# Al terminar:
docker rm --force favorcito-mongo
```

`test:integration` falla si falta la URI, la base de datos no está disponible o
no admite transacciones. `npm test` permite ejecutar las pruebas que no necesitan
MongoDB, pero omite las de integración si no se configura `MONGO_TEST_URI`.

El workflow **Application checks** prepara un replica set, ejecuta la suite
completa, comprueba las dependencias y exige lint y compilación del frontend.
Se ejecuta en pull requests y en las ramas de integración configuradas.

La suite incluye un recorrido HTTP con inicio de sesión, publicación de producto,
compra, preparación, reparto, chat, resolución administrativa y reposición de
inventario. Usa cuentas y datos ficticios; no envía correos ni carga imágenes a
servicios externos. La entrega real de correo y la configuración de Cloudinary
requieren verificarse en el entorno de pruebas del despliegue.
