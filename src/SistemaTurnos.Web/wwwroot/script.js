
const API = "/api";

let turnoActualId = null;

const servicioSelect = document.getElementById("servicio");
const mensaje = document.getElementById("mensaje");
const pantallaTurno = document.getElementById("turnoActual");
const listaTurnos = document.getElementById("listaTurnos");
const cantidadEspera = document.getElementById("cantidadEspera");

function mostrarMensaje(texto) {
    mensaje.textContent = texto;
}

async function solicitar(url, opciones = {}) {
    const respuesta = await fetch(API + url, opciones);

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(datos.mensaje || "Ocurrió un error.");
    }

    return datos;
}

// Consultar los servicios registrados
async function cargarServicios() {
    try {
        const servicios = await solicitar("/servicios");

        servicioSelect.innerHTML =
            '<option value="">Seleccione un servicio</option>';

        servicios.forEach(servicio => {
            const opcion = document.createElement("option");
            opcion.value = servicio.id;
            opcion.textContent = servicio.nombre;
            servicioSelect.appendChild(opcion);
        });
    } catch (error) {
        mostrarMensaje(error.message);
    }
}

// Registrar un servicio
document.getElementById("formServicio")
    .addEventListener("submit", async function(evento) {
        evento.preventDefault();

        const nombre =
            document.getElementById("nombreServicio").value;

        const prefijo =
            document.getElementById("prefijoServicio").value;

        try {
            const datos = await solicitar("/servicios", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ nombre, prefijo })
            });

            mostrarMensaje(datos.mensaje);
            this.reset();

            await cargarServicios();
        } catch (error) {
            mostrarMensaje(error.message);
        }
    });

// Generar un turno
document.getElementById("btnGenerar")
    .addEventListener("click", async () => {
        const servicioId = Number(servicioSelect.value);

        const nombreCliente =
            document.getElementById("nombreCliente").value;

        if (!servicioId) {
            mostrarMensaje("Seleccione un servicio.");
            return;
        }

        try {
            const datos = await solicitar("/turnos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    servicioId,
                    nombreCliente
                })
            });

            mostrarMensaje(datos.mensaje);

            document.getElementById("nombreCliente").value = "";

            await cargarTurnos();
        } catch (error) {
            mostrarMensaje(error.message);
        }
    });

// Recuperar el turno actual desde SQL Server
async function cargarTurnoActual() {
    const servicioId = servicioSelect.value;

    turnoActualId = null;
    pantallaTurno.textContent = "Ninguno";

    if (!servicioId) return;

    try {
        const turno = await solicitar(
            "/turnos/actual/" + servicioId
        );

        if (turno.id) {
            turnoActualId = turno.id;
            pantallaTurno.textContent = turno.numero;
        }
    } catch (error) {
        mostrarMensaje(error.message);
    }
}

// Consultar la fila de espera
async function cargarTurnos() {
    const servicioId = servicioSelect.value;

    listaTurnos.innerHTML = "";

    if (!servicioId) {
        cantidadEspera.textContent = "Personas en espera: 0";
        return;
    }

    try {
        const turnos = await solicitar(
            "/turnos/espera/" + servicioId
        );

        cantidadEspera.textContent =
            "Personas en espera: " + turnos.length;

        turnos.forEach(turno => {
            const elemento = document.createElement("li");

            const texto = document.createElement("span");

            texto.textContent =
                turno.numero + " - " +
                (turno.nombreCliente || "Sin nombre") + " ";

            const botonCancelar = document.createElement("button");

            botonCancelar.textContent = "Cancelar";
            botonCancelar.type = "button";
            botonCancelar.className = "btnCancelar";

            botonCancelar.addEventListener("click", async () => {
                await cancelarTurno(turno.id, turno.numero);
            });

            elemento.appendChild(texto);
            elemento.appendChild(botonCancelar);

            listaTurnos.appendChild(elemento);
        });
    } catch (error) {
        mostrarMensaje(error.message);
    }
}

// Cancelar un turno en espera
async function cancelarTurno(turnoId, numero) {
    const confirmar = confirm(
        "¿Está seguro de cancelar el turno " + numero + "?"
    );

    if (!confirmar) {
        mostrarMensaje("La cancelación fue cancelada.");
        return;
    }

    try {
        const datos = await solicitar(
            "/turnos/cancelar/" + turnoId,
            { method: "POST" }
        );

        mostrarMensaje(datos.mensaje);

        await cargarTurnos();
        await cargarTurnoActual();
    } catch (error) {
        mostrarMensaje(error.message);
    }
}

// Llamar al siguiente turno
document.getElementById("btnSiguiente")
    .addEventListener("click", async () => {
        const servicioId = servicioSelect.value;

        if (!servicioId) {
            mostrarMensaje("Seleccione un servicio.");
            return;
        }

        try {
            const turno = await solicitar(
                "/turnos/siguiente/" + servicioId,
                { method: "POST" }
            );

            turnoActualId = turno.id;
            pantallaTurno.textContent = turno.numero;

            mostrarMensaje("Llamando al turno " + turno.numero);

            await cargarTurnos();
        } catch (error) {
            mostrarMensaje(error.message);
        }
    });

// Finalizar la atención
document.getElementById("btnFinalizar")
    .addEventListener("click", async () => {
        if (!turnoActualId) {
            mostrarMensaje(
                "No hay un turno seleccionado para finalizar."
            );
            return;
        }

        try {
            const datos = await solicitar(
                "/turnos/finalizar/" + turnoActualId,
                { method: "POST" }
            );

            turnoActualId = null;
            pantallaTurno.textContent = "Ninguno";

            mostrarMensaje(datos.mensaje);

            await cargarTurnos();
        } catch (error) {
            mostrarMensaje(error.message);
        }
    });

// Actualizar información al cambiar de servicio
servicioSelect.addEventListener("change", async () => {
    await cargarTurnoActual();
    await cargarTurnos();
});

// Cargar la información al abrir la página
async function iniciarPagina() {
    await cargarServicios();

    if (servicioSelect.options.length > 1) {
        servicioSelect.selectedIndex = 1;

        await cargarTurnoActual();
        await cargarTurnos();
    }
}

iniciarPagina();
