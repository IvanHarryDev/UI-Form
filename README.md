# NEXUS · Panel de aventurero para Minecraft Bedrock

**NEXUS** es un addon para Minecraft Bedrock que agrega un menú completo con interfaz gráfica, una economía propia y herramientas para jugadores y administradores. Se abre con un clic derecho sobre la brújula o el reloj y funciona en **español e inglés**: cada jugador elige su idioma y lo ve a su manera, aunque otro en la misma partida use el otro.

![Menú principal](docs/menu.png)

## Características

### Economía
- Moneda propia ("Monedas"), guardada en un scoreboard.
- Se ganan matando monstruos (2 a 5 por monstruo), ganando combates PvP (25), completando misiones y con la recompensa diaria.
- Los animales no dan monedas, para evitar el farmeo.

### Tienda
- 4 categorías (comida, herramientas y armas, recursos, especiales) y 18 artículos.
- Compra y venta con selector de cantidad y opción de vender todo lo que tengas.
- Cada operación pide confirmación.
- No vende ítems con nombre personalizado, como la brújula NEXUS.

### Teletransportes
- Spawn del mundo, tu cama y el lugar donde moriste.
- Hasta **5 hogares** propios con nombre e icono, que se pueden crear y eliminar.
- Pedidos de teletransporte a otros jugadores: el otro jugador acepta o rechaza, con tiempo de espera entre pedidos.
- Cada viaje cuesta una pequeña cantidad de monedas (configurable).

### Perfil y misiones
- Estadísticas: tiempo jugado, monstruos derrotados, combates PvP ganados, muertes, compras y monedas gastadas.
- 5 misiones con barra de progreso y recompensa en monedas.

### Recompensas y kits
- Recompensa diaria con **racha de 7 días**. El día 7 da diamantes y niveles de experiencia extra.
- 3 kits (Aventurero, Minero, Guerrero) con tiempo de espera. El kit Guerrero cuesta monedas.

### Mejoras temporales
- 8 efectos: velocidad, salto, visión nocturna, fuerza, regeneración, prisa, resistencia al fuego y respiración acuática.
- Duración de 1 a 10 minutos y potencia I, II o III. El precio se calcula antes de confirmar.

### Jugadores
- Lista de jugadores conectados.
- Enviar monedas, mandar mensajes privados y pedir teletransporte.

### Ajustes personales
- HUD en la barra de acción con 3 estilos, coordenadas opcionales y velocidad de actualización.
- 6 colores de acento y apodo personalizado sobre la cabeza.
- Sonidos del menú y opción de aceptar o no pedidos de teletransporte.
- Cambio de idioma al instante.

### Panel de administración
Disponible para operadores o jugadores con la etiqueta `nexus_admin`.
- Anuncios globales por chat, título en pantalla o barra de acción.
- Control del mundo: hora, clima, mantener inventario al morir y limpieza de objetos del suelo.
- Economía: dar, quitar o fijar monedas a un jugador.
- Cambio rápido de modo de juego.

## Cómo se usa

| Acción | Resultado |
|---|---|
| Clic derecho con la brújula o el reloj | Abre el panel principal |
| Agachado + clic derecho | Abre directo los teletransportes |
| `/scriptevent nexus:menu` | Abre el menú (útil con bloques de comandos o NPCs) |

Los jugadores nuevos reciben una **brújula NEXUS** y **100 monedas** al entrar. La primera vez aparece un selector de idioma, que luego se puede cambiar en **Ajustes → Idioma**.

Para dar permisos de administrador a un jugador que no es operador:

```
/tag NombreDelJugador add nexus_admin
```

## Instalación

1. Copia la carpeta `scripts/` dentro de tu **Behavior Pack**, junto al `manifest.json`.
2. Configura el `manifest.json` (ver abajo).
3. Activa el Behavior Pack en tu mundo.
4. Entra al mundo y usa la brújula.

### Requisitos

- Minecraft Bedrock con soporte para la **Script API**.
- Módulos `@minecraft/server` y `@minecraft/server-ui` (versión 2.x; el addon usa `header`, `divider` y `label` de `server-ui` 2.0.0 o superior).
- No necesita resource pack: los iconos son texturas de Minecraft.
