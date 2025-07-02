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
    <h2>Current Weather In ${locationName}</h2>
    <p>Temperature: ${temp}°C</p>
    <p>Wind Speed: ${wind} km/h</p>
    <p>Rain Probability: ${rainProb}%</p>
    <p>Condition: ${condition}</p>
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
