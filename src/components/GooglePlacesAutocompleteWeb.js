import React, { useRef } from 'react';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';

export default function GooglePlacesAutocompleteWeb({ onPlaceSelected, apiKey }) {
  const autocompleteRef = useRef(null);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey || process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY',
    libraries: ['places'],
  });

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    if (onPlaceSelected && place) {
      onPlaceSelected(place);
    }
  };

  if (!isLoaded) return <div>Loading Google Places...</div>;

  return (
    <Autocomplete
      onLoad={ref => (autocompleteRef.current = ref)}
      onPlaceChanged={handlePlaceChanged}
    >
      <input
        type="text"
        placeholder="Search for a place"
        style={{ width: '100%', height: 40, padding: 8, fontSize: 16 }}
      />
    </Autocomplete>
  );
}
