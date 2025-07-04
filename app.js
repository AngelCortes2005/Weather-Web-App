async function getWeather(country ){
    const key = "C62FW4862G8P72BN3M2JBPMWG"
    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${country}?key=${key}&contentType=json`;

    const response = await axios.get(url)
    const data = response.data;
        
    const locationName = data.resolvedAddress;
    const temp = data.currentConditions.temp;
    const wind = data.currentConditions.windspeed;
    const condition = data.currentConditions.conditions;
    const rainProb = data.currentConditions.precipprob;

    document.getElementById("weatherCurrent").innerHTML = `
    <h2 id="weatherTitle" >Current Weather In ${locationName}</h2>
        <div id="weatherDit">
            <div class="weatherInfo">
                <div class="label">Temperature:</div>
                <div class="value">${temp}°C</div>
            </div>
            <div class="weatherInfo">
                <div class="label">Wind Speed:</div>
                <div class="value">${wind} km/h</div>
            </div>
            <div class="weatherInfo">
                <div class="label">Rain Probability:</div>
                <div class="value">${rainProb}%</div>
            </div>
            <div class="weatherInfo">
                <div class="label">Condition:</div>
                <div class="value">${condition}</div>
            </div>
        </div>
    `;

}


document.getElementById("searchBtn").addEventListener("click", async () => {
    const location = document.getElementById("locationInp").value;
    if (location !== "") {
        getWeather(location);
    } else {
        alert("Please enter a location.");
    }
});
