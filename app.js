// Forzar inicialización de Supabase
delete window.supabase;
const supabaseUrl = 'https://ypdcxfkdwywgemwzkcso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwZGN4Zmtkd3l3Z2Vtd3prY3NvIiwicm9sZSI0NjQyLCJpYXQiOjE3NDk2MTE0NTYsImV4cCI6MjA2NTE4NzQ1Nn0.jhzSlskDmNa0y-I-u6vi80tT6D3UKpZ18tTGLGJMTfA';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let medidasTemporales = [];
let temporadaActual = null;

function mostrarMensaje(texto, tipo) {
    const mensaje = document.getElementById('mensaje');
    mensaje.textContent = texto;
    mensaje.classList.remove('hidden', 'exito', 'error');
    mensaje.classList.add('mensaje', tipo);
    setTimeout(() => mensaje.classList.add('hidden'), 3000);
}

function mostrarSeccion(seccionId) {
    document.querySelectorAll('.section').forEach(section => section.classList.add('hidden'));
    document.getElementById(seccionId).classList.remove('hidden');
    if (seccionId === 'temporadas') cargarTemporadas();
    if (seccionId === 'detalleTemporada' && temporadaActual) mostrarClientesTemporada();
    if (seccionId === 'verClientes') buscarClientes();
    if (seccionId === 'verPrendas') cargarPrendas();
}

function limpiarFormulario() {
    document.getElementById('clientForm').reset();
    document.getElementById('temporadaSelect').value = '';
    document.getElementById('tipoPrenda').value = 'Pantalones';
    document.getElementById('estado').value = 'Pendiente';
    mostrarMedidas();
    mostrarMensaje('Formulario limpio', 'exito');
}

async function cargarTiposPrenda() {
    const { data: tipos, error } = await supabase.from('tipos_prenda').select('nombre');
    if (error) return mostrarMensaje('Error al cargar tipos de prenda: ' + error.message, 'error');
    const tipoPrendaSelect = document.getElementById('tipoPrenda');
    tipoPrendaSelect.innerHTML = `
        <option value="Pantalones">Pantalones</option>
        <option value="Camisas">Camisas</option>
    `;
    tipos.forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo.nombre;
        option.text = tipo.nombre;
        tipoPrendaSelect.appendChild(option);
    });
    mostrarMedidas();
}

async function cargarTemporadas() {
    const temporadaSelect = document.getElementById('temporadaSelect');
    const temporadasList = document.getElementById('temporadasList');
    if (!temporadasList) {
        console.error('Error: El elemento con id="temporadasList" no se encuentra en el DOM');
        mostrarMensaje('Error: No se encontró la lista de temporadas en la página', 'error');
        return;
    }
    const { data: temporadas, error } = await supabase.from('temporadas').select('nombre');
    if (error) {
        console.error('Error al cargar temporadas desde Supabase:', error);
        return mostrarMensaje('Error al cargar temporadas: ' + error.message, 'error');
    }
    temporadaSelect.innerHTML = '<option value="">Selecciona Temporada</option>';
    temporadasList.innerHTML = '';
    temporadas.forEach(temporada => {
        const option = document.createElement('option');
        option.value = temporada.nombre;
        option.text = temporada.nombre;
        temporadaSelect.appendChild(option);
        const div = document.createElement('div');
        div.className = 'temporada-item';
        div.innerHTML = `
            <span>${temporada.nombre}</span>
            <button onclick="verTemporada('${temporada.nombre.replace(/'/g, "\\'")}')">Ver</button>
            <button onclick="eliminarTemporada('${temporada.nombre.replace(/'/g, "\\'")}')">Eliminar</button>
        `;
        temporadasList.appendChild(div);
    });
}

async function agregarTemporada() {
    const nombre = document.getElementById('nuevaTemporada').value.trim();
    if (!nombre) return mostrarMensaje('Ingrese un nombre válido', 'error');
    const { error } = await supabase.from('temporadas').upsert([{ nombre }], { onConflict: 'nombre' });
    if (error) return mostrarMensaje('Error al agregar temporada: ' + error.message, 'error');
    cargarTemporadas();
    document.getElementById('nuevaTemporada').value = '';
    mostrarMensaje('Temporada agregada', 'exito');
}

async function eliminarTemporada(nombre) {
    if (!confirm(`¿Eliminar ${nombre}? Esto eliminará todos los clientes asociados.`)) return;
    const { error: errorClientes } = await supabase.from('clientes').delete().eq('temporada', nombre);
    if (errorClientes) return mostrarMensaje('Error al eliminar clientes de la temporada: ' + error.message, 'error');
    const { error } = await supabase.from('temporadas').delete().eq('nombre', nombre);
    if (error) return mostrarMensaje('Error al eliminar temporada: ' + error.message, 'error');
    cargarTemporadas();
    mostrarMensaje('Temporada eliminada', 'exito');
}

function verTemporada(nombre) {
    temporadaActual = nombre;
    document.getElementById('temporadaNombre').textContent = nombre;
    mostrarSeccion('detalleTemporada');
}

function agregarMedida() {
    const medida = document.getElementById('nuevaMedida').value.trim();
    if (!medida) return mostrarMensaje('Ingrese una medida válida', 'error');
    medidasTemporales.push(medida);
    const medidasList = document.getElementById('medidasList');
    medidasList.innerHTML = '';
    medidasTemporales.forEach((medida, index) => {
        const li = document.createElement('li');
        li.textContent = medida;
        const btn = document.createElement('button');
        btn.textContent = 'Eliminar';
        btn.onclick = () => {
            medidasTemporales.splice(index, 1);
            agregarMedida();
        };
        li.appendChild(btn);
        medidasList.appendChild(li);
    });
    document.getElementById('nuevaMedida').value = '';
}

async function guardarTipoPrenda() {
    const nombre = document.getElementById('nuevoTipoPrenda').value.trim();
    if (!nombre || medidasTemporales.length === 0) return mostrarMensaje('Ingrese nombre y al menos una medida', 'error');
    const { error } = await supabase.from('tipos_prenda').upsert([{ nombre, medidas: medidasTemporales }]);
    if (error) return mostrarMensaje('Error al guardar tipo de prenda: ' + error.message, 'error');
    cargarTiposPrenda();
    document.getElementById('nuevoTipoPrenda').value = '';
    medidasTemporales = [];
    document.getElementById('medidasList').innerHTML = '';
    mostrarMensaje('Tipo de prenda guardado', 'exito');
    mostrarSeccion('menuPrincipal');
}

async function mostrarMedidas() {
    const tipoPrenda = document.getElementById('tipoPrenda').value;
    const medidasContainer = document.getElementById('medidasContainer');
    medidasContainer.innerHTML = '';
    let medidas = [];
    if (tipoPrenda === 'Pantalones') {
        medidas = ['Largo', 'Cintura', 'Cadera', 'Rodilla', 'Ruedo', 'Tiro'];
        renderMedidas(medidas);
    } else if (tipoPrenda === 'Camisas') {
        medidas = ['Largo', 'Hombro', 'Pecho', 'Espalda', 'Manga', 'Cuello'];
        renderMedidas(medidas);
    } else {
        const { data: tipo, error } = await supabase.from('tipos_prenda').select('medidas').eq('nombre', tipoPrenda).single();
        if (error) return mostrarMensaje('Error al cargar medidas: ' + error.message, 'error');
        if (tipo) renderMedidas(tipo.medidas);
    }
}

function renderMedidas(medidas) {
    const medidasContainer = document.getElementById('medidasContainer');
    medidas.forEach(medida => {
        const div = document.createElement('div');
        div.innerHTML = `
            <label>${medida}</label>
            <input type="number" id="medida_${medida.replace(/\s/g, '_')}" placeholder="${medida}" required>
        `;
        medidasContainer.appendChild(div);
    });
}

document.getElementById('clientForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const tipoPrenda = document.getElementById('tipoPrenda').value;
    const temporada = document.getElementById('temporadaSelect').value;
    const estado = document.getElementById('estado').value;
    if (!temporada) return mostrarMensaje('Seleccione una temporada', 'error');
    let medidas = {};
    if (tipoPrenda === 'Pantalones') {
        medidas = {
            largo: document.getElementById('medida_Largo')?.value,
            cintura: document.getElementById('medida_Cintura')?.value,
            cadera: document.getElementById('medida_Cadera')?.value,
            rodilla: document.getElementById('medida_Rodilla')?.value,
            ruedo: document.getElementById('medida_Ruedo')?.value,
            tiro: document.getElementById('medida_Tiro')?.value
        };
    } else if (tipoPrenda === 'Camisas') {
        medidas = {
            largo: document.getElementById('medida_Largo')?.value,
            hombro: document.getElementById('medida_Hombro')?.value,
            pecho: document.getElementById('medida_Pecho')?.value,
            espalda: document.getElementById('medida_Espalda')?.value,
            manga: document.getElementById('medida_Manga')?.value,
            cuello: document.getElementById('medida_Cuello')?.value
        };
    } else {
        const { data: tipo, error } = await supabase.from('tipos_prenda').select('medidas').eq('nombre', tipoPrenda).single();
        if (error) return mostrarMensaje('Error al cargar medidas: ' + error.message, 'error');
        tipo.medidas.forEach(medida => {
            medidas[medida] = document.getElementById(`medida_${medida.replace(/\s/g, '_')}`)?.value;
        });
    }
    // Validar y convertir medidas a números
    for (let key in medidas) {
        const value = medidas[key];
        if (value === undefined || value === '' || isNaN(value)) {
            return mostrarMensaje(`La medida ${key.replace(/_/g, ' ')} debe ser un número válido`, 'error');
        }
        medidas[key] = Number(value);
    }
    await guardarCliente(medidas, estado);
});

async function guardarCliente(medidas, estado) {
    let celular = document.getElementById('celular').value.trim().replace(/[^\d]/g, '');
    if (!celular.match(/^\d{8}$/)) return mostrarMensaje('El número debe tener 8 dígitos', 'error');
    celular = `506${celular}`;
    const cliente = {
        nombre: document.getElementById('nombre').value.trim(),
        celular,
        sexo: document.getElementById('sexo').value,
        tipo_prenda: document.getElementById('tipoPrenda').value,
        temporada: document.getElementById('temporadaSelect').value,
        estado,
        medidas,
        observaciones: document.getElementById('observaciones').value.trim()
    };
    console.log('Datos enviados a Supabase:', JSON.stringify(cliente, null, 2));
    const { data, error } = await supabase.from('clientes').insert([cliente]);
    if (error) {
        console.error('Error detallado de Supabase:', error);
        mostrarMensaje('Error al guardar cliente: ' + (error.message || 'Ver consola para detalles'), 'error');
    } else {
        limpiarFormulario();
        mostrarMensaje('Cliente guardado con éxito', 'exito');
        mostrarSeccion('menuPrincipal');
    }
}

async function mostrarClientesTemporada(filtroNombre = '', filtroSexo = '', filtroEstado = '') {
    if (!temporadaActual) {
        mostrarMensaje('Seleccione una temporada primero', 'error');
        mostrarSeccion('temporadas');
        return;
    }
    let query = supabase
        .from('clientes')
        .select('*')
        .eq('temporada', temporadaActual)
        .ilike('nombre', `%${filtroNombre}%`);
    if (filtroSexo) query = query.eq('sexo', filtroSexo);
    if (filtroEstado) query = query.eq('estado', filtroEstado);
    const { data: clientes, error } = await query;
    if (error) return mostrarMensaje('Error al cargar clientes: ' + error.message, 'error');
    const clientesTemporada = document.getElementById('clientesTemporada');
    clientesTemporada.innerHTML = '';
    const prendas = [...new Set(clientes.map(cliente => cliente.tipo_prenda))];
    prendas.forEach(prenda => {
        const div = document.createElement('div');
        div.className = 'prenda-section';
        div.innerHTML = `<h4>${prenda}</h4>`;
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Celular</th>
                    <th>Sexo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${clientes
                .filter(cliente => cliente.tipo_prenda === prenda)
                .map(cliente => {
                    const numeroMostrado = cliente.celular.replace(/^506/, '');
                    return `
                            <tr>
                                <td>${cliente.nombre}</td>
                                <td><a href="https://wa.me/${cliente.celular}" target="_blank"><i class="fab fa-whatsapp"></i> ${numeroMostrado}</a></td>
                                <td>${cliente.sexo}</td>
                                <td>${cliente.estado}</td>
                                <td>
                                    <button onclick="editarCliente(${cliente.id})"><i class="fas fa-edit"></i> Editar</button>
                                    <button onclick="eliminarCliente(${cliente.id})"><i class="fas fa-trash"></i> Eliminar</button>
                                </td>
                            </tr>
                        `;
                }).join('')}
            </tbody>
        `;
        div.appendChild(table);
        clientesTemporada.appendChild(div);
    });
}

async function buscarClientes(filtroNombre = '', filtroCelular = '') {
    const { data: clientes, error } = await supabase
        .from('clientes')
        .select('*')
        .ilike('nombre', `%${filtroNombre}%`)
        .ilike('celular', `%${filtroCelular}%`);
    if (error) return mostrarMensaje('Error al cargar clientes: ' + error.message, 'error');
    const clientesLista = document.getElementById('clientesLista');
    clientesLista.innerHTML = '';
    if (clientes.length === 0) {
        clientesLista.innerHTML = '<p>No se encontraron clientes.</p>';
        return;
    }
    const table = document.createElement('table');
    table.className = 'clientes-lista';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Nombre</th>
                <th>Celular</th>
                <th>Sexo</th>
                <th>Temporada</th>
                <th>Prenda</th>
                <th>Estado</th>
                <th>Medidas</th>
                <th>Observaciones</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            ${clientes.map(cliente => {
        const numeroMostrado = cliente.celular.replace(/^506/, '');
        return `
                    <tr>
                        <td>${cliente.nombre}</td>
                        <td><a href="https://wa.me/${cliente.celular}" target="_blank"><i class="fab fa-whatsapp"></i> ${numeroMostrado}</a></td>
                        <td>${cliente.sexo}</td>
                        <td>${cliente.temporada}</td>
                        <td>${cliente.tipo_prenda}</td>
                        <td>${cliente.estado}</td>
                        <td>${Object.entries(cliente.medidas)
                .map(([key, value]) => `${key}: ${value || '-'}`)
                .join(', ')}</td>
                        <td>${cliente.observaciones || '-'}</td>
                        <td>
                            <button onclick="editarCliente(${cliente.id})"><i class="fas fa-edit"></i> Editar</button>
                            <button onclick="eliminarCliente(${cliente.id})"><i class="fas fa-trash"></i> Eliminar</button>
                        </td>
                    </tr>
                `;
    }).join('')}
        </tbody>
    `;
    clientesLista.appendChild(table);
}

async function editarCliente(id) {
    const { data: cliente, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();
    if (error) return mostrarMensaje('Error al cargar cliente: ' + error.message, 'error');
    document.getElementById('nombre').value = cliente.nombre;
    document.getElementById('celular').value = cliente.celular.replace(/^506/, '');
    document.getElementById('sexo').value = cliente.sexo;
    document.getElementById('tipoPrenda').value = cliente.tipo_prenda;
    document.getElementById('temporadaSelect').value = cliente.temporada;
    document.getElementById('estado').value = cliente.estado;
    document.getElementById('observaciones').value = cliente.observaciones;
    mostrarMedidas();
    const medidasContainer = document.getElementById('medidasContainer');
    medidasContainer.addEventListener('transitionend', function handler() {
        for (const [key, value] of Object.entries(cliente.medidas)) {
            const input = document.getElementById(`medida_${key.replace(/\s/g, '_')}`);
            if (input) input.value = value;
        }
        medidasContainer.removeEventListener('transitionend', handler);
    }, { once: true });
    await supabase.from('clientes').delete().eq('id', id);
    mostrarMensaje('Cliente listo para editar', 'exito');
    mostrarSeccion('registrarCliente');
}

async function eliminarCliente(id) {
    if (!confirm('¿Eliminar este cliente?')) return;
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) return mostrarMensaje('Error al eliminar cliente: ' + error.message, 'error');
    mostrarClientesTemporada();
    buscarClientes(
        document.getElementById('buscarNombreCliente')?.value || '',
        document.getElementById('buscarCelular')?.value || ''
    );
    mostrarMensaje('Cliente eliminado', 'exito');
}

async function cargarPrendas() {
    const { data: prendas, error } = await supabase.from('tipos_prenda').select('nombre, medidas');
    if (error) return mostrarMensaje('Error al cargar prendas: ' + error.message, 'error');
    const prendasList = document.getElementById('prendasList');
    prendasList.innerHTML = '';
    prendas.forEach(prenda => {
        const div = document.createElement('div');
        div.className = 'prenda-item';
        div.innerHTML = `
            <span>${prenda.nombre} (Medidas: ${prenda.medidas.join(', ')})</span>
            <button onclick="editarPrenda('${prenda.nombre.replace(/'/g, "\\'")}')"><i class="fas fa-edit"></i> Editar</button>
            <button onclick="eliminarPrenda('${prenda.nombre.replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i> Eliminar</button>
        `;
        prendasList.appendChild(div);
    });
}

async function editarPrenda(nombre) {
    const { data: prenda, error } = await supabase
        .from('tipos_prenda')
        .select('nombre, medidas')
        .eq('nombre', nombre)
        .single();
    if (error) return mostrarMensaje('Error al cargar prenda: ' + error.message, 'error');
    document.getElementById('nuevoTipoPrenda').value = prenda.nombre;
    medidasTemporales = [...prenda.medidas];
    const medidasList = document.getElementById('medidasList');
    medidasList.innerHTML = '';
    prenda.medidas.forEach((medida, index) => {
        const li = document.createElement('li');
        li.textContent = medida;
        const btn = document.createElement('button');
        btn.textContent = 'Eliminar';
        btn.onclick = function () {
            medidasTemporales.splice(index, 1);
            agregarMedida();
        };
        li.appendChild(btn);
        medidasList.appendChild(li);
    });
    await supabase.from('tipos_prenda').delete().eq('nombre', nombre);
    mostrarMensaje('Prenda lista para editar', 'exito');
    mostrarSeccion('crearPrenda');
}

async function eliminarPrenda(nombre) {
    if (!confirm(`¿Eliminar ${nombre}? Esto no afectará a los clientes existentes.`)) return;
    const { error } = await supabase.from('tipos_prenda').delete().eq('nombre', nombre);
    if (error) return mostrarMensaje('Error al eliminar prenda: ' + error.message, 'error');
    cargarPrendas();
    mostrarMensaje('Prenda eliminada', 'exito');
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Supabase inicializado con URL:', supabaseUrl);
    cargarTiposPrenda();
    cargarTemporadas();
    mostrarSeccion('menuPrincipal');

    const buscarNombreCliente = document.getElementById('buscarNombreCliente');
    const buscarCelular = document.getElementById('buscarCelular');
    if (buscarNombreCliente && buscarCelular) {
        buscarNombreCliente.addEventListener('input', () => {
            buscarClientes(buscarNombreCliente.value, buscarCelular.value);
        });
        buscarCelular.addEventListener('input', () => {
            buscarClientes(buscarNombreCliente.value, buscarCelular.value);
        });
    }
    const buscarNombre = document.getElementById('buscarNombre');
    const filtroSexo = document.getElementById('filtroSexo');
    const filtroEstado = document.getElementById('filtroEstado');
    const exportarBtn = document.getElementById('exportarBtn');
    if (buscarNombre) {
        buscarNombre.addEventListener('input', () => {
            mostrarClientesTemporada(
                buscarNombre.value,
                filtroSexo.value,
                filtroEstado.value
            );
        });
    }
    if (filtroSexo) {
        filtroSexo.addEventListener('change', () => {
            mostrarClientesTemporada(
                buscarNombre.value,
                filtroSexo.value,
                filtroEstado.value
            );
        });
    }
    if (filtroEstado) {
        filtroEstado.addEventListener('change', () => {
            mostrarClientesTemporada(
                buscarNombre.value,
                filtroSexo.value,
                filtroEstado.value
            );
        });
    }
    if (exportarBtn) {
        exportarBtn.addEventListener('click', async () => {
            const { data: clientes, error } = await supabase
                .from('clientes')
                .select('*')
                .eq('temporada', temporadaActual);
            if (error) return mostrarMensaje('Error al exportar datos: ' + error.message, 'error');
            let csvContent = 'Nombre,Celular,Sexo,TipoPrenda,Temporada,Estado,';
            const todasMedidas = new Set();
            clientes.forEach(cliente => {
                Object.keys(cliente.medidas).forEach(medida => todasMedidas.add(medida));
            });
            csvContent += Array.from(todasMedidas).join(',') + ',Observaciones\n';
            clientes.forEach(cliente => {
                const numeroMostrado = cliente.celular.replace(/^506/, '');
                csvContent += `${cliente.nombre},${numeroMostrado},${cliente.sexo},${cliente.tipo_prenda},${cliente.temporada},${cliente.estado},`;
                csvContent += Array.from(todasMedidas).map(medida => cliente.medidas[medida] || '').join(',');
                csvContent += `,${cliente.observaciones.replace(/,/g, '')}\n`;
            });
            const fecha = new Date().toISOString().slice(0, 10);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `clientes_${temporadaActual}_${fecha}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            mostrarMensaje('Datos exportados a CSV', 'exito');
        });
    }
});

async function exportarTodoCSV() {
    const { data: clientes, error } = await supabase.from('clientes').select('*');
    if (error) return mostrarMensaje('Error al exportar todos los datos: ' + error.message, 'error');
    let csvContent = 'Nombre,Celular,Sexo,TipoPrenda,Temporada,Estado,';
    const todasMedidas = new Set();
    clientes.forEach(cliente => {
        Object.keys(cliente.medidas).forEach(medida => todasMedidas.add(medida));
    });
    csvContent += Array.from(todasMedidas).join(',') + ',Observaciones\n';
    clientes.forEach(cliente => {
        const numeroMostrado = cliente.celular.replace(/^506/, '');
        csvContent += `${cliente.nombre},${numeroMostrado},${cliente.sexo},${cliente.tipo_prenda},${cliente.temporada},${cliente.estado},`;
        csvContent += Array.from(todasMedidas).map(medida => cliente.medidas[medida] || '').join(',');
        csvContent += `,${cliente.observaciones.replace(/,/g, ' ')}\n`;
    });
    const fecha = new Date().toISOString().slice(0, 10);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todos_clientes_${fecha}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarMensaje('Todos los datos a CSV', 'exito');
}p
