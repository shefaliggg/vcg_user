import React, { useEffect, useState } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { io } from 'socket.io-client';

const socket = io('http://54.174.219.57:5000');

export default function LiveMapScreen({ route }) {
  const { bookingId } = route.params;
  const [location, setLocation] = useState(null);

  useEffect(() => {
    socket.emit('join-booking', bookingId);
    socket.on('location-update', (data) => {
      setLocation(data);
      console.log('Received location update:', data);
      
    });
    return () => socket.disconnect();
  }, []);

  return (
    <MapView style={{ flex: 1 }}>
      {location && (
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
        >
          
          <Text>{location.address}</Text>
        </Marker>
      )}
    </MapView>
  );
}
