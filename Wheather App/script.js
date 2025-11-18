// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add click event listener
    document.getElementById("searchBtn").addEventListener("click", getWeather);
    
    // Add enter key event listener
    document.getElementById("city").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault(); // Prevent form submission
            getWeather();
        }
    });
    
    // Test API connection on load
    testAPIConnection();
});

// Test the API connection
async function testAPIConnection() {
    const apiKey = "56d73456ecb9a7be77e7db0ee7e07d88";
    const testCity = "London";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${testCity}&appid=${apiKey}&units=metric`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error("API Test Failed. Please check your API key.");
            document.getElementById("weatherResult").innerHTML = `<p>Weather service is currently unavailable. Please try again later.</p>`;
        }
    } catch (error) {
        console.error("API Connection Test Error:", error);
    }
}

async function getWeather() {
    const city = document.getElementById("city").value.trim();
    const resultDiv = document.getElementById("weatherResult");
    
    // Input validation
    if (!city) {
        resultDiv.innerHTML = `<p>Please enter a city name.</p>`;
        return;
    }
    
    // Show loading state with a spinner
    resultDiv.innerHTML = `<p>Loading weather data...</p>`;
    
    // THIS WAS MISSING - Define the API key and URL
    const apiKey = "56d73456ecb9a7be77e7db0ee7e07d88";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`City not found (${response.status})`);
        }
        
        const data = await response.json();
        
        // Display weather information
        resultDiv.innerHTML = `
            <h3>${data.name}, ${data.sys.country}</h3>
            <p>🌡 Temperature: ${Math.round(data.main.temp)}°C</p>
            <p>🌤 Weather: ${data.weather[0].description}</p>
            <p>💧 Humidity: ${data.main.humidity}%</p>
            <p>🌬 Wind Speed: ${data.wind.speed} m/s</p>
        `;
    } catch (err) {
        console.error("Error fetching weather:", err);
        resultDiv.textContent = `Error: ${err.message}`;
    }
}
