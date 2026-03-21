import React, { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
let MapView, Marker;
if (Platform.OS !== 'web') {
  MapView = require('react-native-maps').default;
  Marker = require('react-native-maps').Marker;
}
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
    Platform.OS !== 'web' ? (
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
    ) : (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
        <Text style={{ color: '#888', fontSize: 16, textAlign: 'center' }}>
          Map is not supported on web.
        </Text>
      </View>
    )
  );
}
