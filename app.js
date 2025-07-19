// Variables globales
let currentLocation = "";
let weatherData = null;

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
};

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
    document.getElementById("temp").textContent = `${Math.round(current.temp)}°C`;
    document.getElementById("wind").textContent = `${Math.round(current.windspeed)} km/h`;
    document.getElementById("rainProb").textContent = `${current.precipprob ?? 0}%`;
    document.getElementById("condition").textContent = current.conditions;
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