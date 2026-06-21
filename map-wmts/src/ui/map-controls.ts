import { CONFIG_UI, CONFIG_MAPA, INFO_CIUDADES } from '../core/constants';
import { VisitaCruda, Visita, Ruta } from '../core/interfaces';
import { descargarMapaCiudad } from '../services/map-downloader';
import {
    limpiarTodasLasVisitas,
    guardarVisitaLocalmente,
    obtenerMapaLocalmente,
    limpiarTodosLosMapas,
    guardarRutaLocalmente,
    obtenerTodasLasRutas,
    limpiarTodasLasRutas
} from '../core/storage';

/**
 * Prepara un objeto Visita para ser guardado localmente a partir de una VisitaCruda.
 */
const prepararVisitaParaDescarga = (visita: VisitaCruda): Visita => ({
    id: visita.id,
    idCiudad: visita.idCiudad,
    cliente: visita.cliente,
    direccionDestino: visita.direccion,
    coordenadasDestino: {
        lat: visita.marcadores[0]?.coordenadas[0] ?? 0,
        lng: visita.marcadores[0]?.coordenadas[1] ?? 0,
    },
    puntosInteres: visita.marcadores.map(m => ({ lat: m.coordenadas[0], lng: m.coordenadas[1] })),
});

/**
 * Crea el objeto de ruta detallado para la visita.
 */
const crearObjetoRuta = (visita: VisitaCruda): Ruta => {
    const puntosInteres = visita.marcadores.map((m, i) => ({
        lat: m.coordenadas[0],
        lng: m.coordenadas[1],
        titulo: m.nombre || `Parada ${i + 1}`,
        letra: String.fromCharCode(65 + i),
        tieneMultimedia: false,
        distancia: 0
    }));

    return {
        geojson: visita.rutaPrecalculada,
        distanciaTotal: 0,
        tiempoEstimado: 0,
        pasos: puntosInteres
    };
};

/**
 * Actualiza la visibilidad de un elemento usando clases de utilidad.
 */
const alternarVisibilidad = (elemento: HTMLElement | null, mostrar: boolean) => {
    if (!elemento) return;
    if (mostrar) {
        elemento.classList.remove(CONFIG_UI.CLASE_OCULTO);
    } else {
        elemento.classList.add(CONFIG_UI.CLASE_OCULTO);
    }
};

/**
 * Actualiza el texto y estado de la UI durante la descarga.
 */
const actualizarInterfazProgreso = (
    elemento: HTMLElement,
    cargado: number,
    total: number,
    boton: HTMLButtonElement | null
) => {
    const megabytesCargados = (cargado / 1024 / 1024).toFixed(1);

    alternarVisibilidad(elemento, true);
    elemento.classList.remove('download-progress--error');

    if (total > 0) {
        const porcentaje = Math.round((cargado / total) * 100);
        const megabytesTotales = (total / 1024 / 1024).toFixed(1);
        elemento.textContent = `Descargando: ${porcentaje}% (${megabytesCargados}MB / ${megabytesTotales}MB)`;
    } else {
        elemento.textContent = `Descargando... ${megabytesCargados}MB`;
    }

    if (cargado >= total && total > 0) {
        elemento.textContent = CONFIG_UI.TEXTO_FINALIZADO;
        if (boton) {
            boton.disabled = false;
            boton.textContent = CONFIG_UI.TEXTO_ACTUALIZAR;
        }
        setTimeout(() => alternarVisibilidad(elemento, false), CONFIG_UI.RETRASO_OCULTAR_MS);
    }
};

/**
 * Gestiona el proceso de descarga de una ciudad.
 */
const ejecutarDescargaCiudad = async (
    visita: VisitaCruda,
    elementoProgreso: HTMLElement,
    botonDescarga: HTMLButtonElement | null
) => {
    if (botonDescarga) botonDescarga.disabled = true;

    try {
        const alProgresar = (cargado: number, total: number) => {
            actualizarInterfazProgreso(elementoProgreso, cargado, total, botonDescarga);
        };

        await descargarMapaCiudad(
            visita.idCiudad,
            visita.urlPmtiles || CONFIG_MAPA.URL_PMTILES,
            alProgresar
        );
    } catch (error) {
        console.error('Error al descargar PMTiles:', error);
        elementoProgreso.textContent = "Error en la descarga.";
        elementoProgreso.classList.add('download-progress--error');
        if (botonDescarga) botonDescarga.disabled = false;
    }
};

/**
 * Gestiona el evento de clic en el botón de descarga.
 */
const manejarClickDescarga = async (
    visita: VisitaCruda,
    elementoProgreso: HTMLElement
) => {
    const boton = document.getElementById(`btn-descargar-${visita.id}`) as HTMLButtonElement;

    if (visita.rutaPrecalculada) {
        const ruta = crearObjetoRuta(visita);
        const objetoVisita = { ...prepararVisitaParaDescarga(visita), ruta };

        await guardarRutaLocalmente(objetoVisita);
        await guardarVisitaLocalmente(visita);
        await ejecutarDescargaCiudad(visita, elementoProgreso, boton);
    }
};

/**
 * Gestiona el evento de clic en el botón de ver mapa.
 */
const manejarClickVerMapa = async (
    visita: VisitaCruda,
    alSeleccionarMapa: (visita: VisitaCruda) => void
) => {
    const rutasGuardadas = await obtenerTodasLasRutas();
    const datosRuta = rutasGuardadas.find((guardada: Visita) => guardada.id === visita.id);
    const tienePmtiles = await obtenerMapaLocalmente(visita.idCiudad);

    const elementoLista = document.getElementById('visit-list');
    const elementoMapa = document.getElementById('map');

    if ((!datosRuta && !visita.rutaPrecalculada) || !tienePmtiles) {
        alert('Por favor, descarga el mapa primero para usarlo offline.');
        return;
    }

    alternarVisibilidad(elementoLista, false);
    alternarVisibilidad(elementoMapa, true);

    alSeleccionarMapa(visita);
};

/**
 * Crea el botón para borrar todos los datos locales.
 */
const crearBotonBorrarTodo = (contenedor: HTMLElement) => {
    const boton = document.createElement('button');
    boton.className = 'btn-borrar-todo';
    boton.textContent = CONFIG_UI.TEXTO_BORRAR_TODO;

    boton.addEventListener('click', async () => {
        if (globalThis.confirm('¿Eliminar todos los datos locales?')) {
            try {
                await Promise.all([
                    limpiarTodosLosMapas(),
                    limpiarTodasLasRutas(),
                    limpiarTodasLasVisitas()
                ]);
                alert('Memoria local liberada.');
                globalThis.location.reload();
            } catch (error) {
                console.error('Error al borrar:', error);
            }
        }
    });

    contenedor.appendChild(boton);
};

/**
 * Crea el HTML de un botón de acción.
 */
const generarHtmlBoton = (id: string, clase: string, texto: string): string =>
    `<button id="${id}" class="${clase}">${texto}</button>`;

/**
 * Genera el HTML para el contenido de una tarjeta.
 */
const generarHtmlContenidoTarjeta = (
    info: { nombre: string; imagen: string | null },
    visita: VisitaCruda,
    esConImagen: boolean
): string => {
    const { id, nombre, cliente, direccion, marcadores } = visita;
    const numParadas = marcadores?.length ?? 0;

    const htmlFondo = esConImagen ? `
        <img src="${info.imagen}" class="visit-card__imagen-fondo" alt="${info.nombre}">
        <div class="visit-card__capa-oscura"></div>
        <div class="visit-card__gradiente"></div>` : '';

    const htmlDetalles = esConImagen ? '' : `
        <p class="visit-card__subtitulo">${nombre}</p>
        <p class="visit-card__info">${cliente ?? ''} · ${direccion ?? ''}</p>
        ${numParadas > 0 ? `<span class="visit-card__etiqueta">📍 ${numParadas} paradas</span>` : ''}`;

    const btnDescargar = generarHtmlBoton(`btn-descargar-${id}`, 'visit-card__btn-primario', CONFIG_UI.TEXTO_DESCARGAR);
    const btnVer = generarHtmlBoton(`btn-ver-${id}`, 'visit-card__btn-accion', CONFIG_UI.TEXTO_VER_MAPA);

    return `
        ${htmlFondo}
        <div class="visit-card__contenido">
            <h2 class="visit-card__titulo">${info.nombre}</h2>
            ${htmlDetalles}
            <div class="visit-card__contenedor-botones">
                ${btnDescargar}
                ${btnVer}
            </div>
        </div>`;
};

/**
 * Crea el elemento HTML para una tarjeta de visita.
 */
const crearTarjetaVisita = (
    visita: VisitaCruda,
    elementoProgreso: HTMLElement,
    alSeleccionarMapa: (visita: VisitaCruda) => void
): HTMLElement => {
    const infoCiudad = INFO_CIUDADES[visita.idCiudad] ?? {
        nombre: visita.idCiudad.charAt(0).toUpperCase() + visita.idCiudad.slice(1),
        imagen: null
    };

    const tarjeta = document.createElement('div');
    tarjeta.className = 'visit-card';

    const esConImagen = !!infoCiudad.imagen;
    if (esConImagen) {
        tarjeta.classList.add('visit-card--con-imagen');
    } else {
        tarjeta.classList.add('visit-card--basica');
    }

    tarjeta.innerHTML = generarHtmlContenidoTarjeta(infoCiudad, visita, esConImagen);

    // Configurar estado inicial y eventos
    const btnDescargar = tarjeta.querySelector(`#btn-descargar-${visita.id}`) as HTMLButtonElement;
    const btnVer = tarjeta.querySelector(`#btn-ver-${visita.id}`) as HTMLButtonElement;

    obtenerMapaLocalmente(visita.idCiudad).then(existe => {
        if (existe && btnDescargar) btnDescargar.textContent = CONFIG_UI.TEXTO_ACTUALIZAR;
    });

    btnDescargar?.addEventListener('click', () => manejarClickDescarga(visita, elementoProgreso));
    btnVer?.addEventListener('click', () => manejarClickVerMapa(visita, alSeleccionarMapa));

    return tarjeta;
};

/**
 * Inicializa el contenedor principal de la lista de visitas.
 */
const prepararContenedorPrincipal = (): HTMLElement => {
    const id = 'visit-list';
    const existente = document.getElementById(id);
    if (existente) existente.remove();

    const contenedor = document.createElement('div');
    contenedor.id = id;
    return contenedor;
};

/**
 * Renderiza las tarjetas de visita en la interfaz.
 */
export const renderizarTarjetasVisita = (
    visitas: VisitaCruda[],
    alSeleccionarMapa: (visita: VisitaCruda) => void
) => {
    const contenedor = prepararContenedorPrincipal();
    const elementoProgreso = document.createElement('div');
    elementoProgreso.className = `download-progress ${CONFIG_UI.CLASE_OCULTO}`;

    crearBotonBorrarTodo(contenedor);
    contenedor.appendChild(elementoProgreso);

    visitas.forEach(visita => {
        contenedor.appendChild(crearTarjetaVisita(visita, elementoProgreso, alSeleccionarMapa));
    });

    document.body.appendChild(contenedor);
};
