// Pega aquí tu clave de Visual Crossing
const API_KEY = "GPPZJLYSVRL5QXCS9SBEXZCML";

// Aquí guardamos la última ciudad buscada para poder "Actualizar"
let ultimaUbicacion = "";


const inputUbicacion = document.getElementById("ubicacion");
const btnBuscar = document.getElementById("btnBuscar");
const btnActualizar = document.getElementById("btnActualizar");
const mensaje = document.getElementById("mensaje");

btnBuscar.addEventListener("click", function () {
    const ciudad = inputUbicacion.value.trim(); // trim quita espacios sobrantes
    if (ciudad === "") {
        mensaje.textContent = "Escribe una ubicación primero.";
        return; // return corta la función aquí
    }
    ultimaUbicacion = ciudad;
    obtenerClima(ciudad);
});

// Al hacer clic en "Actualizar" repetimos la última búsqueda
btnActualizar.addEventListener("click", function () {
    if (ultimaUbicacion === "") {
        mensaje.textContent = "Primero busca una ubicación.";
        return;
    }
    obtenerClima(ultimaUbicacion);
});

// Esta función pide los datos a la API
// "async/await" significa: espera a que internet responda antes de seguir
async function obtenerClima(ubicacion) {
    mensaje.textContent = "Cargando...";

    // yesterday/tomorrow nos da ayer, hoy y mañana (así tenemos 24h antes y 24h después)
    const url =
        "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/" +
        encodeURIComponent(ubicacion) + // encodeURIComponent arregla espacios y tildes en la URL
        "/yesterday/tomorrow?unitGroup=metric&include=hours,current&lang=es&contentType=json&key=" +
        API_KEY;

    try {
        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            throw new Error("No se encontró la ubicación o la clave es incorrecta");
        }

        const datos = await respuesta.json(); // convertimos la respuesta en un objeto de JS
        mostrarClimaActual(datos);
        mostrarHoras(datos);
        mensaje.textContent = "";
    } catch (error) {
        // Si algo falla, avisamos al usuario
        mensaje.textContent = "Error: " + error.message;
    }
}

// Muestra temperatura, viento, lluvia y condición actual
function mostrarClimaActual(datos) {
    const actual = datos.currentConditions;

    document.getElementById("lugar").textContent = datos.resolvedAddress;
    document.getElementById("condicion").textContent = actual.conditions;
    document.getElementById("temperatura").textContent = actual.temp + " °C";
    document.getElementById("viento").textContent = actual.windspeed + " km/h";

    // Si la API no trae la probabilidad de lluvia, mostramos 0
    const lluvia = actual.precipprob || 0;
    document.getElementById("lluvia").textContent = lluvia + " %";

    document.getElementById("clima-actual").style.display = "block";
}

// Muestra las 24 horas anteriores y las 24 siguientes
function mostrarHoras(datos) {
    const listaPasado = document.getElementById("lista-pasado");
    const listaFuturo = document.getElementById("lista-futuro");
    listaPasado.innerHTML = ""; // vaciamos las listas antes de llenarlas
    listaFuturo.innerHTML = "";

    // Juntamos las horas de todos los días (ayer, hoy, mañana) en una sola lista
    let todasLasHoras = [];
    for (let i = 0; i < datos.days.length; i++) {
        todasLasHoras = todasLasHoras.concat(datos.days[i].hours);
    }

    // datetimeEpoch es la hora en segundos; así comparamos fácil
    const ahora = datos.currentConditions.datetimeEpoch;
    const hace24 = ahora - 24 * 3600;
    const dentro24 = ahora + 24 * 3600;

    for (let i = 0; i < todasLasHoras.length; i++) {
        const hora = todasLasHoras[i];

        // Armamos el texto de cada hora
        const texto =
            hora.datetime.slice(0, 5) + " - " + // solo HH:MM
            hora.temp + " °C - " +
            "Viento " + hora.windspeed + " km/h - " +
            "Lluvia " + (hora.precipprob || 0) + "% - " +
            hora.conditions;

        const item = document.createElement("li"); // creamos un <li>
        item.textContent = texto;

        // Decidimos en qué lista va
        if (hora.datetimeEpoch >= hace24 && hora.datetimeEpoch < ahora) {
            listaPasado.appendChild(item);
        } else if (hora.datetimeEpoch >= ahora && hora.datetimeEpoch <= dentro24) {
            listaFuturo.appendChild(item);
        }
    }

    // Mostramos las cajas que estaban ocultas
    listaPasado.parentElement.style.display = "block";
    listaFuturo.parentElement.style.display = "block";
}