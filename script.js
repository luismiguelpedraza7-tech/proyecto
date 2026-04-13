// --- CONFIGURACIÓN DE SUPABASE ---
const SB_URL = "https://jwmzmnohrwbazllozapr.supabase.co";
const SB_KEY = "sb_publishable_5mK5uK1cVY0d971kr75oRA_P8kpfLrl"; 
// Asegúrate de que la librería de Supabase esté cargada antes de este script
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

// Referencias a elementos del DOM existentes
const pantallaLogin = document.querySelector("#pantalla-login");
const inputEmailLogin = document.querySelector("#inputEmailLogin");
const inputPasswordLogin = document.querySelector("#inputPasswordLogin");
const btnRegistrarseLogin = document.querySelector("#btnRegistrarseLogin");
const btnIniciarSesionLogin = document.querySelector("#btnIniciarSesionLogin");
const authMessageLogin = document.querySelector("#authMessageLogin");
const pantallaRegistro = document.querySelector("#pantalla-registro");
const registroForm = document.querySelector("#registroForm");
const regEmail = document.querySelector("#regEmail");
const regPassword = document.querySelector("#regPassword");
const btnConfirmarRegistro = document.querySelector("#btnConfirmarRegistro");
const btnVolverLoginRegistro = document.querySelector("#btnVolverLoginRegistro");
const authMessageRegistro = document.querySelector("#authMessageRegistro");
const btnInventario = document.querySelector("#btn-Inventario");
const pantallaInicio = document.querySelector("#pantalla-inicio");
const pantallaInventario = document.querySelector("#pantalla-INVENTARIO");
const inputProductoImagen = document.querySelector("#inputProductoImagen");
const previewProductoImagen = document.querySelector("#previewProductoImagen");
const btnSeleccionarImagen = document.querySelector("#btnSeleccionarImagen");
const inputNombreProducto = document.querySelector("#inputNombreProducto");
const inputPrecioProducto = document.querySelector("#inputPrecioProducto");
const inputCantidadProducto = document.querySelector("#inputCantidadProducto");

const btnGuardarProducto = document.querySelector("#btnGuardarProducto");
const btnLimpiarFormulario = document.querySelector("#btnLimpiarFormulario");

// Elementos corregidos en HTML
const contenedorProductos = document.querySelector("#contenedorProductos"); 
const templateTarjetaProducto = document.querySelector("#template-tarjeta-producto");
const btnVolverInicio = document.querySelector("#btnVolverInicio");

// referencias para la búsqueda 
const inputBuscarProducto = document.querySelector("#inputBuscarProducto");
const btnBuscarProducto = document.querySelector("#btnBuscarProducto");
const btnLimpiarBusqueda = document.querySelector("#btnLimpiarBusqueda");
const totalProductosCountElement = document.querySelector("#totalProductosCount");
const btnExportarDatos = document.querySelector("#btnExportarDatos");
const btnLogout = document.querySelector("#btnLogout");

const btnGoogle = document.querySelector("#btnGoogle");

let imagenProductoActual = '';
let inventory = [];
let editingProductId = null; 

// --- FUNCIONES DE NUBE (Reemplazan LocalStorage) ---

// Cargar inventario desde Supabase
async function loadInventory() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return; // Si no hay usuario, no se carga nada.

    const { data, error } = await supabaseClient
        .from('productos')
        .select('*')
        .eq('user_id', user.id); 

    if (error) {
        console.error("Error cargando inventario:", error);
        // Aquí podrías mostrar un mensaje al usuario si es relevante
    } else {
        inventory = data; // Asigna los datos cargados al array inventory
        renderProducts();
        updateProductCount();
    }
}

// Función para mostrar mensajes de autenticación (Se mantiene)
function displayAuthMessage(element, message, type = '') {
    element.textContent = message;
    element.className = 'auth-message'; 
    if (type) element.classList.add(type);
    element.style.display = message ? 'block' : 'none';
}

// Función para mostrar pantallas (Se mantiene)
function showScreen(screenId) {
    pantallaLogin.style.display = 'none';
    pantallaRegistro.style.display = 'none';
    pantallaInicio.style.display = 'none';
    pantallaInventario.style.display = 'none';

    switch (screenId) {
        case 'pantalla-login':
            pantallaLogin.style.display = 'flex'; 
            displayAuthMessage(authMessageLogin, ''); 
            break;
        case 'pantalla-registro':
            pantallaRegistro.style.display = 'flex'; 
            displayAuthMessage(authMessageRegistro, '');
            break;
        case 'pantalla-inicio':
            pantallaInicio.style.display = 'block';
            clearSearch(); 
            resetFormAndMode();
            break;
        case 'pantalla-INVENTARIO':
            pantallaInventario.style.display = 'block';
            resetFormAndMode(); 
            loadInventory(); // Carga el inventario al ir a la pantalla de inventario
            break;
    }
}

// Verificar estado de sesión (Ahora con Supabase)
async function checkAuthStatus() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        showScreen('pantalla-inicio');
    } else {
        showScreen('pantalla-login');
    }
}

// --- Funciones de Renderizado (Se mantienen igual) ---
function renderProducts(productsToRender = inventory) {
    if (!contenedorProductos) { console.error("Error: #contenedorProductos no encontrado."); return; }
    if (!templateTarjetaProducto) { console.error("Error: #template-tarjeta-producto no encontrado."); return; }

    contenedorProductos.innerHTML = ''; 

    if (productsToRender.length === 0 && inputBuscarProducto.value.trim() !== '') {
        contenedorProductos.innerHTML = '<p style="text-align: center; width: 100%; margin-top: 20px; font-size: 1.2em; color: #555;">No se encontraron productos.</p>';
        return;
    } else if (productsToRender.length === 0 && inventory.length === 0) {
        contenedorProductos.innerHTML = '<p style="text-align: center; width: 100%; margin-top: 20px; font-size: 1.2em; color: #555;">El inventario está vacío.</p>';
        return;
    }
    productsToRender.forEach(product => {
        const nuevaTarjeta = templateTarjetaProducto.content.cloneNode(true);
        const cardDiv = nuevaTarjeta.querySelector(".tarjeta-producto");
        cardDiv.dataset.id = product.id;

        nuevaTarjeta.querySelector(".producto-imagen").src = product.imagen;
        nuevaTarjeta.querySelector(".producto-nombre").textContent = product.nombre;
        nuevaTarjeta.querySelector(".producto-precio").textContent = `$${product.precio}`;
        nuevaTarjeta.querySelector(".producto-cantidad").textContent = `Unidades: ${product.cantidad}`;

        contenedorProductos.appendChild(nuevaTarjeta);
    });
}

function updateProductCount() {
    totalProductosCountElement.textContent = inventory.length;
}

// --- Lógica de Formulario Guardar (Ahora a la Nube) ---

async function handleSaveProduct() {
    const nombre = inputNombreProducto.value.trim();
    const precio = parseFloat(inputPrecioProducto.value);
    const cantidad = parseInt(inputCantidadProducto.value);

    // Validaciones (Tus validaciones originales)
    if (!nombre) { alert("Ingresa el nombre."); return; }
    if (isNaN(precio) || precio <= 0) { alert("Precio inválido."); return; }
    if (!imagenProductoActual) { alert("Selecciona una imagen."); return; } // Considera subir la imagen al storage de Supabase
    if (isNaN(cantidad) || cantidad <= 0) { alert("Cantidad inválida."); return; }

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) { // Asegurarse de que hay un usuario logueado
        alert("Debes iniciar sesión para guardar productos.");
        showScreen('pantalla-login');
        return;
    }

    if (editingProductId !== null) {
        // EDITAR EN LA NUBE
        const { error } = await supabaseClient
            .from('productos')
            .update({ nombre, precio, cantidad, imagen: imagenProductoActual })
            .eq('id', editingProductId);

        if (!error) {
            alert(`¡"${nombre}" actualizado!`);
            resetFormAndMode(); 
            loadInventory(); // Recarga desde la nube después de la edición
        } else {
            console.error("Error al actualizar producto:", error);
            alert("Error al actualizar el producto.");
        }
    } else {
        // AÑADIR A LA NUBE
        const { error } = await supabaseClient
            .from('productos')
            .insert([{ 
                nombre, precio, cantidad, 
                imagen: imagenProductoActual, 
                user_id: user.id 
            }]);

        if (!error) {
            alert(`¡"${nombre}" añadido!`);
            resetFormAndMode(); 
            loadInventory(); // Recarga desde la nube después de añadir
        } else {
            console.error("Error al añadir producto:", error);
            alert("Error al añadir el producto.");
        }
    }

    
}

// --- Lógica de Autenticación con Google y Email ---

async function handleLoginWithGoogle() {
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin } // Redirige a la URL actual después de la autenticación
    });
    if (error) {
        displayAuthMessage(authMessageLogin, error.message, 'error');
    } else {
        // La redirección manejará la pantalla, checkAuthStatus se ejecutará al cargar la página de nuevo
    }
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    const email = inputEmailLogin.value.trim();
    const password = inputPasswordLogin.value;

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        displayAuthMessage(authMessageLogin, "Credenciales incorrectas o usuario no encontrado.", 'error');
    } else {
        showScreen('pantalla-inicio');
        // loadInventory() se llamará al ir a pantalla-INVENTARIO desde pantalla-inicio
    }
}

async function handleRegistrationSubmit(event) {
    event.preventDefault();
    const email = regEmail.value.trim();
    const password = regPassword.value;

    const { error } = await supabaseClient.auth.signUp({ email, password });

    if (error) {
        displayAuthMessage(authMessageRegistro, error.message, 'error');
    } else {
        displayAuthMessage(authMessageRegistro, "¡Registro exitoso! Por favor, verifica tu email para confirmar y luego inicia sesión.", 'success');
        setTimeout(() => showScreen('pantalla-login'), 3000); // Dar más tiempo al usuario para leer el mensaje
    }
}

async function handleLogout() {
    const { error } = await supabaseClient.auth.signOut();
    if (!error) {
        inventory = [];
        showScreen('pantalla-login');
        alert("Sesión cerrada correctamente.");
    } else {
        console.error("Error al cerrar sesión:", error);
        alert("Hubo un error al cerrar la sesión.");
    }
}

// --- EVENT LISTENERS (Se mantienen y se agregan los nuevos) ---

if (btnGoogle) btnGoogle.addEventListener("click", handleLoginWithGoogle);
btnIniciarSesionLogin.addEventListener('click', handleLoginSubmit);
registroForm.addEventListener("submit", handleRegistrationSubmit);
btnGuardarProducto.addEventListener("click", handleSaveProduct);
btnLogout.addEventListener("click", handleLogout);

// Eventos de navegación y UI (Tus originales)
btnInventario.addEventListener("click", (e) => { e.preventDefault(); showScreen('pantalla-INVENTARIO'); });
btnRegistrarseLogin.addEventListener("click", () => showScreen('pantalla-registro'));
btnVolverLoginRegistro.addEventListener("click", () => showScreen('pantalla-login'));
if (btnVolverInicio) btnVolverInicio.addEventListener("click", () => showScreen('pantalla-inicio')); // Condicional por si el elemento no existe

// Manejo de imagen y búsqueda (Tus originales se mantienen)
inputProductoImagen.addEventListener("change", handleImageSelection);
btnSeleccionarImagen.addEventListener('click', () => inputProductoImagen.click());

function handleImageSelection(event) {
    const archivo = event.target.files[0];
    if (archivo) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewProductoImagen.src = e.target.result;
            previewProductoImagen.style.display = "block";
            imagenProductoActual = e.target.result; // Data URL
        };
        reader.readAsDataURL(archivo);
    }
}

// Delegación para borrar y editar (Ahora con Supabase)
if (contenedorProductos) { // Asegurarse de que el elemento existe antes de añadir el listener
    contenedorProductos.addEventListener('click', async function(event) {
        const cardDiv = event.target.closest('.tarjeta-producto');
        if (!cardDiv) return; 
        const productId = parseInt(cardDiv.dataset.id);

        if (event.target.classList.contains('btn-borrar-producto')) {
            if (confirm("¿Estás seguro de que quieres eliminar este producto?")) {
                const { error } = await supabaseClient.from('productos').delete().eq('id', productId);
                if (!error) {
                    alert("Producto eliminado.");
                    loadInventory();
                } else {
                    console.error("Error al eliminar producto:", error);
                    alert("Error al eliminar el producto.");
                }
            }
        } else if (event.target.classList.contains('btn-editar-producto')) {
            editProduct(productId);
        }
    });
}

// Funciones de reset y búsqueda (Sin cambios en lógica)
function resetFormAndMode() {
    inputNombreProducto.value = '';
    inputPrecioProducto.value = '';
    inputCantidadProducto.value = '1';
    previewProductoImagen.src = '#'; // Resetear src para evitar imagen rota
    previewProductoImagen.style.display = "none";
    imagenProductoActual = '';
    editingProductId = null;
    btnGuardarProducto.textContent = 'Guardar en la Nube';
}

function editProduct(productId) {
    const productToEdit = inventory.find(p => p.id === productId);
    if (productToEdit) {
        editingProductId = productId; 
        inputNombreProducto.value = productToEdit.nombre;
        inputPrecioProducto.value = productToEdit.precio;
        inputCantidadProducto.value = productToEdit.cantidad;
        previewProductoImagen.src = productToEdit.imagen;
        previewProductoImagen.style.display = 'block';
        imagenProductoActual = productToEdit.imagen; // Mantener la imagen actual para la edición
        btnGuardarProducto.textContent = 'Guardar Cambios';
    }
}

function clearSearch() {
    inputBuscarProducto.value = '';
    renderProducts(); // Mostrar todos los productos al limpiar búsqueda
}

// Nueva función para el botón de búsqueda
btnBuscarProducto.addEventListener('click', () => {
    const searchTerm = inputBuscarProducto.value.trim().toLowerCase();
    const filteredProducts = inventory.filter(product => 
        product.nombre.toLowerCase().includes(searchTerm)
    );
    renderProducts(filteredProducts);
});

// Nueva función para limpiar búsqueda
btnLimpiarBusqueda.addEventListener('click', clearSearch);

// Inicialización
document.addEventListener('DOMContentLoaded', checkAuthStatus);

// Asegúrate de que los campos del formulario de registro se limpien al volver al login
btnVolverLoginRegistro.addEventListener("click", () => {
    regEmail.value = '';
    regPassword.value = '';
    displayAuthMessage(authMessageRegistro, '');
    showScreen('pantalla-login');
});

// Limpiar el formulario de añadir/editar producto
btnLimpiarFormulario.addEventListener('click', resetFormAndMode);