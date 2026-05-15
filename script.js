// ========== DATOS GLOBALES ==========
let respuestas = []; // Array que almacena todas las respuestas
let chartDistribucion = null; // Referencia al gráfico de distribución
let chartComparativa = null; // Referencia al gráfico de Chart.js

// ========== ELEMENTOS DEL DOM ==========
const formularioEncuesta = document.getElementById('formulario-encuesta');
const selectGrupo = document.getElementById('grupo');
const inputComentario = document.getElementById('comentario');
const confirmacion = document.getElementById('confirmacion');
const filtroGrupo = document.getElementById('filtro');

const kpiTotal = document.getElementById('kpi-total');
const kpiMedia = document.getElementById('kpi-media');
const kpiPositivas = document.getElementById('kpi-positivas');

const listadoRespuestas = document.getElementById('listado-respuestas');
const graficaDistribucion = document.getElementById('grafica-distribucion');
const canvasComparativa = document.getElementById('grafica-comparativa');
const estadoGuardado = document.getElementById('estado-guardado');
const estadoTexto = document.getElementById('estado-texto');

// ========== EVENTOS ==========
formularioEncuesta.addEventListener('submit', enviarEncuesta);
filtroGrupo.addEventListener('change', actualizarPanel);
window.addEventListener('load', iniciarApp);

// ========== US-01 + US-02 + US-03: ENVIAR ENCUESTA ==========
async function enviarEncuesta(e) {
    e.preventDefault();

    // Validación
    const grupo = selectGrupo.value;
    const puntuacion = document.querySelector('input[name="puntuacion"]:checked');
    const comentario = inputComentario.value.trim();

    if (!grupo) {
        alert('Por favor, selecciona tu grupo');
        return;
    }

    if (!puntuacion) {
        alert('Por favor, selecciona una puntuación');
        return;
    }

    // Crear objeto de respuesta
    const nuevaRespuesta = {
        id: Date.now(), // ID único basado en timestamp
        grupo: grupo,
        puntuacion: parseInt(puntuacion.value),
        comentario: comentario,
        fecha: new Date().toLocaleString('es-ES')
    };

    // Guardar en Supabase si está configurado, o localmente
    const guardado = await guardarRespuesta(nuevaRespuesta);
    if (guardado) {
        respuestas.push(guardado);
    } else {
        respuestas.push(nuevaRespuesta);
    }

    console.log('Respuesta guardada:', guardado || nuevaRespuesta);
    console.log('Total de respuestas:', respuestas);

    // Limpiar formulario
    formularioEncuesta.reset();

    // Mostrar confirmación visual
    mostrarConfirmacion();

    // Actualizar panel
    actualizarPanel();
}

async function guardarRespuesta(respuesta) {
    if (typeof guardarRespuestaSupabase === 'function') {
        try {
            const resultado = await guardarRespuestaSupabase(respuesta);
            if (resultado) {
                console.log('Respuesta guardada exitosamente');
                return resultado;
            } else {
                console.warn('Guardado en Supabase falló, usando array local');
                return respuesta;
            }
        } catch (error) {
            console.warn('Error al guardar en Supabase:', error.message);
            return respuesta;
        }
    }
    return respuesta;
}

async function iniciarApp() {
    if (typeof inicializarSupabase === 'function') {
        respuestas = await inicializarSupabase();
    }
    actualizarEstadoGuardado();
    actualizarPanel();
}

// ========== ACTUALIZAR ESTADO DE GUARDADO ==========
function actualizarEstadoGuardado() {
    if (typeof supabaseConectado === 'undefined') {
        estadoTexto.textContent = 'Modo local';
        estadoGuardado.classList.remove('supabase');
        estadoGuardado.classList.add('local');
    } else if (supabaseConectado) {
        estadoTexto.textContent = 'Guardando en Supabase';
        estadoGuardado.classList.remove('local');
        estadoGuardado.classList.add('supabase');
    } else {
        estadoTexto.textContent = 'Modo local';
        estadoGuardado.classList.remove('supabase');
        estadoGuardado.classList.add('local');
    }
}

// ========== CONFIRMACIÓN VISUAL ==========
function mostrarConfirmacion() {
    confirmacion.classList.remove('confirmacion-oculta');
    confirmacion.classList.add('confirmacion-visible');

    // Desaparecer después de 3 segundos
    setTimeout(() => {
        confirmacion.classList.remove('confirmacion-visible');
        confirmacion.classList.add('confirmacion-oculta');
    }, 3000);
}

// ========== ACTUALIZAR PANEL (KPIS, GRÁFICAS, LISTADO) ==========
function actualizarPanel() {
    const grupoFiltro = filtroGrupo.value;

    // Filtrar respuestas según grupo seleccionado
    const respuestasFiltradas = grupoFiltro === 'todos'
        ? respuestas
        : respuestas.filter(r => r.grupo === grupoFiltro);

    // Actualizar KPIs
    actualizarKPIs(respuestasFiltradas);

    // Actualizar gráficas
    actualizarGraficas(respuestasFiltradas);

    // Actualizar listado
    actualizarListado(respuestasFiltradas);
}

// ========== CALCULAR Y ACTUALIZAR KPIS ==========
function actualizarKPIs(respuestasFiltradas) {
    const total = respuestasFiltradas.length;
    let suma = 0;
    let positivas = 0;

    respuestasFiltradas.forEach(r => {
        suma += r.puntuacion;
        if (r.puntuacion >= 4) {
            positivas++;
        }
    });

    const media = total > 0 ? (suma / total).toFixed(1) : '0.0';
    const porcentajePositivas = total > 0 ? Math.round((positivas / total) * 100) : 0;

    // Actualizar DOM
    kpiTotal.textContent = total;
    kpiMedia.textContent = media;
    kpiPositivas.textContent = porcentajePositivas + '%';
}

// ========== ACTUALIZAR GRÁFICAS ==========
function actualizarGraficas(respuestasFiltradas) {
    actualizarGraficaDistribucion(respuestasFiltradas);
    actualizarGraficaComparativa();
}

// Gráfica de Distribución de Puntuaciones
function actualizarGraficaDistribucion(respuestasFiltradas) {
    const labels = ['1', '2', '3', '4', '5'];
    const conteo = [0, 0, 0, 0, 0];

    respuestasFiltradas.forEach(r => {
        conteo[r.puntuacion - 1]++;
    });

    // Si el gráfico ya existe, destruirlo
    if (chartDistribucion) {
        chartDistribucion.destroy();
    }

    const ctx = graficaDistribucion.getContext('2d');
    chartDistribucion = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Respuestas',
                data: conteo,
                backgroundColor: ['#e74c3c', '#e67e22', '#f39c12', '#2ecc71', '#27ae60'],
                borderColor: ['#c0392b', '#d35400', '#d68910', '#27ae60', '#229954'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y;
                        }
                    }
                }
            }
        }
    });
}

// Gráfica Comparativa por Grupo (QUESITO CON CHART.JS)
function actualizarGraficaComparativa() {
    const grupos = ['DAW1A', 'DAW1B', 'ASIX1'];
    const promedios = [];

    // Calcular promedio por grupo
    grupos.forEach(grupo => {
        const respuestasGrupo = respuestas.filter(r => r.grupo === grupo);
        if (respuestasGrupo.length > 0) {
            const suma = respuestasGrupo.reduce((acc, r) => acc + r.puntuacion, 0);
            promedios.push(suma / respuestasGrupo.length);
        } else {
            promedios.push(0);
        }
    });

    const colores = ['#3498db', '#9b59b6', '#e74c3c'];

    // Si el gráfico ya existe, destruirlo
    if (chartComparativa) {
        chartComparativa.destroy();
    }

    // Crear nuevo gráfico de quesito (doughnut)
    const ctx = canvasComparativa.getContext('2d');
    chartComparativa = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: grupos,
            datasets: [{
                data: promedios,
                backgroundColor: colores,
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 12 },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed.toFixed(1) + '/5';
                        }
                    }
                }
            }
        }
    });
}

// ========== ACTUALIZAR LISTADO DE RESPUESTAS ==========
function actualizarListado(respuestasFiltradas) {
    if (respuestasFiltradas.length === 0) {
        listadoRespuestas.innerHTML = '<p class="sin-respuestas">Sin respuestas aún</p>';
        return;
    }

    // Ordenar por más reciente primero
    const respuestasOrdenadas = [...respuestasFiltradas].reverse();

    listadoRespuestas.innerHTML = respuestasOrdenadas.map(r => `
        <div class="respuesta-tarjeta puntuacion-${r.puntuacion}">
            <div class="respuesta-header">
                <span class="respuesta-grupo">${r.grupo}</span>
                <span class="respuesta-puntuacion">${r.puntuacion}/5</span>
            </div>
            ${r.comentario ? `<p class="respuesta-comentario">"${r.comentario}"</p>` : ''}
            <small style="color: #95a5a6;">${r.fecha}</small>
        </div>
    `).join('');
}

// ========== INICIALIZACIÓN ==========
console.log('Script cargado. Lista para recibir respuestas.');
