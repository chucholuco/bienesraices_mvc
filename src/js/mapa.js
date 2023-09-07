(function() {
    const lat = 19.413359;
    const lng = -99.154803;
    const mapa = L.map('mapa').setView([lat, lng ], 15);
    

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapa);


})()
