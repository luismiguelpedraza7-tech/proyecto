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

const contenedorProductos = document.querySelector("#contenedorProductos");
const templateTarjetaProducto = document.querySelector("#template-tarjeta-producto");

const btnVolverInicio = document.querySelector("#btnVolverInicio");

// --- Nuevas referencias para la funcionalidad de búsqueda ---
const inputBuscarProducto = document.querySelector("#inputBuscarProducto");
const btnBuscarProducto = document.querySelector("#btnBuscarProducto");
const btnLimpiarBusqueda = document.querySelector("#btnLimpiarBusqueda");

// --- NUEVA REFERENCIA: Contador de productos ---
const totalProductosCountElement = document.querySelector("#totalProductosCount");

// --- NUEVA REFERENCIA: Botón de exportar datos ---
const btnExportarDatos = document.querySelector("#btnExportarDatos");

// --- Referencia para el botón de cerrar sesión en pantalla de inicio ---
const btnLogout = document.querySelector("#btnLogout");

// Variable para almacenar temporalmente la URL de la imagen seleccionada
let imagenProductoActual = '';

// Array para almacenar todos los productos y su estado
let inventory = [];

// Array para almacenar todos los usuarios registrados
let users = [];

// --- NUEVA VARIABLE DE ESTADO: Para saber si estamos editando o añadiendo ---
let editingProductId = null; // null cuando se añade, el ID del producto cuando se edita

// --- NUEVA VARIABLE DE ESTADO: Para el usuario logueado ---
let currentLoggedInUserEmail = null; // Almacena el email del usuario logueado

// --- Funciones para manejar LocalStorage ---
/**
 * Guarda el array 'inventory' actual en localStorage.
 */
function saveInventory() {
    localStorage.setItem('inventory', JSON.stringify(inventory));
    updateProductCount(); // Actualizar el contador cada vez que se guarda el inventario
}

/**
 * Carga el array 'inventory' desde localStorage y lo inicializa.
 * Luego, renderiza los productos en la interfaz.
 */
function loadInventory() {
    const storedInventory = localStorage.getItem('inventory');
    if (storedInventory) {
        inventory = JSON.parse(storedInventory);
        renderProducts(); // Renderizar productos al cargar del almacenamiento
    }
    updateProductCount(); // Actualizar el contador después de cargar el inventario
}

/**
 * Guarda el array 'users' actual en localStorage.
 */
function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

/**
 * Carga el array 'users' desde localStorage.
 */
function loadUsers() {
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
        users = JSON.parse(storedUsers);
    }
}

// --- Función para mostrar mensajes de autenticación ---
/**
 * Muestra un mensaje en el elemento de mensaje de autenticación.
 * @param {HTMLElement} element - El elemento donde se mostrará el mensaje (ej. authMessageLogin).
 * @param {string} message - El texto del mensaje.
 * @param {"success" | "error" | ""} type - El tipo de mensaje para aplicar estilos.
 */
function displayAuthMessage(element, message, type = '') {
    element.textContent = message;
    element.className = 'auth-message'; // Resetear clases
    if (type) {
        element.classList.add(type);
    }
    element.style.display = message ? 'block' : 'none';
}

// --- Función centralizada para mostrar pantallas ---
/**
 * Muestra la pantalla especificada y oculta las demás.
 * @param {string} screenId - El ID de la pantalla a mostrar (ej. 'pantalla-login', 'pantalla-inicio', 'pantalla-INVENTARIO', 'pantalla-registro').
 */
function showScreen(screenId) {
    pantallaLogin.style.display = 'none';
    pantallaRegistro.style.display = 'none';
    pantallaInicio.style.display = 'none';
    pantallaInventario.style.display = 'none';

    switch (screenId) {
        case 'pantalla-login':
            pantallaLogin.style.display = 'flex'; // Usar flex para centrar contenido
            displayAuthMessage(authMessageLogin, ''); // Limpiar mensaje al cambiar
            inputEmailLogin.value = '';
            inputPasswordLogin.value = '';
            break;
        case 'pantalla-registro':
            pantallaRegistro.style.display = 'flex'; // Usar flex para centrar contenido
            displayAuthMessage(authMessageRegistro, ''); // Limpiar mensaje al cambiar
            regEmail.value = '';
            regPassword.value = '';
            break;
        case 'pantalla-inicio':
            pantallaInicio.style.display = 'block';
            clearSearch(); // Limpiar búsqueda y resetear formulario si se vuelve al inicio desde inventario
            resetFormAndMode();
            break;
        case 'pantalla-INVENTARIO':
            pantallaInventario.style.display = 'block';
            resetFormAndMode(); // Asegurarse de que el formulario de inventario esté limpio
            break;
    }
}

// --- Función para verificar el estado de autenticación al cargar la página ---
function checkAuthStatus() {
    const storedUserEmail = localStorage.getItem('currentLoggedInUserEmail');
    if (storedUserEmail) {
        currentLoggedInUserEmail = storedUserEmail;
        showScreen('pantalla-inicio');
        loadInventory(); // Cargar inventario solo si el usuario está logueado
    } else {
        currentLoggedInUserEmail = null;
        showScreen('pantalla-login');
    }
}

// --- Funciones de Renderizado ---
/**
 * Limpia el contenedor de productos y vuelve a renderizar todas las tarjetas
 * basándose en el array 'inventory' o un array 'productsToRender' si se proporciona.
 * @param {Array<Object>} [productsToRender=inventory] - Array de productos a renderizar.
 */
function renderProducts(productsToRender = inventory) {
    contenedorProductos.innerHTML = ''; // Limpiar el contenedor antes de renderizar

    if (productsToRender.length === 0 && inputBuscarProducto.value.trim() !== '') {
        contenedorProductos.innerHTML = '<p style="text-align: center; width: 100%; margin-top: 20px; font-size: 1.2em; color: #555;">No se encontraron productos que coincidan con la búsqueda.</p>';
        return;
    } else if (productsToRender.length === 0 && inventory.length === 0) {
        contenedorProductos.innerHTML = '<p style="text-align: center; width: 100%; margin-top: 20px; font-size: 1.2em; color: #555;">El inventario está vacío. ¡Añade algunos productos!</p>';
        return;
    }

    productsToRender.forEach(product => {
        const nuevaTarjeta = templateTarjetaProducto.content.cloneNode(true);
        const cardDiv = nuevaTarjeta.querySelector(".tarjeta-producto");
        cardDiv.dataset.id = product.id;

        nuevaTarjeta.querySelector(".producto-imagen").src = product.imagen;
        nuevaTarjeta.querySelector(".producto-imagen").alt = `Imagen de ${product.nombre}`;
        nuevaTarjeta.querySelector(".producto-nombre").textContent = product.nombre;
        nuevaTarjeta.querySelector(".producto-precio").textContent = `$${product.precio}`;
        nuevaTarjeta.querySelector(".producto-cantidad").textContent = `Unidades disponibles: ${product.cantidad}`;

        contenedorProductos.appendChild(nuevaTarjeta);
    });
}

// --- NUEVA FUNCIÓN: Actualiza el contador de productos ---
/**
 * Actualiza el contador de productos registrados en la interfaz.
 */
function updateProductCount() {
    totalProductosCountElement.textContent = inventory.length;
}

// --- Lógica de UI y Event Listeners ---
btnInventario.addEventListener("click", function(e) {
  e.preventDefault();
  showScreen('pantalla-INVENTARIO');
});

// Event listener para ir a la pantalla de registro desde el login
btnRegistrarseLogin.addEventListener("click", function() {
    showScreen('pantalla-registro');
});

// Event listener para el botón de Volver al Login desde Registro
btnVolverLoginRegistro.addEventListener("click", function() {
    showScreen('pantalla-login');
});

// Event listener para el botón de Volver al Inicio desde Inventario
btnVolverInicio.addEventListener("click", function() {
  showScreen('pantalla-inicio');
});

// Event listener para el botón de Cerrar Sesión
btnLogout.addEventListener("click", handleLogout);

/**
 * Maneja la selección de archivos de imagen y muestra una vista previa.
 */
function handleImageSelection(event) {
  const archivo = event.target.files[0];

  if (archivo) {
    const reader = new FileReader();
    reader.onload = function(e) {
      previewProductoImagen.src = e.target.result;
      previewProductoImagen.style.display = "block";
      imagenProductoActual = e.target.result;
    };
    reader.readAsDataURL(archivo); // Lee el archivo como una URL Base64
  } else {
    clearImagePreview();
  }
}

/**
 * Limpia la vista previa de la imagen y resetea el input de archivo.
 *
 */
function clearImagePreview() {
    previewProductoImagen.src = "";
    previewProductoImagen.style.display = "none";
    imagenProductoActual = '';
    inputProductoImagen.value = ''; // Resetear el input file para poder seleccionar el mismo archivo de nuevo
}

inputProductoImagen.addEventListener("change", handleImageSelection);

btnSeleccionarImagen.addEventListener('click', () => {
  inputProductoImagen.click(); // Esto "hace clic" en el input de tipo file oculto
});

// --- Lógica de Formulario (Añadir/Editar) ---

/**
 * Resetea el formulario y el estado de edición/añadido.
 * Vuelve el botón a "Añadir Producto" y "Limpiar".
 */
function resetFormAndMode() {
    inputNombreProducto.value = '';
    inputPrecioProducto.value = '';
    inputCantidadProducto.value = '1';
    clearImagePreview();
    editingProductId = null;
    btnGuardarProducto.textContent = 'Añadir Producto';
    btnLimpiarFormulario.textContent = 'Limpiar';
}

/**
 * Maneja tanto la adición de un nuevo producto como la actualización de uno existente.
 */
function handleSaveProduct() {
  const nombre = inputNombreProducto.value.trim();
  const precio = parseFloat(inputPrecioProducto.value);
  const cantidad = parseInt(inputCantidadProducto.value);

  // Validación básica de los inputs
  if (!nombre) {
    alert("Por favor, ingresa el nombre del producto.");
    return;
  }
  if (isNaN(precio) || precio <= 0) {
    alert("Por favor, ingresa un precio válido para el producto (mayor que 0).");
    return;
  }
  if (!imagenProductoActual) {
      alert("Por favor, selecciona una imagen para el producto.");
      return;
  }
  if (isNaN(cantidad) || cantidad <= 0 || !Number.isInteger(cantidad)) {
      alert("Por favor, ingresa una cantidad válida para el producto (número entero mayor que 0).");
      return;
  }

  if (editingProductId !== null) {
      // Estamos en modo edición: Actualizar un producto existente
      const productIndex = inventory.findIndex(p => p.id === editingProductId);
      if (productIndex !== -1) {
          inventory[productIndex] = {
              ...inventory[productIndex], // Mantener propiedades existentes (como id)
              nombre: nombre,
              precio: precio,
              imagen: imagenProductoActual,
              cantidad: cantidad
          };
          alert(`¡Producto "${nombre}" actualizado!`);
      }
  } else {
      // Estamos en modo añadir: Crear un nuevo producto
      const nuevoProducto = {
          id: Date.now(), // Genera un ID único basado en la marca de tiempo actual
          nombre: nombre,
          precio: precio,
          imagen: imagenProductoActual,
          cantidad: cantidad
      };
      inventory.push(nuevoProducto);
      alert(`¡Producto "${nombre}" (Cantidad: ${cantidad}) añadido al inventario!`);
  }

  saveInventory();
  // Re-renderizar productos, respetando el estado de búsqueda actual
  if (inputBuscarProducto.value.trim() !== '') {
      searchProducts();
  } else {
      renderProducts();
  }
  resetFormAndMode(); // Resetear el formulario y el modo después de guardar o actualizar
}

/**
 * Función que carga los datos de un producto en el formulario para su edición.
 * @param {number} productId - El ID del producto a editar.
 */
function editProduct(productId) {
    const productToEdit = inventory.find(p => p.id === productId);
    if (productToEdit) {
        editingProductId = productId; // Establecer el ID del producto que se está editando

        // Rellenar el formulario con los datos del producto
        inputNombreProducto.value = productToEdit.nombre;
        inputPrecioProducto.value = productToEdit.precio;
        inputCantidadProducto.value = productToEdit.cantidad;
        previewProductoImagen.src = productToEdit.imagen;
        previewProductoImagen.style.display = 'block';
        imagenProductoActual = productToEdit.imagen;

        // Cambiar el texto de los botones para reflejar el modo edición
        btnGuardarProducto.textContent = 'Guardar Cambios';
        btnLimpiarFormulario.textContent = 'Cancelar Edición';

        // Opcional: Desplazarse al formulario para mejor UX
        pantallaInventario.querySelector('.formulario-producto-nuevo').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// El botón "Limpiar" ahora también sirve como "Cancelar Edición" o limpiar el formulario normalmente.
btnLimpiarFormulario.addEventListener('click', function() {
    if (editingProductId !== null) {
        alert("Edición cancelada.");
    } else { // Solo si no estamos editando, limpiar el input de búsqueda también
        clearSearch();
    }
    resetFormAndMode(); // Siempre limpia el formulario y resetea el modo
});

btnGuardarProducto.addEventListener("click", handleSaveProduct); // Asigna el nuevo manejador unificado

// --- Lógica de Búsqueda ---
/**
 * Normaliza una cadena de texto para la búsqueda:
 * - Convierte a minúsculas.
 * - Elimina tildes y diacríticos.
 * - Elimina caracteres especiales (no alfanuméricos).
 * @param {string} text - La cadena a normalizar.
 * @returns {string} La cadena normalizada.
 */
function normalizeStringForSearch(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "") // Elimina diacríticos (tildes, etc.)
        .replace(/[^a-z0-9]/g, ''); // Elimina caracteres no alfanuméricos
}

/**
 * Realiza una búsqueda de productos por nombre en el inventario actual.
 * Renderiza solo los productos que coinciden con el término de búsqueda.
 */
function searchProducts() {
    const searchTerm = normalizeStringForSearch(inputBuscarProducto.value.trim());

    // Si el término de búsqueda normalizado está vacío, mostrar todos los productos
    if (searchTerm === '') {
        renderProducts(inventory);
        return;
    }

    // Filtrar el inventario basándose en el término de búsqueda normalizado
    const filteredProducts = inventory.filter(product =>
        normalizeStringForSearch(product.nombre).includes(searchTerm)
    );

    renderProducts(filteredProducts); // Renderizar solo los productos filtrados
}

/**
 * Limpia el campo de búsqueda y vuelve a mostrar todo el inventario.
 */
function clearSearch() {
    inputBuscarProducto.value = '';
    renderProducts(inventory); // Renderizar todos los productos
}

// --- Event Listeners para la Búsqueda ---
btnBuscarProducto.addEventListener("click", searchProducts);
btnLimpiarBusqueda.addEventListener("click", clearSearch);
// Opcional: para búsqueda en tiempo real mientras se escribe
inputBuscarProducto.addEventListener("input", searchProducts);

// Añadir funcionalidad para buscar al presionar 'Enter' en el campo de búsqueda
inputBuscarProducto.addEventListener("keydown", function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Evita cualquier comportamiento predeterminado, como la posible sumisión de un formulario.
        searchProducts();
    }
});


// --- Event delegation para borrar y editar productos dinámicamente ---
contenedorProductos.addEventListener('click', function(event) {
    const cardDiv = event.target.closest('.tarjeta-producto');
    if (!cardDiv) return; // No es un clic en una tarjeta de producto

    const productId = parseInt(cardDiv.dataset.id);

    if (event.target.classList.contains('btn-borrar-producto')) {
        inventory = inventory.filter(product => product.id !== productId);
        saveInventory();
        // Si el producto borrado era el que se estaba editando, cancela el modo edición
        if (productId === editingProductId) {
            resetFormAndMode();
        }
        // Re-renderizar, considerando si una búsqueda está activa
        if (inputBuscarProducto.value.trim() !== '') {
            searchProducts(); // Re-renderizar la lista filtrada
        } else {
            renderProducts(); // Re-renderizar el inventario completo
        }
        alert("Producto eliminado.");
    } else if (event.target.classList.contains('btn-editar-producto')) {
        editProduct(productId);
    }
});

// --- NUEVA FUNCIÓN: Exportar inventario a CSV ---
/**
 * Exporta los datos del inventario a un archivo CSV.
 * Incluye nombre, precio unitario, cantidad, valor total por producto y el valor total del inventario.
 */
function exportInventoryToCSV() {
    if (inventory.length === 0) {
        alert("El inventario está vacío. No hay datos para exportar.");
        return;
    }

    let csvContent = "Nombre Producto,Precio Unitario,Cantidad,Valor Total Producto\n";
    let totalInventoryValue = 0;

    inventory.forEach(product => {
        const productTotal = product.precio * product.cantidad;
        totalInventoryValue += productTotal;

        // Escapar comas y comillas dobles en el nombre del producto para CSV
        // Si el nombre contiene comas o comillas dobles, se envuelve en comillas dobles
        // y las comillas dobles internas se duplican.
        const escapedProductName = `"${product.nombre.replace(/"/g, '""')}"`;

        csvContent += `${escapedProductName},${product.precio.toFixed(2)},${product.cantidad},${productTotal.toFixed(2)}\n`;
    });

    csvContent += `\nVALOR TOTAL INVENTARIO,,,${totalInventoryValue.toFixed(2)}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'inventario.csv';

    document.body.appendChild(link); // Necesario para Firefox
    link.click();
    document.body.removeChild(link); // Limpiar el DOM
    URL.revokeObjectURL(link.href); // Liberar el recurso
    alert("¡Inventario exportado exitosamente a inventario.csv!");
}

// --- Event Listener para el botón de exportar ---
btnExportarDatos.addEventListener("click", exportInventoryToCSV);

// --- Lógica de Registro de Usuario ---
/**
 * Maneja la sumisión del formulario de registro.
 * @param {Event} event - El evento de sumisión del formulario.
 */
function handleRegistrationSubmit(event) {
    event.preventDefault(); // Evitar que el formulario recargue la página

    const email = regEmail.value.trim();
    const password = regPassword.value;

    displayAuthMessage(authMessageRegistro, ''); // Limpiar mensaje previo

    if (!email || !password) {
        displayAuthMessage(authMessageRegistro, "Por favor, completa todos los campos.", 'error');
        return;
    }

    if (password.length < 6) {
        displayAuthMessage(authMessageRegistro, "La contraseña debe tener al menos 6 caracteres.", 'error');
        return;
    }

    // Validación básica de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex mejorado para email
    if (!emailRegex.test(email)) {
        displayAuthMessage(authMessageRegistro, "Por favor, ingresa un formato de email válido.", 'error');
        return;
    }

    // Verificar si el email ya está registrado
    if (users.some(user => user.email === email)) {
        displayAuthMessage(authMessageRegistro, "Este email ya está registrado. Por favor, usa otro o inicia sesión.", 'error');
        return;
    }

    // ¡ADVERTENCIA DE SEGURIDAD!: Almacenar contraseñas en texto plano en localStorage NO es seguro
    // Para una aplicación real, se debería usar un backend con hashing de contraseñas.
    const newUser = {
        email: email,
        password: password
    };

    users.push(newUser);
    saveUsers();
    displayAuthMessage(authMessageRegistro, "¡Registro exitoso! Ya puedes iniciar sesión.", 'success');

    // Limpiar campos y redirigir al login
    regEmail.value = '';
    regPassword.value = '';
    // Pequeño delay para que el usuario vea el mensaje de éxito antes de redirigir
    setTimeout(() => showScreen('pantalla-login'), 1500);
}

// Asignar el event listener al formulario de registro
registroForm.addEventListener("submit", handleRegistrationSubmit);

// --- Lógica de Inicio de Sesión ---
/**
 * Maneja el inicio de sesión del usuario.
 * @param {Event} event - El evento de click del botón.
 */
function handleLoginSubmit(event) {
    event.preventDefault(); // Prevenir cualquier comportamiento por defecto si se adjunta a un form

    const email = inputEmailLogin.value.trim();
    const password = inputPasswordLogin.value;

    displayAuthMessage(authMessageLogin, ''); // Limpiar mensaje previo

    if (!email || !password) {
        displayAuthMessage(authMessageLogin, "Por favor, ingresa tu email y contraseña.", 'error');
        return;
    }

    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        currentLoggedInUserEmail = user.email;
        localStorage.setItem('currentLoggedInUserEmail', user.email);
        displayAuthMessage(authMessageLogin, `Bienvenido, ${user.email}!`, 'success');
        // Redirigir a la pantalla de inicio después de un breve momento
        setTimeout(() => showScreen('pantalla-inicio'), 1000);
        loadInventory(); // Cargar inventario tras iniciar sesión con éxito
    } else {
        displayAuthMessage(authMessageLogin, "Credenciales incorrectas. Inténtalo de nuevo.", 'error');
    }
}

btnIniciarSesionLogin.addEventListener('click', handleLoginSubmit);

// --- Lógica de Cierre de Sesión ---
/**
 * Maneja el cierre de sesión del usuario.
 */
function handleLogout() {
    currentLoggedInUserEmail = null;
    localStorage.removeItem('currentLoggedInUserEmail');
    showScreen('pantalla-login');
    alert("Has cerrado sesión.");
}

// Cargar usuarios y verificar estado de autenticación al iniciar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    checkAuthStatus();
});
