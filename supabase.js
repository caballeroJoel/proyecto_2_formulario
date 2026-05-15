// Supabase helpers para Sprint 3
// 1) Configura SUPABASE_URL y SUPABASE_KEY si quieres conectar con Supabase.
// 2) Si están vacíos, el proyecto seguirá usando almacenamiento local en el navegador.

const SUPABASE_URL = 'https://vrwrkgwqgswqvybzigdq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EMF2ULroIXrbxY-hSR0Eqg_S-1Kdlww';
const SUPABASE_TABLE = 'encuestas';

const useSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);
let supabaseConectado = false;

async function cargarRespuestasSupabase() {
    if (!useSupabase) {
        return [];
    }

    const url = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?select=*`;
    const response = await fetch(url, {
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Accept: 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('No se pudieron cargar las respuestas de Supabase');
    }

    const data = await response.json();
    return data.map(item => ({
        id: item.id || Date.now(),
        grupo: item.grupo,
        puntuacion: Number(item.puntuacion),
        comentario: item.comentario || '',
        fecha: item.fecha || ''
    }));
}

async function guardarRespuestaSupabase(respuesta) {
    if (!useSupabase) {
        return null;
    }

    const url = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`;
    
    // Enviar solo los campos necesarios, sin el id (lo genera Supabase)
    const datosAEnviar = {
        grupo: respuesta.grupo,
        puntuacion: respuesta.puntuacion,
        comentario: respuesta.comentario,
        fecha: respuesta.fecha
    };
    
    const body = JSON.stringify([datosAEnviar]);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                Prefer: 'return=minimal'
            },
            body
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Error al guardar en Supabase:', response.status, errorData);
            throw new Error(`Status ${response.status}: ${errorData}`);
        }

        console.log('✓ Respuesta guardada en Supabase:', respuesta);
        return respuesta;
    } catch (error) {
        console.error('❌ Fallo al guardar en Supabase:', error.message);
        return null;
    }
}

async function inicializarSupabase() {
    if (!useSupabase) {
        supabaseConectado = false;
        return [];
    }

    try {
        const respuestas = await cargarRespuestasSupabase();
        supabaseConectado = true;
        console.log('Supabase conectado. Respuestas cargadas:', respuestas.length);
        return respuestas;
    } catch (error) {
        supabaseConectado = false;
        console.warn('Supabase no disponible:', error.message);
        return [];
    }
}
