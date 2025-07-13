    document.getElementById("searchBtn").addEventListener("click", async () => {
        const location = document.getElementById("locationInp").value;
        if (location !== "") {
            getWeather(location);
        } else {
            alert("Please enter a location.");
        }
    }); 

async function getWeather(country){
        const loader = document.getElementById("containerLoader");
        loader.style.display = "flex";
            const key = "C62FW4862G8P72BN3M2JBPMWG"
            const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${country}?key=${key}&contentType=json`;

            const response = await axios.get(url)
            const data = response.data;
            
            //await new Promise(res => setTimeout(res, 2000));
            const locationName = data.resolvedAddress;
            const temp = data.currentConditions.temp;
            const wind = data.currentConditions.windspeed;
            const condition = data.currentConditions.conditions;
            const rainProb = data.currentConditions.precipprob;

            document.getElementById("locationName").textContent = locationName;
            document.getElementById("temp").textContent = temp + "°C";
            document.getElementById("wind").textContent = wind + "km/h";
            document.getElementById("rainProb").textContent = rainProb + "%";
            document.getElementById("condition").textContent = condition;
            loader.style.display = "none";

}



