import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import tripService from "../services/trip.service";

export default function TrackingScreen({ route, navigation }) {
  const { bookingId } = route.params || {};
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (bookingId) {
      loadTripData();
    }
  }, [bookingId]);

  const loadTripData = async () => {
    try {
      const tripData = await tripService.trackByBooking(bookingId);
      setTrip(tripData);
    } catch (error) {
      console.error('Track trip error:', error);
      Alert.alert("Error", "Failed to load tracking information");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTripData();
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      assigned: { label: 'Driver Assigned', icon: '👨‍✈️', color: '#FFA500' },
      accepted: { label: 'Trip Accepted', icon: '✅', color: '#32CD32' },
      going_to_pickup: { label: 'Going to Pickup', icon: '🚚', color: '#4169E1' },
      arrived_at_pickup: { label: 'Arrived at Pickup', icon: '📍', color: '#4169E1' },
      loading: { label: 'Loading', icon: '📦', color: '#4169E1' },
      loaded: { label: 'Loaded', icon: '✔️', color: '#32CD32' },
      in_transit: { label: 'In Transit', icon: '🚛', color: '#32CD32' },
      arrived_at_drop: { label: 'Arrived at Drop', icon: '📌', color: '#32CD32' },
      delivered: { label: 'Delivered', icon: '✅', color: '#228B22' },
      completed: { label: 'Completed', icon: '🎉', color: '#228B22' },
      rejected: { label: 'Rejected', icon: '❌', color: '#DC143C' },
    };
    return statusMap[status] || { label: status, icon: '•', color: '#666' };
  };

  const getTimeline = () => {
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
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!trip) {
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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Trip Tracking</Text>
        <View style={[styles.statusBadge, { backgroundColor: currentStatus.color }]}>
          <Text style={styles.statusIcon}>{currentStatus.icon}</Text>
          <Text style={styles.statusText}>{currentStatus.label}</Text>
        </View>
      </View>

      {trip.driver && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Driver Information</Text>
          <View style={styles.driverInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{trip.driver.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{trip.driver.phone}</Text>
            </View>
            {trip.driver.vehicleType && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Vehicle:</Text>
                <Text style={styles.infoValue}>{trip.driver.vehicleType}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Trip Timeline</Text>
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
                  <Text style={styles.timelineIcon}>{item.icon}</Text>
                  <Text style={[
                    styles.timelineLabel,
                    item.completed && styles.timelineLabelCompleted,
                    item.current && styles.timelineLabelCurrent,
                  ]}>
                    {item.label}
                  </Text>
                </View>
                {item.current && (
                  <Text style={styles.currentBadge}>Current Status</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {trip.lastUpdatedAt && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Last updated: {new Date(trip.lastUpdatedAt).toLocaleString()}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    backgroundColor: "#7b2ff2",
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
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
    backgroundColor: "#fff",
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
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
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  timeline: {
    paddingVertical: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 8,
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
    borderColor: '#ccc',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotCompleted: {
    backgroundColor: '#7b2ff2',
    borderColor: '#7b2ff2',
  },
  timelineDotCurrent: {
    borderColor: '#7b2ff2',
    borderWidth: 3,
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
  timelineLineCompleted: {
    backgroundColor: '#7b2ff2',
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
    fontSize: 18,
    marginRight: 8,
  },
  timelineLabel: {
    fontSize: 16,
    color: '#666',
  },
  timelineLabelCompleted: {
    color: '#333',
    fontWeight: '500',
  },
  timelineLabelCurrent: {
    color: '#7b2ff2',
    fontWeight: 'bold',
  },
  currentBadge: {
    fontSize: 12,
    color: '#7b2ff2',
    marginTop: 4,
    marginLeft: 26,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#7b2ff2",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
