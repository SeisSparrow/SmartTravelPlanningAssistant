// Trip Planning Form
document.getElementById('tripForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        destination: formData.get('destination'),
        origin: formData.get('origin'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        budget: parseInt(formData.get('budget')) || undefined,
        travelers: parseInt(formData.get('travelers')) || 1,
        preferences: formData.get('preferences') ? formData.get('preferences').split(',').map(p => p.trim()) : []
    };

    try {
        const response = await fetch('/api/plan-trip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        displayTripResults(result);
    } catch (error) {
        alert('Error planning trip: ' + error.message);
    }
});

// Destination Comparison Form
document.getElementById('compareForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        destinations: formData.get('destinations').split(',').map(d => d.trim()),
        criteria: formData.get('criteria') ? formData.get('criteria').split(',').map(c => c.trim()) : []
    };

    try {
        const response = await fetch('/api/compare-destinations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        displayComparisonResults(result);
    } catch (error) {
        alert('Error comparing destinations: ' + error.message);
    }
});

function displayTripResults(result) {
    const resultsDiv = document.getElementById('tripResults');
    resultsDiv.innerHTML = `
        <h3>Trip Plan for ${result.destination}</h3>
        <p><strong>Total Cost:</strong> $${result.totalCost} ${result.currency}</p>
        <p><strong>Language:</strong> ${result.language}</p>
        <p><strong>Safety Rating:</strong> ${result.safetyRating}/5</p>
        
        <h4>Weather Forecast</h4>
        <p>Current: ${result.weather.current.temp}°C, ${result.weather.current.conditions}</p>
        
        <h4>Flights</h4>
        ${result.flights.map(flight => `
            <div>
                <strong>${flight.airline} ${flight.flightNumber}</strong><br>
                Duration: ${flight.duration}<br>
                Price: $${flight.price}
            </div>
        `).join('')}
        
        <h4>Hotels</h4>
        ${result.hotels.map(hotel => `
            <div>
                <strong>${hotel.name}</strong> (${hotel.rating}/5)<br>
                $${hotel.pricePerNight}/night - Total: $${hotel.totalPrice}<br>
                Amenities: ${hotel.amenities.join(', ')}
            </div>
        `).join('')}
        
        <h4>Activities</h4>
        ${result.activities.map(activity => `
            <div>
                <strong>${activity.name}</strong> (${activity.type})<br>
                ${activity.duration} - $${activity.price}<br>
                Rating: ${activity.rating}/5
            </div>
        `).join('')}
    `;
    resultsDiv.style.display = 'block';
}

function displayComparisonResults(results) {
    const resultsDiv = document.getElementById('comparisonResults');
    resultsDiv.innerHTML = `
        <h3>Destination Comparison</h3>
        <div class="comparison-grid">
            ${results.map(dest => `
                <div class="destination-card">
                    <h4>${dest.destination}</h4>
                    <div class="score">${dest.overallScore}/100</div>
                    <p><strong>Weather:</strong> ${dest.weather.temp}°C, ${dest.weather.conditions}</p>
                    <p><strong>Hotel Cost:</strong> $${dest.averageHotelCost}/night</p>
                    <p><strong>Safety:</strong> ${dest.safetyRating.toFixed(1)}/5</p>
                    <p><strong>Activities:</strong> ${dest.activityScore} available</p>
                </div>
            `).join('')}
        </div>
    `;
    resultsDiv.style.display = 'block';
}
