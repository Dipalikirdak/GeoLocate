// Initialize variables
let map, marker;

// DOM elements
const ipInput = document.getElementById('ipInput');
const searchBtn = document.getElementById('searchBtn');
const ipAddress = document.getElementById('ipAddress');
const locationEl = document.getElementById('location');
const timezone = document.getElementById('timezone');
const isp = document.getElementById('isp');
const mapLocation = document.getElementById('mapLocation');
const ipSamples = document.querySelectorAll('.ip-sample');
var form = document.getElementById("my-form");

// Initialize the map
function initMap(lat = 34.0522, lng = -118.2437, zoom = 10) {
    if (map) {
        map.remove();
    }

    map = L.map('map').setView([lat, lng], zoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
    }).addTo(map);

    // Create custom marker icon
    const customIcon = L.divIcon({
        className: 'map-marker-icon',
        html: '<i class="fas fa-location-dot"></i>',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    });

    // Add initial marker
    marker = L.marker([lat, lng], { icon: customIcon })
        .addTo(map)
        .bindPopup('Search an IP to see location')
        .openPopup();

    // Set initial location text
    mapLocation.textContent = "Search an IP to see location";
}

// Update map with new location
function updateMap(lat, lng, city, country, ip) {
    const customIcon = L.divIcon({
        className: 'map-marker-icon',
        html: '<i class="fas fa-location-dot"></i>',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    });

    if (marker) {
        map.removeLayer(marker);
    }

    marker = L.marker([lat, lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`<div class="font-medium"><i class="fas fa-map-marker-alt text-primary mr-1"></i> ${city}, ${country}</div><div class="text-xs mt-1">IP: ${ip}</div>`)
        .openPopup();

    map.setView([lat, lng], 13);
    mapLocation.textContent = `${city}, ${country}`;
}

// Get user's current IP using ipify
async function getCurrentIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error fetching IP:', error);
        throw new Error('Failed to retrieve your IP address');
    }
}

// Fetch IP data from ipapi.co
async function fetchIPData(ip) {
    try {
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Searching';
        searchBtn.disabled = true;

        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.reason || 'Invalid IP address');
        }

        if (!data.latitude || !data.longitude) {
            throw new Error('No location data available for this IP');
        }

        return data;
    } catch (error) {
        throw error;
    } finally {
        searchBtn.innerHTML = '<i class="fas fa-search mr-2"></i> Search';
        searchBtn.disabled = false;
    }
}

// Update UI with IP info
function updateUI(data) {
    [ipAddress, locationEl, timezone, isp].forEach(el => {
        el.classList.remove('skeleton');
        el.classList.add('fade-in');
    });

    ipAddress.textContent = data.ip || 'N/A';
    locationEl.textContent = `${data.city || 'Unknown'}, ${data.country_name || 'N/A'}`;
    timezone.textContent = data.timezone || 'N/A';
    isp.textContent = data.org || 'Unknown';

    if (data.latitude && data.longitude) {
        updateMap(data.latitude, data.longitude, data.city, data.country_name, data.ip);
    }
}

// Show error in UI
function showError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'fixed top-4 right-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center max-w-md fade-in';
    errorEl.innerHTML = `
        <i class="fas fa-exclamation-circle mr-3 text-red-500"></i>
        <div>
            <strong class="font-bold">Error!</strong>
            <span class="block sm:inline">${message}</span>
        </div>
        <button class="ml-4 text-red-500 hover:text-red-700">
            <i class="fas fa-times"></i>
        </button>`;

    const closeBtn = errorEl.querySelector('button');
    closeBtn.addEventListener('click', () => { errorEl.remove(); });

    document.body.appendChild(errorEl);

    setTimeout(() => { errorEl.remove(); }, 5000);
}

// Handle search
async function handleSearch() {
    const ip = ipInput.value.trim();

    if (!ip) {
        try {
            const currentIP = await getCurrentIP();
            const data = await fetchIPData(currentIP);
            updateUI(data);
            ipInput.value = data.ip;
        } catch (error) {
            showError(error.message);
        }
        return;
    }

    try {
        const data = await fetchIPData(ip);
        updateUI(data);
    } catch (error) {
        showError(error.message);
    }
}

// Form submission handling
async function handleSubmit(event) {
    event.preventDefault();
    var status = document.getElementById("my-form-status");
    var button = document.getElementById("my-form-button");
    var originalText = button.innerHTML;

    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';
    button.disabled = true;

    var data = new FormData(event.target);
    fetch(event.target.action, {
        method: form.method,
        body: data,
        headers: { 'Accept': 'application/json' }
    }).then(response => {
        if (response.ok) {
            status.innerHTML = "Thanks for your submission!";
            status.classList.add('text-green-600');
            form.reset();
        } else {
            response.json().then(data => {
                if (Object.hasOwn(data, 'errors')) {
                    status.innerHTML = data["errors"].map(error => error["message"]).join(", ");
                    status.classList.add('text-red-600');
                } else {
                    status.innerHTML = "Oops! There was a problem submitting your form";
                    status.classList.add('text-red-600');
                }
            });
        }
    }).catch(error => {
        status.innerHTML = "Oops! There was a problem submitting your form";
        status.classList.add('text-red-600');
    }).finally(() => {
        button.innerHTML = originalText;
        button.disabled = false;
    });
}

// Event listeners
searchBtn.addEventListener('click', handleSearch);
ipInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') handleSearch();
});
form.addEventListener("submit", handleSubmit);

// Sample IP buttons
ipSamples.forEach(button => {
    button.addEventListener('click', () => {
        ipInput.value = button.textContent;
        handleSearch();
    });
});

// Initialize map with default location
initMap();

// On page load, set focus on input
window.addEventListener('DOMContentLoaded', () => {
    ipInput.focus();
}); 