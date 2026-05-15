// ========== DATOS GLOBALES ==========
let respuestas = []; // Array que almacena todas las respuestas
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

// ========== EVENTOS ==========
formularioEncuesta.addEventListener('submit', enviarEncuesta);
filtroGrupo.addEventListener('change', actualizarPanel);

// ========== US-01 + US-02 + US-03: ENVIAR ENCUESTA ==========
function enviarEncuesta(e) {
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

    // Guardar en array
    respuestas.push(nuevaRespuesta);
    console.log('Respuesta guardada:', nuevaRespuesta);
    console.log('Total de respuestas:', respuestas);

    // Limpiar formulario
    formularioEncuesta.reset();

    // Mostrar confirmación visual
    mostrarConfirmacion();

    // Actualizar panel
    actualizarPanel();
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
    // Contar cuántas respuestas hay para cada puntuación
    const conteo = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    respuestasFiltradas.forEach(r => {
        conteo[r.puntuacion]++;
    });

    // Encontrar el máximo para escalar las barras
    const maximo = Math.max(1, ...Object.values(conteo));

    // Actualizar cada barra
    const barras = graficaDistribucion.querySelectorAll('.barra-grupo');
    barras.forEach((grupo, index) => {
        const puntuacion = index + 1;
        const cantidad = conteo[puntuacion];
        const porcentaje = (cantidad / maximo) * 100;

        const barra = grupo.querySelector('.barra');
        barra.style.width = porcentaje + '%';
        barra.textContent = cantidad;
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
