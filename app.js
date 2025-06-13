// Inicialización de Supabase
const supabaseUrl = 'https://qrhgqgvxaydfctptyljt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyaGdxZ3Z4YXlkZmN0cHR5bGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NzMwNTUsImV4cCI6MjA2NTM0OTA1NX0.fvFzTYNODizIK_mtf2ZM5hriOKG2LcJjKhM_b_Kus_U'; // Reemplaza con la clave pública de tu proyecto
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

function mostrarMensaje(texto, tipo) {
    const mensaje = document.getElementById('mensaje');
    mensaje.textContent = texto;
    mensaje.classList.remove('hidden', 'exito', 'error');
    mensaje.classList.add('mensaje', tipo);
    setTimeout(() => mensaje.classList.add('hidden'), 3000);
}

function mostrarMedidas(tipoPrenda) {
    const medidasContainer = document.getElementById('medidasContainer');
    medidasContainer.innerHTML = '';
    let medidas = [];
    if (tipoPrenda === 'Pantalones') {
        medidas = ['Largo', 'Cintura', 'Cadera', 'Rodilla', 'Ruedo', 'Tiro'];
    } else if (tipoPrenda === 'Camisas') {
        medidas = ['Largo', 'Hombro', 'Pecho', 'Espalda', 'Manga', 'Cuello'];
    }
    medidas.forEach(medida => {
        const div = document.createElement('div');
        div.innerHTML = `<label>${medida}: <input type="number" id="medida_${medida.replace(/\s/g, '_')}" required></label><br>`;
        medidasContainer.appendChild(div);
    });
}

document.getElementById('clientForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const tipoPrenda = document.getElementById('tipoPrenda').value;
    let medidas = {};
    if (tipoPrenda === 'Pantalones') {
        medidas = {
            largo: document.getElementById('medida_Largo').value,
            cintura: document.getElementById('medida_Cintura').value,
            cadera: document.getElementById('medida_Cadera').value,
            rodilla: document.getElementById('medida_Rodilla').value,
            ruedo: document.getElementById('medida_Ruedo').value,
            tiro: document.getElementById('medida_Tiro').value
        };
    } else if (tipoPrenda === 'Camisas') {
        medidas = {
            largo: document.getElementById('medida_Largo').value,
            hombro: document.getElementById('medida_Hombro').value,
            pecho: document.getElementById('medida_Pecho').value,
            espalda: document.getElementById('medida_Espalda').value,
            manga: document.getElementById('medida_Manga').value,
            cuello: document.getElementById('medida_Cuello').value
        };
    }
    // Validar medidas
    for (let key in medidas) {
        if (!medidas[key] || isNaN(medidas[key])) {
            return mostrarMensaje(`La medida ${key.replace(/_/g, ' ')} debe ser un número válido`, 'error');
        }
        medidas[key] = Number(medidas[key]);
    }

    const cliente = {
        nombre: document.getElementById('nombre').value.trim(),
        celular: `506${document.getElementById('celular').value.trim().replace(/[^\d]/g, '')}`,
        sexo: document.getElementById('sexo').value,
        tipo_prenda: tipoPrenda,
        temporada: document.getElementById('temporada').value.trim(),
        estado: document.getElementById('estado').value,
        medidas: medidas,
        observaciones: document.getElementById('observaciones').value.trim()
    };

    console.log('Datos enviados a Supabase:', JSON.stringify(cliente, null, 2));
    const { data, error } = await supabase.from('clientes').insert([cliente]);
    if (error) {
        console.error('Error detallado de Supabase:', error);
        mostrarMensaje('Error al guardar cliente: ' + error.message, 'error');
    } else {
        document.getElementById('clientForm').reset();
        mostrarMedidas(tipoPrenda);
        mostrarMensaje('Cliente guardado con éxito', 'exito');
    }
});

// Mostrar medidas al cargar y al cambiar tipo de prenda
document.addEventListener('DOMContentLoaded', () => {
    mostrarMedidas(document.getElementById('tipoPrenda').value);
    document.getElementById('tipoPrenda').addEventListener('change', () => {
        mostrarMedidas(document.getElementById('tipoPrenda').value);
    });
});
