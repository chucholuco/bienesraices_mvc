const esVendedor = (usuarioId, propiedadUsuarioId) => {
    return usuarioId === propiedadUsuarioId
}

const formatearFecha = fecha => {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setUTCHours(12, 0, 0, 0);  // Set time to 12:00:00.000 UTC
    
    const opciones = {
        weekday: 'long',  // typo fixed here ('weeday' changed to 'weekday')
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    
    return nuevaFecha.toLocaleDateString('es-MX', opciones);
};

export {
    esVendedor,
    formatearFecha
}