import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/auth.service';
import userService from '../services/user.service';
import AppText from '../components/AppText';
import { colors } from '../themes/colors';
import { spacing } from '../themes/spacing';
import { radius } from '../themes/radius';
import { shadows } from '../themes/shadows';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
 

  const loadUserData = async () => {
    try {
      setLoading(true);
      const storedUser = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('authToken');

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      // Only attempt server refresh if we have a token
      if (token) {
        try {
          const freshUser = await userService.getProfile();
          setUser(freshUser);
        } catch (serverError) {
          // Gracefully ignore 401 and keep cached user
          console.error('Server profile fetch failed:', serverError);
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
return (
  <ScrollView
    style={styles.container}
    contentContainerStyle={{ paddingBottom: 40 }}
    showsVerticalScrollIndicator={false}
  >
    <View style={styles.header}>
      <View style={styles.avatarContainer}>
        <Icon name="person" size={60} color="#fff" />
      </View>
      <AppText weight="bold" style={styles.nameText}>
        {user?.firstName} {user?.lastName}
      </AppText>
      <AppText weight="semiBold" style={styles.emailText}>
        {user?.email}
      </AppText>
    </View>

    <View style={styles.section}>
      <AppText variant="sectionTitle" style={styles.sectionTitle}>
        Personal Information
      </AppText>

      <View style={styles.infoRow}>
        <AppText weight="semiBold" style={styles.label}>
          First Name
        </AppText>
        <Text style={styles.value}>{user?.firstName || "N/A"}</Text>
      </View>

      <View style={styles.infoRow}>
        <AppText weight="semiBold" style={styles.label}>
          Last Name
        </AppText>
        <Text style={styles.value}>{user?.lastName || "N/A"}</Text>
      </View>

      <View style={styles.infoRow}>
        <AppText weight="semiBold" style={styles.label}>
          Email
        </AppText>
        <Text style={styles.value}>{user?.email || "N/A"}</Text>
      </View>

      <View style={styles.infoRow}>
        <AppText weight="semiBold" style={styles.label}>
          Phone
        </AppText>
        <Text style={styles.value}>{user?.phone || "N/A"}</Text>
      </View>

      <View style={styles.infoRow}>
        <AppText weight="semiBold" style={styles.label}>
          Company Name
        </AppText>
        <Text style={styles.value}>
          {user?.companyProfile?.companyName || "N/A"}
        </Text>
      </View>

      <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
        <AppText weight="semiBold" style={styles.label}>
          GST Number
        </AppText>
        <Text style={styles.value}>
          {user?.companyProfile?.gstNumber || "N/A"}
        </Text>
      </View>
    </View>

    <View style={styles.buttonSection}>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.navigate("EditProfile")}
      >
        <Icon name="edit" size={20} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.passwordButton}
        onPress={() => navigation.navigate("ChangePassword")}
      >
        <Icon name="lock" size={20} color={colors.primary} style={styles.buttonIcon} />
        <Text style={styles.passwordButtonText}>Change Password</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Icon name="logout" size={20} color="#DC2626" style={styles.buttonIcon} />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  </ScrollView>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 24,
    paddingBottom: 30,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: radius.avatar,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  nameText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },

  emailText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },
  section: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.base,
    marginTop: spacing.lg,
    borderRadius: radius.card,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  sectionTitle: {
    color: colors.text,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
  },

  value: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  buttonSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  editButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    borderRadius: radius.button,
    marginBottom: 14,
    ...shadows.card,
  },
  buttonIcon: {
    marginRight: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  passwordButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    borderRadius: radius.button,
    marginBottom: 14,
  },
  passwordButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    borderRadius: radius.button,
  },
  logoutButtonText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: "600",
  },

});

export default ProfileScreen;


