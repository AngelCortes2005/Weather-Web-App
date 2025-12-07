// Variables globales
let currentLocation = "";
let weatherData = null;
let favoriteLocations = JSON.parse(localStorage.getItem('favoriteLocations')) || [];

window.onload = function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                currentLocation = await getLocationName(lat, lon);
                getWeather(currentLocation);
            },
            error => {
                console.error("Ubicación no disponible:", error);
                currentLocation = "New York"; // Default location
                getWeather(currentLocation);
            }
        );
    } else {
        console.error("Geolocalización no soportada");
        currentLocation = "New York"; // Default location
        getWeather(currentLocation);
    }

    // Event listeners
    document.getElementById("searchBtn").addEventListener("click", async () => {
        const location = document.getElementById("locationInp").value;
        if (location !== "") {
            currentLocation = location;
            getWeather(currentLocation);
        } else {
            alert("Please enter a location.");
        }
    });

    document.getElementById("refreshBtn").addEventListener("click", () => {
        if (currentLocation) {
            getWeather(currentLocation);
        }
    });

    document.getElementById("locationInp").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const location = document.getElementById("locationInp").value;
            if (location !== "") {
                currentLocation = location;
                getWeather(currentLocation);
            }
        }
    });

    displayFavorites();
};

function addToFavorites(location) {
    if (!favoriteLocations.includes(location)) {
        favoriteLocations.push(location);
        localStorage.setItem('favoriteLocations', JSON.stringify(favoriteLocations));
        displayFavorites();
    }
}

function displayFavorites() {
    const container = document.getElementById('favoritesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    favoriteLocations.forEach(loc => {
        const btn = document.createElement('button');
        btn.className = 'favorite-btn';
        btn.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${loc}`;
        btn.onclick = () => {
            currentLocation = loc;
            getWeather(loc);
        };
        container.appendChild(btn);
    });
}

async function getLocationName(lat, lon) {
    const loader = document.getElementById("containerLoader");
    loader.classList.add('show');
    
    try {
        const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        );
        return response.data.display_name;
    } catch (error) {
        console.error("Error getting location name:", error);
        return `${lat}, ${lon}`;
    } finally {
        loader.classList.remove('show');
    }
}

async function getWeather(location) {
    const loader = document.getElementById("containerLoader");
    const cards = document.querySelectorAll('.card');
    const weatherDataElements = document.querySelectorAll('.weather-data');
    const locationTitle = document.querySelector('.location');
    
    cards.forEach(card => card.classList.add('hidden'));
    weatherDataElements.forEach(el => el.classList.add('hidden'));
    locationTitle.classList.add('hidden');
    loader.classList.add('show');
    
    try {
        const key = "C62FW4862G8P72BN3M2JBPMWG";
        
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        
        const formatDate = (date) => date.toISOString().split('T')[0];
        const currentUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}?unitGroup=metric&key=${key}&contentType=json`;
        const historyUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}/${formatDate(yesterday)}?unitGroup=metric&key=${key}&contentType=json`;
        const [currentResponse, historyResponse] = await Promise.all([
            axios.get(currentUrl),
            axios.get(historyUrl)
        ]);
        
        const weatherData = {
            current: currentResponse.data,
            history: historyResponse.data
        };

        await new Promise(resolve => setTimeout(resolve, 500));
        
        updateCurrentWeather(weatherData.current);
        update24HourForecast(weatherData);
        updateDailyForecast(weatherData.current);
        updateTemperatureChart(weatherData); // Nueva línea para actualizar gráfico
        
    } catch(error) {
        console.error("Error al obtener el clima:", error);
        alert("Error al obtener datos del clima. Intenta con otro nombre de ciudad.");
    } finally {
        setTimeout(() => {
            loader.classList.remove('show');
            locationTitle.classList.remove('hidden');
            
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.remove('hidden');
                }, index * 100);
            });
            
            weatherDataElements.forEach(el => {
                el.classList.remove('hidden');
            });
        }, 300);
    }
}

function updateCurrentWeather(data) {
    const current = data.currentConditions;
    
    document.getElementById("locationName").textContent = data.resolvedAddress;
    
    // Animación de números
    animateValue("temp", 0, Math.round(current.temp), 1000, "°C");
    animateValue("wind", 0, Math.round(current.windspeed), 1000, " km/h");
    animateValue("rainProb", 0, current.precipprob ?? 0, 1000, "%");
    
    document.getElementById("condition").textContent = current.conditions;
    
    // Nuevos datos
    document.getElementById("humidity").textContent = Math.round(current.humidity) + "%";
    document.getElementById("visibility").textContent = Math.round(current.visibility) + " km";
    document.getElementById("pressure").textContent = Math.round(current.pressure) + " mb";
    document.getElementById("uvindex").textContent = current.uvindex ?? 0;
    
    updateThemeByWeather(current.conditions, current.temp);
}

// Nueva función para animar números
function animateValue(id, start, end, duration, suffix = "") {
    const element = document.getElementById(id);
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.round(current) + suffix;
    }, 16);
}

function update24HourForecast(data) {
    const now = new Date(data.current.currentConditions.datetime);
    const currentHour = now.getHours();
    const yesterdayHours = data.history.days[0].hours;
    const todayHours = data.current.days[0].hours;
    const past24Hours = [
        ...yesterdayHours.slice(currentHour), 
        ...todayHours.slice(0, currentHour)   
    ];
    
    let next24Hours = todayHours.slice(currentHour);
    
    if (data.current.days[1] && next24Hours.length < 24) {
        const remainingHours = 24 - next24Hours.length;
        next24Hours = [
            ...next24Hours,
            ...data.current.days[1].hours.slice(0, remainingHours)
        ];
    }
    displayHourlyData('past24Hours', past24Hours);
    displayHourlyData('next24Hours', next24Hours.slice(0, 24)); 
}

function displayHourlyData(containerId, hours) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (!hours || hours.length === 0) {
        container.innerHTML = '<div class="no-data">No data available</div>';
        return;
    }
    
    hours.forEach(hour => {
        const hourItem = document.createElement('div');
        hourItem.className = 'hour-item';
        hourItem.innerHTML = `
            <div class="hour-time">${hour.datetime}</div>
            <div class="hour-icon">${getWeatherIcon(hour.conditions)}</div>
            <div class="hour-temp">${Math.round(hour.temp)}°C</div>
            <div class="hour-wind"><i class="fas fa-wind"></i> ${Math.round(hour.windspeed)} km/h</div>
            <div class="hour-rain"><i class="fas fa-tint"></i> ${hour.precipprob ?? 0}%</div>
        `;
        container.appendChild(hourItem);
    });
}

function getWeatherIcon(conditions) {
    if (!conditions) return "❓";
    
    const condition = conditions.toLowerCase();
    
    if (condition.includes('sun') || condition.includes('clear')) {
        return '<i class="fas fa-sun"></i>';
    } else if (condition.includes('rain')) {
        return '<i class="fas fa-cloud-rain"></i>';
    } else if (condition.includes('snow')) {
        return '<i class="fas fa-snowflake"></i>';
    } else if (condition.includes('cloud') || condition.includes('Partially cloudy')) {
        return '<i class="fa-solid fa-cloud"></i>';
    } else if (condition.includes('fog') || condition.includes('mist')) {
        return '<i class="fas fa-smog"></i>';
    } else if (condition.includes('thunder') || condition.includes('storm')) {
        return '<i class="fas fa-bolt"></i>';
    } else if (condition.includes('wind')) {
        return '<i class="fas fa-wind"></i>';
    } else {
        return conditions;
    }
}

function updateThemeByWeather(conditions, temp) {
    const root = document.documentElement;
    const body = document.body;
    
    const condition = conditions.toLowerCase();
    
    if (condition.includes('clear') || condition.includes('sun')) {
        // Día soleado
        root.style.setProperty('--primary-bg', 'linear-gradient(135deg, #FFB75E 0%, #ED8F03 100%)');
    } else if (condition.includes('rain')) {
        // Lluvioso
        root.style.setProperty('--primary-bg', 'linear-gradient(135deg, #4B79A1 0%, #283E51 100%)');
    } else if (condition.includes('cloud')) {
        // Nublado
        root.style.setProperty('--primary-bg', 'linear-gradient(135deg, #757F9A 0%, #D7DDE8 100%)');
    } else if (condition.includes('snow')) {
        // Nevado
        root.style.setProperty('--primary-bg', 'linear-gradient(135deg, #E0EAFC 0%, #CFDEF3 100%)');
    } else if (condition.includes('storm') || condition.includes('thunder')) {
        // Tormenta
        root.style.setProperty('--primary-bg', 'linear-gradient(135deg, #2C3E50 0%, #000000 100%)');
    }
    
    // Cambiar según temperatura
    if (temp > 30) {
        root.style.setProperty('--accent-color', '#ff6b6b');
    } else if (temp < 10) {
        root.style.setProperty('--accent-color', '#4ecdc4');
    }
}

// Nueva función para actualizar el pronóstico diario
function updateDailyForecast(data) {
    const container = document.getElementById('daysContainer');
    container.innerHTML = '';
    
    const days = data.days.slice(1, 6); // Próximos 5 días
    
    days.forEach(day => {
        const date = new Date(day.datetime);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        dayCard.innerHTML = `
            <div class="day-name">${dayName}</div>
            <div class="day-icon">${getWeatherIcon(day.conditions)}</div>
            <div class="day-temps">
                <span class="temp-max">${Math.round(day.tempmax)}°</span>
                <span class="temp-min">${Math.round(day.tempmin)}°</span>
            </div>
            <div class="day-condition">${day.conditions}</div>
            <div class="day-rain"><i class="fas fa-tint"></i> ${day.precipprob ?? 0}%</div>
        `;
        container.appendChild(dayCard);
    });
}

// Agregar al final

function toggleTheme() {
    const isDark = document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
}

// Al cargar
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
}

// Nueva función para actualizar el gráfico de temperatura
let temperatureChart = null;

function updateTemperatureChart(data) {
    const canvas = document.getElementById('tempChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destruir gráfico anterior si existe
    if (temperatureChart) {
        temperatureChart.destroy();
    }
    
    // Obtener datos de los próximos 5 días
    const days = data.current.days.slice(1, 6);
    const labels = days.map(day => {
        const date = new Date(day.datetime);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    });
    const tempMax = days.map(day => Math.round(day.tempmax));
    const tempMin = days.map(day => Math.round(day.tempmin));
    
    // Crear nuevo gráfico
    temperatureChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Max Temp (°C)',
                data: tempMax,
                borderColor: 'rgba(255, 107, 107, 1)',
                backgroundColor: 'rgba(255, 107, 107, 0.2)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#fff',
                pointBorderColor: 'rgba(255, 107, 107, 1)',
                pointBorderWidth: 2
            }, {
                label: 'Min Temp (°C)',
                data: tempMin,
                borderColor: 'rgba(78, 205, 196, 1)',
                backgroundColor: 'rgba(78, 205, 196, 0.2)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#fff',
                pointBorderColor: 'rgba(78, 205, 196, 1)',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#fff',
                        font: {
                            size: 14,
                            weight: '600'
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + '°C';
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    }
                },
                y: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: {
                            size: 12,
                            weight: '600'
                        },
                        callback: function(value) {
                            return value + '°C';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    min: Math.min(...tempMin) - 5,
                    max: Math.max(...tempMax) + 5
                }
            }
        }
    });
}