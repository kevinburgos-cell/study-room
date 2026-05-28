# Bitácora de Decisiones UX/HCI - StudyRoom

Este documento detalla las decisiones estratégicas de Experiencia de Usuario (UX) e Interacción Humano-Computadora (HCI) implementadas durante el rediseño de autenticación y onboarding de **StudyRoom**, cumpliendo rigurosamente con los criterios de los Sprints 0 y 1 (**C5: Evidencia UX/HCI**).

---

## 📊 Decisión UX 1: Layout de Doble Panel Premium (Estilo ENDTASKS)

### Contexto y Problema
El diseño original de la interfaz de Login y Registro se percibía "animado" o infantil, lo que restaba seriedad al propósito académico de la plataforma. Adicionalmente, carecía de explicaciones de valor previas que motivaran a los estudiantes universitarios a crear una cuenta.

### Solución UX y Teoría HCI
Adoptamos un **layout simétrico de doble panel (split-panel)** en dispositivos de escritorio:
- **Panel Izquierdo (Oscuro / Branding e Información):** Actúa como un espacio de posicionamiento de marca. Muestra el logo, el lema central (*"Domina tus salas de estudio"*) y tres viñetas claras que detallan las ventajas competitivas del producto (Gestión, Conectividad, Seguridad).
- **Panel Derecho (Claro / Foco en la Acción):** Un fondo blanco puro con el formulario interactivo. Al separar la información institucional de los campos de entrada, reducimos la **carga cognitiva visual** del estudiante.

```
+------------------------------------------+------------------------------------------+
|                                          |                                          |
|                STUDYROOM                 |                Bienvenido                |
|                                          |                                          |
|         Domina tus salas de              |        [ Iniciar Sesión ]  Registrarse   |
|               estudio                    |                                          |
|                                          |        Correo electrónico                |
|         - Gestión Eficiente              |        [ tu@correo.com                  ] |
|         - Conectividad Total             |                                          |
|         - Seguridad Garantizada          |        Contraseña                        |
|                                          |        [ **********                 (o) ] |
|                                          |                                          |
|                                          |        [      Iniciar Sesión      ]     |
|                                          |                                          |
+------------------------------------------+------------------------------------------+
```

### Principios HCI y Accesibilidad Aplicados
1. **Ley de Fitts:** El botón de acción principal (*"Iniciar Sesión"*) y el botón de *Google Auth* poseen un tamaño generoso (alto de `48px`), haciéndolos fáciles de clicar o pulsar en pantallas táctiles.
2. **Contraste de Colores (Accesibilidad WCAG 2.1):** Los campos del formulario emplean un contraste alto en el texto (#1f2937 sobre fondo blanco #ffffff), asegurando una legibilidad excelente para personas con debilidad visual.
3. **Visibilidad de Contraseñas (Prevención de Errores):** Se implementó un toggle interactivo (`👁️` / `👁️‍🗨️`) para mostrar/ocultar los caracteres de la contraseña, reduciendo los reintentos fallidos por errores tipográficos.

---

## 🆔 Decisión UX 2: Flujo de "Google Onboarding" con Validación en Tiempo Real

### Contexto y Problema
El sistema de autenticación de Google es sumamente eficiente y libre de fricción. Sin embargo, Google no expone un campo de "nombre de usuario" único (solo retorna el nombre completo y el correo). Nuestra base de datos (Firestore) requiere un nombre de usuario exclusivo (`username`) para indexar las salas y menciones en los chats sin ambigüedades.

### Solución UX e Interacción
Diseñamos un **flujo de onboarding diferido de un solo paso**:
1. El estudiante hace clic en **"Continuar con Google"**.
2. Firebase Auth realiza el protocolo social en segundo plano.
3. Si el backend detecta que la cuenta es nueva, redirige al usuario a la interfaz **Google Onboarding**.
4. En esta interfaz, el usuario ve su foto y correo importados, y se le solicita crear su nombre de usuario exclusivo.
5. Una vez confirmado, se crea su registro en Firestore y entra directo al dashboard.

### Diseño de Interacción y Feedback en Tiempo Real
Para evitar la frustración de presionar "Guardar" y descubrir que el nombre de usuario ya está ocupado (lo que genera rechazo en el usuario), implementamos **Feedback Proactivo en Tiempo Real (Live Validation)** con un delay (debounce) de 500ms:
- Mientras el usuario escribe, el frontend consulta al backend `/auth/check-username`.
- Si está disponible, se muestra un mensaje en color verde: `✅ Nombre de usuario disponible.`.
- Si está duplicado o contiene caracteres inválidos, se bloquea el botón y se muestra en rojo: `❌ Este nombre de usuario ya está en uso.`.

```
                    [ Nombre de Usuario ]
                    [ kevin.burgos      ]
                    ✅ Nombre de usuario disponible.
                    
                    [ Confirmar e Ingresar ] <- Habilitado de inmediato
```

### Principios HCI Aplicados
1. **Teoría del Diálogo Humano-Computadora (Feedback Continuo):** El sistema responde dinámicamente a la escritura del usuario, otorgando una sensación de control total y fluidez.
2. **Prevención de Errores (Defensive Design):** El botón de envío se deshabilita automáticamente mientras se realiza la validación o si el nombre no es único, impidiendo el envío de peticiones destinadas a fallar.
