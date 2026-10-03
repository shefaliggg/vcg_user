import React, { useState, useCallback, useEffect } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  DeviceEventEmitter,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import bookingService from "../services/booking.service";
import authService from "../services/auth.service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api.service";
import AppText from "../components/AppText";
import { colors } from "../themes/colors";
import { spacing } from "../themes/spacing";
import { radius } from "../themes/radius";
import { shadows } from "../themes/shadows";

// Real Booking.status enum (backend): OPEN_FOR_QUOTES, CONFIRMED, ACCEPTED, IN_PROGRESS, DELIVERED
const STATUS_LABEL = {
  PENDING_APPROVAL: "Pending Admin Review",
  OPEN_FOR_QUOTES: "Posted",
  CONFIRMED: "Driver Assigned",
  ACCEPTED: "Pickup Pending",
  IN_PROGRESS: "In Transit",
  DELIVERED: "Delivered",
};

const STATUS_COLOR = {
  OPEN_FOR_QUOTES: colors.statusPending,
  CONFIRMED: colors.statusActive,
  ACCEPTED: colors.statusActive,
  IN_PROGRESS: colors.success,
  DELIVERED: colors.textMuted,
};

const loadIdOf = (booking) => booking.loadNumber || `#${booking._id?.slice(-6).toUpperCase()}`;
const driverNameOf = (booking) => {
  const u = booking.driverId?.userId;
  return u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Assigned" : null;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : "TBD";
const formatDay = (value) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const [bookings, setBookings] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [unread, setUnread] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadData();
      fetchCount();
    }, [])
  );

  useEffect(() => {
    const listener = DeviceEventEmitter.addListener("refreshNotifications", fetchCount);
    return () => listener.remove();
  }, []);

  useEffect(() => {
    const listener = DeviceEventEmitter.addListener("openNotification", (data) => {
      if (data?.bookingId) {
        navigation.navigate("LoadDetails", { bookingId: data.bookingId });
      }
    });
    return () => listener.remove();
  }, []);

  const fetchCount = async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setUnread(res.data.count);
    } catch (err) {
      console.log("Unread count error:", err);
    }
  };

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        navigation.replace("Login");
        return;
      }

      const userData = await authService.getCurrentUser();
      setUser(userData);

      const bookingsData = await bookingService.getMyBookings();
      setBookings(bookingsData);

      try {
        const res = await api.get("/notifications/me");
        setActivity(res.data.slice(0, 6));
      } catch (err) {
        console.log("Activity fetch error:", err);
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        await authService.logout();
        navigation.replace("Login");
      } else {
        console.error("Home load error:", error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Drafts aren't posted yet, so they don't count as active/pending work.
  const postedBookings = bookings.filter((b) => !b.isDraft);
  const activeLoads = postedBookings.filter((b) => b.status !== "DELIVERED");
  const pendingLoads = postedBookings.filter((b) => b.status === "OPEN_FOR_QUOTES");
  const inTransit = postedBookings.filter((b) => b.status === "IN_PROGRESS");
  const delivered = postedBookings.filter((b) => b.status === "DELIVERED");

  const activeShipments = [...activeLoads]
    .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate))
    .slice(0, 3);

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  // Only things that need the shipper to act.
  const attention = [];
  activeLoads.forEach((b) => {
    const pickupAt = b.pickupDate ? new Date(b.pickupDate).getTime() : null;
    if (b.status === "OPEN_FOR_QUOTES") {
      attention.push({
        id: `${b._id}-driver`,
        icon: pickupAt && pickupAt < now ? "clock" : "user-x",
        text: pickupAt && pickupAt < now
          ? `Pickup date passed with no driver - ${loadIdOf(b)}`
          : `No driver assigned yet - ${loadIdOf(b)}`,
        bookingId: b._id,
      });
    } else if (pickupAt && b.status !== "IN_PROGRESS" && pickupAt > now && pickupAt - now <= DAY) {
      attention.push({ id: `${b._id}-soon`, icon: "calendar", text: `Pickup within 24h - ${loadIdOf(b)}`, bookingId: b._id });
    }
    if (b.deliveryDate && new Date(b.deliveryDate).getTime() < now) {
      attention.push({ id: `${b._id}-delivery`, icon: "alert-triangle", text: `Delivery delayed - ${loadIdOf(b)}`, bookingId: b._id });
    }
  });
  activity.forEach((n) => {
    if (/delay|reject|declin|issue|missing/i.test(`${n.title} ${n.body}`)) {
      attention.push({ id: n._id, icon: "alert-circle", text: n.title });
    }
  });

  const upcomingPickups = postedBookings
    .filter((b) => (b.status === "CONFIRMED" || b.status === "ACCEPTED") && b.pickupDate && new Date(b.pickupDate).getTime() >= now - DAY)
    .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate))
    .slice(0, 3);

  // Lifecycle events from the loads themselves (the API has no activity feed),
  // merged with notifications so it reads: load posted, driver assigned, ...
  const lifecycleEvents = [];
  postedBookings.forEach((b) => {
    lifecycleEvents.push({ id: `${b._id}-posted`, title: `${loadIdOf(b)} posted`, at: b.createdAt, icon: "upload" });
    const changedAt = b.updatedAt || b.createdAt;
    if (b.status === "CONFIRMED" || b.status === "ACCEPTED") {
      lifecycleEvents.push({ id: `${b._id}-assigned`, title: `Driver assigned - ${loadIdOf(b)}`, body: driverNameOf(b) || undefined, at: changedAt, icon: "user-check" });
    } else if (b.status === "IN_PROGRESS") {
      lifecycleEvents.push({ id: `${b._id}-started`, title: `Shipment started - ${loadIdOf(b)}`, at: changedAt, icon: "truck" });
    } else if (b.status === "DELIVERED") {
      lifecycleEvents.push({ id: `${b._id}-delivered`, title: `Delivery completed - ${loadIdOf(b)}`, at: changedAt, icon: "check-circle" });
    }
  });
  const recentActivity = [
    ...lifecycleEvents,
    ...activity.map((n) => ({ id: n._id, title: n.title, body: n.body, at: n.createdAt, icon: "bell" })),
  ]
    .filter((e) => e.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 6);

  const companyName = user?.companyProfile?.companyName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "CP Shipper";
  const initials = (companyName || "CP").slice(0, 2).toUpperCase();

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.body}>

        {/* OVERVIEW */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Active Loads"
            value={activeLoads.length}
            icon="package"
            color={colors.primary}
            onPress={() => navigation.navigate("Loads", { filter: "active" })}
          />
          <StatCard
            label="Awaiting Driver"
            value={pendingLoads.length}
            icon="clock"
            color={colors.warning}
            onPress={() => navigation.navigate("Loads", { filter: "OPEN_FOR_QUOTES" })}
          />
          <StatCard
            label="In Transit"
            value={inTransit.length}
            icon="truck"
            color={colors.success}
            onPress={() => navigation.navigate("Loads", { filter: "IN_PROGRESS" })}
          />
          <StatCard
            label="Delivered"
            value={delivered.length}
            icon="check-circle"
            color={colors.textMuted}
            onPress={() => navigation.navigate("Loads", { filter: "DELIVERED" })}
          />
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.quickActions}>
          <QuickAction primary icon="plus" label="Post a Load" onPress={() => navigation.navigate("Booking")} />
          <QuickAction icon="package" label="View Loads" onPress={() => navigation.navigate("Loads")} />
          <QuickAction icon="map-pin" label="Track Shipment" onPress={() => navigation.navigate("TrackingTab")} />
        </View>

        {/* ACTIVE SHIPMENTS */}
        <SectionHeader title="Active Shipments" actionLabel="View All" onPress={() => navigation.navigate("Loads")} />
        {activeShipments.length === 0 ? (
          <EmptyRow icon="package" text="No active shipments yet" />
        ) : (
          activeShipments.map((b) => {
            const statusColor = STATUS_COLOR[b.status] || colors.statusNeutral;
            return (
              <View key={b._id} style={styles.shipmentCard}>
                <View style={styles.shipmentTop}>
                  <AppText weight="bold" style={styles.shipmentId}>{loadIdOf(b)}</AppText>
                  <View style={[styles.statusPill, { backgroundColor: `${statusColor}1A` }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <AppText weight="semiBold" style={[styles.statusPillText, { color: statusColor }]}>
                      {STATUS_LABEL[b.status] || b.status}
                    </AppText>
                  </View>
                </View>

                <RouteBlock from={b.pickupLocation?.address} to={b.deliveryLocation?.address} />

                <View style={styles.chipRow}>
                  <InfoChip icon="calendar" text={formatDateTime(b.pickupDate)} />
                  <InfoChip icon="user" text={driverNameOf(b) || "Unassigned"} />
                  {!!b.deliveryDate && <InfoChip icon="flag" text={`ETA ${formatDay(b.deliveryDate)}`} />}
                </View>

                <TouchableOpacity
                  style={[styles.cardButton, b.status === "IN_PROGRESS" && styles.cardButtonPrimary]}
                  onPress={() =>
                    b.status === "IN_PROGRESS"
                      ? navigation.navigate("Tracking", { bookingId: b._id })
                      : navigation.navigate("LoadDetails", { bookingId: b._id })
                  }
                >
                  <AppText
                    weight="semiBold"
                    style={[styles.cardButtonText, b.status === "IN_PROGRESS" && { color: colors.white }]}
                  >
                    {b.status === "IN_PROGRESS" ? "Track Shipment" : "View Details"}
                  </AppText>
                  <Feather
                    name="chevron-right"
                    size={16}
                    color={b.status === "IN_PROGRESS" ? colors.white : colors.primary}
                  />
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {/* LOADS REQUIRING ATTENTION */}
        {attention.length > 0 && (
          <>
            <SectionHeader title="Action Required" badge={attention.length} />
            {attention.slice(0, 4).map((a) => (
              <TouchableOpacity
                key={a.id}
                style={styles.alertRow}
                disabled={!a.bookingId}
                onPress={() => navigation.navigate("LoadDetails", { bookingId: a.bookingId })}
              >
                <View style={styles.alertIcon}>
                  <Feather name={a.icon} size={16} color={colors.error} />
                </View>
                <AppText weight="semiBold" style={styles.alertText}>{a.text}</AppText>
                {!!a.bookingId && <Feather name="chevron-right" size={16} color={colors.textMuted} />}
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* UPCOMING PICKUPS */}
        <SectionHeader title="Upcoming Pickups" />
        {upcomingPickups.length === 0 ? (
          <EmptyRow icon="calendar" text="No pickups scheduled" />
        ) : (
          <View style={styles.listCard}>
            {upcomingPickups.map((b, i) => (
              <TouchableOpacity
                key={b._id}
                style={[styles.listRow, i > 0 && styles.listRowDivider]}
                onPress={() => navigation.navigate("LoadDetails", { bookingId: b._id })}
              >
                <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
                  <Feather name="calendar" size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="semiBold" style={styles.activityTitle} numberOfLines={1}>
                    {loadIdOf(b)} · {driverNameOf(b) || "Unassigned"}
                  </AppText>
                  <AppText style={styles.activityBody} numberOfLines={1}>
                    {b.pickupLocation?.address || "N/A"}
                  </AppText>
                  <AppText weight="semiBold" style={[styles.activityBody, { color: STATUS_COLOR[b.status] || colors.textMuted }]}>
                    {STATUS_LABEL[b.status] || b.status}
                  </AppText>
                </View>
                <AppText weight="semiBold" style={styles.rowTime}>{formatDateTime(b.pickupDate)}</AppText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* RECENT ACTIVITY */}
        <SectionHeader title="Recent Activity" />
        {recentActivity.length === 0 ? (
          <EmptyRow icon="activity" text="No recent activity" />
        ) : (
          <View style={styles.listCard}>
            {recentActivity.map((n, i) => (
              <View key={n.id} style={[styles.listRow, i > 0 && styles.listRowDivider]}>
                <View style={[styles.rowIcon, { backgroundColor: colors.background }]}>
                  <Feather name={n.icon} size={16} color={colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="semiBold" style={styles.activityTitle} numberOfLines={1}>{n.title}</AppText>
                  {!!n.body && <AppText style={styles.activityBody} numberOfLines={1}>{n.body}</AppText>}
                </View>
                <AppText style={styles.activityTime}>{timeAgo(n.at)}</AppText>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, icon, color, onPress }) {
  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.statIconWrapper, { backgroundColor: `${color}1A` }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText weight="bold" style={styles.statValue}>{value}</AppText>
        <AppText style={styles.statLabel} numberOfLines={1}>{label}</AppText>
      </View>
    </TouchableOpacity>
  );
}

function QuickAction({ icon, label, onPress, primary }) {
  return (
    <TouchableOpacity style={[styles.quickAction, primary && styles.quickActionPrimary]} onPress={onPress}>
      <View style={[styles.quickIcon, primary && styles.quickIconPrimary]}>
        <Feather name={icon} size={18} color={primary ? colors.white : colors.primary} />
      </View>
      <AppText weight="semiBold" style={[styles.quickActionText, primary && { color: colors.white }]} numberOfLines={1}>
        {label}
      </AppText>
    </TouchableOpacity>
  );
}

function SectionHeader({ title, actionLabel, onPress, badge }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <AppText variant="sectionTitle" style={styles.sectionTitle}>{title}</AppText>
        {!!badge && (
          <View style={styles.sectionBadge}>
            <AppText weight="bold" style={styles.sectionBadgeText}>{badge}</AppText>
          </View>
        )}
      </View>
      {actionLabel && (
        <TouchableOpacity onPress={onPress}>
          <AppText weight="semiBold" style={styles.sectionAction}>{actionLabel}</AppText>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Pickup and delivery stacked on a rail: green dot -> line -> red dot.
function RouteBlock({ from, to }) {
  return (
    <View style={styles.routeWrap}>
      <View style={styles.routeRail}>
        <View style={[styles.routeDot, { backgroundColor: colors.success }]} />
        <View style={styles.routeLine} />
        <View style={[styles.routeDot, { backgroundColor: colors.error }]} />
      </View>
      <View style={styles.routeTexts}>
        <AppText weight="semiBold" style={styles.routeText} numberOfLines={1}>{from || "N/A"}</AppText>
        <AppText weight="semiBold" style={styles.routeText} numberOfLines={1}>{to || "N/A"}</AppText>
      </View>
    </View>
  );
}

function InfoChip({ icon, text }) {
  return (
    <View style={styles.chip}>
      <Feather name={icon} size={12} color={colors.textMuted} />
      <AppText style={styles.chipText} numberOfLines={1}>{text}</AppText>
    </View>
  );
}

function EmptyRow({ icon, text }) {
  return (
    <View style={styles.emptyRow}>
      <Feather name={icon} size={18} color={colors.textMuted} />
      <AppText style={styles.emptyRowText}>{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  body: {
    backgroundColor: colors.background,
    paddingTop: spacing.xs,
  },

  // Overview cards
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    gap: spacing.sm,
  },
  statCard: {
    flexBasis: "48%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  statIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radius.input,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 22,
    lineHeight: 26,
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Quick actions
  quickActions: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    marginTop: spacing.base,
  },
  quickAction: {
    flex: 1,
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  quickActionPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },
  quickIconPrimary: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  quickActionText: {
    fontSize: 12,
    color: colors.text,
  },

  // Sections
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
  },
  sectionBadge: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: colors.error,
    alignItems: "center",
  },
  sectionBadgeText: {
    color: colors.white,
    fontSize: 11,
  },
  sectionAction: {
    fontSize: 13,
    color: colors.primary,
  },

  // Shipment card
  shipmentCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    padding: spacing.base,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  shipmentTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  shipmentId: {
    fontSize: 15,
    color: colors.text,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
  },
  routeWrap: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  routeRail: {
    alignItems: "center",
    marginRight: spacing.md,
    paddingVertical: 4,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeLine: {
    flex: 1,
    width: 2,
    minHeight: 14,
    marginVertical: 3,
    backgroundColor: colors.border,
  },
  routeTexts: {
    flex: 1,
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  routeText: {
    fontSize: 14,
    color: colors.text,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    maxWidth: "100%",
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  chipText: {
    fontSize: 12,
    color: colors.textMuted,
    flexShrink: 1,
  },
  cardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    backgroundColor: colors.primaryLight,
  },
  cardButtonPrimary: {
    backgroundColor: colors.primary,
  },
  cardButtonText: {
    color: colors.primary,
    fontSize: 13,
  },

  // Attention
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#FECACA",
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },

  // Grouped lists
  listCard: {
    marginHorizontal: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  listRowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTime: {
    fontSize: 11,
    color: colors.primary,
  },
  activityTitle: {
    fontSize: 14,
    color: colors.text,
  },
  activityBody: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  activityTime: {
    fontSize: 11,
    color: colors.textMuted,
  },
  emptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.base,
    padding: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  emptyRowText: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
