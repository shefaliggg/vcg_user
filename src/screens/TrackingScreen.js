
import React, { useState, useEffect, useRef } from "react";
import { Feather, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { io } from "socket.io-client";
import { Platform } from 'react-native';
import { MapView, Marker, Polyline } from "../shims/react-native-maps";
import polyline from '@mapbox/polyline';
import { GOOGLE_MAPS_API_KEY } from "../utils/googleMaps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ORIGIN } from "../config/api.config";
const socket = io(API_ORIGIN);
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from "react-native";
import tripService from "../services/trip.service";
import ratingService from "../services/rating.service";
import { SafeAreaView } from "react-native-safe-area-context";
import AppText from "../components/AppText";
import { colors } from "../themes/colors";
import { spacing } from "../themes/spacing";
import { radius } from "../themes/radius";
import { shadows } from "../themes/shadows";
export default function TrackingScreen({ route, navigation }) {
  const { bookingId } = route.params || {};
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);
  const markerRef = useRef(null);
  const mapRef = useRef(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [eta, setEta] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [distanceRemaining, setDistanceRemaining] = useState(null);

  useEffect(() => {
    if (!bookingId) return;

    console.log("📍 Tracking screen mounted");

    // 🔥 ADD THESE FIRST
    socket.on("connect", () => {
      console.log("✅ Socket Connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket Disconnected");
    });

    socket.on("connect_error", (err) => {
      console.log("❌ Socket Connection Error:", err.message);
    });

    // Existing logic
    loadTripData();

    socket.on("location-update", (data) => {
      console.log("📡 Location update received");
      setLocation({
        lat: data.latitude,
        lng: data.longitude,
        address: data.address,
      });
    });

    socket.on("trip-status-changed", () => {
      console.log("🔄 Trip status changed event received");
      loadTripData();
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("location-update");
      socket.off("trip-status-changed");
    };
  }, [bookingId]);

  useEffect(() => {
    if (!trip) return;

    console.log("📦 Trip object before join:", trip);

    // If trip has _id
    if (trip?._id) {
      console.log("👉 Joining room with _id:", trip._id);
      socket.emit("join-booking", trip._id);
    }

    // If trip has tripId
    if (trip?.tripId) {
      console.log("👉 Joining room with tripId:", trip.tripId);
      socket.emit("join-booking", trip.tripId);
    }

  }, [trip]);

  useEffect(() => {
    if (trip) {
      console.log('[TrackingScreen] Trip data:', trip);
    }
    if (location) {
      console.log('[TrackingScreen] Location:', location);
    }
  }, [trip, location]);

  useEffect(() => {
    if (markerRef.current && location?.lat) {
      markerRef.current.animateMarkerToCoordinate(
        {
          latitude: location.lat,
          longitude: location.lng,
        },
        1000
      );
    }
  }, [location]);

  useEffect(() => {
    if (
      location?.lat &&
      trip?.booking?.dropLocation?.lat
    ) {
      fetchRoute(
        location.lat,
        location.lng,
        trip.booking.dropLocation.lat,
        trip.booking.dropLocation.lng
      );
    }
  }, [location]);

  useEffect(() => {
    if (location && mapRef.current) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: location.lat,
            longitude: location.lng,
          },
          zoom: 15,
        },
        { duration: 1000 }
      );
    }
  }, [location]);

  const loadTripData = async () => {
    try {
      const tripData = await tripService.trackByBooking(bookingId);
      console.log('[TrackingScreen] Loaded tripData:', tripData);
     
      setTrip(tripData);
      setLocation(tripData.currentLocation);

    } catch (error) {

      if (error.response?.status === 404) {
        // 👇 This is NORMAL – no trip yet
        console.log('[TrackingScreen] No trip found yet');
        setTrip(null);
      } else {
        console.error('Track trip error:', error);
        Alert.alert("Error", "Failed to load tracking information");
      }

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (trip?.status === "pod_approved" && !alreadyRated) {
      checkIfAlreadyRated();
    }
  }, [trip]);

  const getStatusInfo = (status) => {
    const statusMap = {
      assigned: {
        label: "Driver Assigned",
        iconName: "user",
        iconLib: "Feather",
        color: colors.statusWarning,
      },
      accepted: {
        label: "Trip Accepted",
        iconName: "check-circle",
        iconLib: "Feather",
        color: colors.statusSuccess,
      },
      going_to_pickup: {
        label: "Going to Pickup",
        iconName: "truck",
        iconLib: "FontAwesome5",
        color: colors.primary,
      },
      arrived_at_pickup: {
        label: "Arrived at Pickup",
        iconName: "map-pin",
        iconLib: "Feather",
        color: colors.primary,
      },
      loading: {
        label: "Loading",
        iconName: "archive",
        iconLib: "Feather",
        color: colors.primary,
      },
      loaded: {
        label: "Loaded",
        iconName: "check",
        iconLib: "Feather",
        color: colors.statusSuccess,
      },
      in_transit: {
        label: "In Transit",
        iconName: "navigation",
        iconLib: "Feather",
        color: colors.statusActive,
      },
      arrived_at_drop: {
        label: "Arrived at Drop",
        iconName: "map-pin",
        iconLib: "Feather",
        color: colors.statusSuccess,
      },
      delivered: {
        label: "Delivered",
        iconName: "package",
        iconLib: "Feather",
        color: colors.statusSuccess,
      },
      completed: {
        label: "Completed",
        iconName: "check-circle",
        iconLib: "Feather",
        color: colors.statusSuccess,
      },
      rejected: {
        label: "Rejected",
        iconName: "x-circle",
        iconLib: "Feather",
        color: colors.statusError,
      },
    };

    return (
      statusMap[status] || {
        label: status,
        iconName: "circle",
        iconLib: "Feather",
        color: colors.statusNeutral,
      }
    );
  };

  const fetchRoute = async (driverLat, driverLng, dropLat, dropLng) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${driverLat},${driverLng}&destination=${dropLat},${dropLng}&key=${GOOGLE_MAPS_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.routes.length) {
        const points = polyline.decode(
          data.routes[0].overview_polyline.points
        );

        const coords = points.map(point => ({
          latitude: point[0],
          longitude: point[1],
        }));

        setRouteCoords(coords);

        const leg = data.routes[0].legs[0];
        setEta(leg.duration.text);
        setDistanceRemaining(leg.distance.text);
      }
    } catch (err) {
      console.log("Route fetch error:", err);
    }
  };


  // Use timeline from backend if available, else fallback
  const getTimeline = () => {
    if (trip?.timeline && Array.isArray(trip.timeline)) {
      return trip.timeline.map((step) => ({
        ...getStatusInfo(step.key),
        ...step,
        completed: step.status === 'completed',
        current: step.status === 'current',
      }));
    }
    // fallback to old logic
    const allStatuses = [
      'assigned',
      'accepted',
      'going_to_pickup',
      'arrived_at_pickup',
      'loading',
      'loaded',
      'in_transit',
      'arrived_at_drop',
      'delivered',
      'completed',
    ];
    const currentIndex = allStatuses.indexOf(trip?.status || 'assigned');
    return allStatuses.map((status, index) => ({
      ...getStatusInfo(status),
      status,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  if (loading) {
    console.log('[TrackingScreen] Loading...');
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!trip) {
    console.log('[TrackingScreen] No trip data for bookingId:', bookingId);
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No tracking information available</Text>
        <Text style={styles.emptySubtext}>
          Tracking will be available once a driver is assigned
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const timeline = getTimeline();
  const currentStatus = getStatusInfo(trip.status);

  console.log('[TrackingScreen] Rendering map with location:', location);

  // Determine which coordinates to show on the map
  const pickup = trip?.booking?.pickupLocation;
  const drop = trip?.booking?.dropLocation;
  const hasPickup = pickup && typeof pickup.lat === 'number' && typeof pickup.lng === 'number';
  const hasDrop = drop && typeof drop.lat === 'number' && typeof drop.lng === 'number';
  const hasDriver = location && typeof location.lat === 'number' && typeof location.lng === 'number';

  // Center map: prefer driver, else pickup, else drop, else default
  let mapLat = 39.8283, mapLng = -98.5795; // Default: US center
  if (hasDriver) { mapLat = location.lat; mapLng = location.lng; }
  else if (hasPickup) { mapLat = pickup.lat; mapLng = pickup.lng; }
  else if (hasDrop) { mapLat = drop.lat; mapLng = drop.lng; }

  const onRefresh = () => {
    setRefreshing(true);
    loadTripData();
  };

  const checkIfAlreadyRated = async () => {
    try {
      const res = await ratingService.checkIfRated(trip.tripId);

      if (res.alreadyRated) {
        setAlreadyRated(true);
        setShowRatingModal(false);
      } else {
        setShowRatingModal(true);
      }
    } catch (err) {
      console.log("Rating check error", err);
    }
  };

  const handleSubmitRating = async () => {
    console.log("Trip object:", trip);
    console.log("Trip ID sending:", trip.tripId, "Rating:", rating, "Comment:", comment);
    try {
      await ratingService.submitRating(
        trip.tripId,
        rating,
        comment
      );

      Alert.alert("Success", "Rating submitted successfully!");
      setShowRatingModal(false);
      setAlreadyRated(true);
    } catch (error) {
      console.log("Rating error:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to submit rating");
    }
  };
  return (
    <SafeAreaView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ScrollView>

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>

          <AppText variant="screenTitle" style={styles.title}>Trip Tracking</AppText>

          <View style={styles.statusPill}>
            {currentStatus.iconLib === "Feather" && (
              <Feather name={currentStatus.iconName} size={12} color={currentStatus.color} style={{ marginRight: 4 }} />
            )}
            {currentStatus.iconLib === "FontAwesome5" && (
              <FontAwesome5 name={currentStatus.iconName} size={11} color={currentStatus.color} style={{ marginRight: 4 }} />
            )}
            {currentStatus.iconLib === "MaterialIcons" && (
              <MaterialIcons name={currentStatus.iconName} size={12} color={currentStatus.color} style={{ marginRight: 4 }} />
            )}
            <Text style={[styles.statusTextModern, { color: currentStatus.color }]}>
              {currentStatus.label}
            </Text>
          </View>
        </View>


        {(hasDriver || hasPickup || hasDrop) && (
          Platform.OS !== 'web' ? (
            <MapView
              ref={mapRef}
              style={{
                height: 380,
                marginHorizontal: spacing.lg,
                marginTop: spacing.lg,
                borderRadius: radius.card,
              }}
              initialRegion={{
                latitude: mapLat,
                longitude: mapLng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              {hasDriver && (
                <Marker.Animated
                  ref={markerRef}
                  zIndex={3}
                  coordinate={{
                    latitude: location.lat,
                    longitude: location.lng,
                  }}
                  title="Driver"
                  pinColor={colors.primary}
                />
              )}
              {hasPickup && (
                <Marker
                  zIndex={2}
                  coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
                  title="Pickup Location"
                  pinColor="#4CAF50"
                />
              )}
              {hasDrop && (
                <Marker
                  coordinate={{ latitude: drop.lat, longitude: drop.lng }}
                  title="Drop Location"
                  pinColor="#F44336"
                />
              )}
              {routeCoords.length > 0 && (
                <Polyline
                  coordinates={routeCoords}
                  strokeWidth={4}
                  strokeColor={colors.primary}
                />
              )}
            </MapView>
          ) : (
            <View style={{ height: 380, marginHorizontal: spacing.lg, marginTop: spacing.lg, borderRadius: radius.card, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
              <Text style={{ color: '#888', fontSize: 16, textAlign: 'center' }}>
                Map is not supported on web.
              </Text>
            </View>
          )
        )}

        {trip.driver && (
          <View style={styles.card}>
            <AppText variant="cardTitle" style={styles.cardTitle}>Driver Information</AppText>
            <View style={styles.driverInfo}>
              <View style={styles.infoRow}>
                <AppText weight="semiBold" style={styles.infoLabel}>Name:</AppText>
                <AppText weight="bold" style={styles.infoValue}>{trip.driver.name}</AppText>
              </View>
              <View style={styles.infoRow}>
                <AppText weight="semiBold" style={styles.infoLabel}>Phone:</AppText>
                <AppText weight="bold" style={styles.infoValue}>{trip.driver.phone}</AppText>
              </View>
              {trip.driver.vehicleType && (
                <View style={styles.infoRow}>
                  <AppText weight="semiBold" style={styles.infoLabel}>Vehicle:</AppText>
                  <AppText weight="bold" style={styles.infoValue}>{trip.driver.vehicleType}</AppText>
                </View>
              )}

              {distanceRemaining && (
                <View style={styles.infoRow}>
                  <AppText weight="semiBold" style={styles.infoLabel}>Distance Remaining:</AppText>
                  <AppText weight="bold" style={styles.infoValue}>{distanceRemaining}</AppText>
                </View>
              )}

              {eta && (
                <View style={styles.infoRow}>
                  <AppText weight="semiBold" style={styles.infoLabel}>ETA:</AppText>
                  <AppText weight="bold" style={styles.infoValue}>{eta}</AppText>
                </View>
              )}
              {trip.driver.plateNumber && (
                <View style={styles.infoRow}>
                  <AppText weight="semiBold" style={styles.infoLabel}>Plate No.:</AppText>
                  <AppText weight="bold" style={styles.infoValue}>{trip.driver.plateNumber}</AppText>
                </View>
              )}
              {location?.address && (
                <View style={styles.infoRow}>
                  <AppText weight="semiBold" style={styles.infoLabel}>Current Location:</AppText>
                  <AppText weight="bold" style={styles.infoValue}>{location.address}</AppText>
                </View>
              )}
              {trip.eta && (
                <View style={styles.infoRow}>
                  <AppText weight="semiBold" style={styles.infoLabel}>ETA:</AppText>
                  <AppText weight="bold" style={styles.infoValue}>{trip.eta}</AppText>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.card}>
          <AppText variant="cardTitle" style={styles.cardTitle}>Trip Timeline</AppText>
          <View style={styles.timeline}>
            {timeline.map((item, index) => (
              <View key={item.status} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineDot,
                    item.completed && styles.timelineDotCompleted,
                    item.current && styles.timelineDotCurrent,
                  ]}>
                    {item.completed && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  {index < timeline.length - 1 && (
                    <View style={[
                      styles.timelineLine,
                      item.completed && styles.timelineLineCompleted,
                    ]} />
                  )}
                </View>

                <View style={styles.timelineContent}>
                  <View style={styles.timelineLabelRow}>
                    <View style={styles.timelineIcon}>
                      {item.iconLib === "Feather" && (
                        <Feather name={item.iconName} size={16} color={item.color} />
                      )}
                      {item.iconLib === "FontAwesome5" && (
                        <FontAwesome5 name={item.iconName} size={14} color={item.color} />
                      )}
                      {item.iconLib === "MaterialIcons" && (
                        <MaterialIcons name={item.iconName} size={16} color={item.color} />
                      )}
                    </View>
                    <AppText weight="semiBold" style={[
                      styles.timelineLabel,
                      item.completed && styles.timelineLabelCompleted,
                      item.current && styles.timelineLabelCurrent,
                    ]}>
                      {item.label}
                    </AppText>
                  </View>
                  {item.current && (
                    <AppText weight="semiBold" style={styles.currentBadge}>Current Status</AppText>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {trip.lastUpdatedAt && (
          <View style={styles.footer}>
            <AppText weight="semiBold" style={styles.footerText}>
              Last updated: {new Date(trip.lastUpdatedAt).toLocaleString()}
            </AppText>
          </View>
        )}
        {showRatingModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Feather name="star" size={32} color={colors.primary} style={{ alignSelf: "center" }} />

              <AppText weight="bold" style={styles.modalTitle}>
                Rate Your Driver
              </AppText>

              <AppText style={styles.modalSubtitle}>
                How was your experience?
              </AppText>

              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <Feather
                      name={star <= rating ? "star" : "star"}
                      size={32}
                      color={star <= rating ? colors.primary : colors.border}
                      style={{ marginHorizontal: 6 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                placeholder="Write your review (optional)"
                placeholderTextColor="#94A3B8"
                value={comment}
                onChangeText={setComment}
                style={styles.commentInput}
                multiline
              />

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  rating === 0 && { opacity: 0.5 }
                ]}
                disabled={rating === 0}
                onPress={handleSubmitRating}
              >
                <AppText weight="bold" style={{ color: "#fff" }}>
                  Submit Rating
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "85%",
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius.modal,
    ...shadows.elevated,
  },

  modalTitle: {
    fontSize: 20,
    textAlign: "center",
    color: colors.text,
    marginTop: 10,
  },

  modalSubtitle: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },

  starRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },

  commentInput: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    borderRadius: radius.input,
    marginBottom: 16,
    color: colors.text,
    minHeight: 60,
  },

  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.button,
    alignItems: "center",
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.base,
    paddingBottom: spacing.base,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },

  backButton: {
    width: 30,
  },

  title: {
    flex: 1,
    color: colors.text,
    marginLeft: 10,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusTextModern: {
    fontSize: 12,
    fontWeight: "600",
  },

  headerCenter: {
    flex: 1,
  },



  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },


  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.base,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardTitle: {
    marginBottom: 16,
    color: colors.text,
  },
  driverInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  timeline: {
    paddingVertical: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  timelineDotCurrent: {
    borderColor: colors.primary,
    borderWidth: 3,
  },

  timelineLineCompleted: {
    backgroundColor: colors.primary,
  },

  timelineLabelCurrent: {
    color: colors.primary,
    fontWeight: "700",
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#ccc',
    marginVertical: 4,
  },

  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineIcon: {
    width: 24,
    alignItems: "center",
    marginRight: 10,
  },
  timelineLabel: {
    fontSize: 15,
    color: colors.textMuted,
  },
  timelineLabelCompleted: {
    color: colors.text,
    fontWeight: '500',
  },

  currentBadge: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: radius.button,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
 

 

 
});


