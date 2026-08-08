function startLiveTracking(socket, routeCoords, tripPhase) {
    let currentIndex = 0;

    const driveInterval = setInterval(() => {
        // Stop moving when we reach the end of the array
        if (currentIndex >= routeCoords.length) {
            clearInterval(driveInterval);
            socket.emit('location_update', { 
                status: 'Arrived', 
                phase: tripPhase 
            });
            return;
        }

        // Emit the live GPS coordinate to the frontend
        socket.emit('location_update', {
            status: 'Moving',
            phase: tripPhase,
            currentLocation: routeCoords[currentIndex] 
        });

        currentIndex++;
    }, 2000); // Move the car every 2 seconds for a smooth and best use-case
}

module.exports = { startLiveTracking };