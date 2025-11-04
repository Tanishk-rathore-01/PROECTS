// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("searchBtn").addEventListener("click", getWeather);
    
    document.getElementById("city").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            getWeather();
        }
    });
});

// Function to get weather icon based on condition
function getWeatherIcon(weatherMain) {
    const icons = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Drizzle': '🌦️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️',
        'Smoke': '💨',
        'Haze': '🌫️',
        'Dust': '💨',
        'Fog': '🌫️',
        'Sand': '💨',
        'Ash': '🌋',
        'Squall': '💨',
        'Tornado': '🌪️'
    };
    return icons[weatherMain] || '🌤️';
}

// Function to change background based on weather
function changeBackground(weatherMain) {
    document.body.className = '';
    
    if (weatherMain === 'Clear') {
        document.body.classList.add('clear');
    } else if (weatherMain === 'Clouds') {
        document.body.classList.add('cloudy');
    } else if (weatherMain === 'Rain' || weatherMain === 'Drizzle' || weatherMain === 'Thunderstorm') {
        document.body.classList.add('rainy');
    } else {
        document.body.classList.add('sunny');
    }
}

async function getWeather() {
    const city = document.getElementById("city").value.trim();
    const resultDiv = document.getElementById("weatherResult");
    
    if (!city) {
        resultDiv.innerHTML = `<p class="error-message">⚠️ Please enter a city name!</p>`;
        return;
    }
    
    // Show loading spinner
    resultDiv.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Fetching weather data...</p>
        </div>
    `;
    
    const apiKey = "56d73456ecb9a7be77e7db0ee7e07d88";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`City not found! Please check the spelling.`);
        }
        
        const data = await response.json();
        const weatherIcon = getWeatherIcon(data.weather[0].main);
        
        // Change background based on weather
        changeBackground(data.weather[0].main);
        
        // Display weather information with animations
        resultDiv.innerHTML = `
            <div class="weather-card">
                <div class="weather-icon">${weatherIcon}</div>
                <h2 class="city-name">${data.name}, ${data.sys.country}</h2>
                <div class="temperature">${Math.round(data.main.temp)}°C</div>
                <p class="description">${data.weather[0].description}</p>
                
                <div class="weather-details">
                    <div class="detail-item">
                        <div class="detail-label">Feels Like</div>
                        <div class="detail-value">${Math.round(data.main.feels_like)}°C</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Humidity</div>
                        <div class="detail-value">${data.main.humidity}%</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Wind Speed</div>
                        <div class="detail-value">${data.wind.speed} m/s</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Pressure</div>
                        <div class="detail-value">${data.main.pressure} hPa</div>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        console.error("Error fetching weather:", err);
        resultDiv.innerHTML = `<p class="error-message">❌ ${err.message}</p>`;
    }
}
