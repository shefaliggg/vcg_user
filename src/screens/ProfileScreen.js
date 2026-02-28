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
        <ActivityIndicator size="large" color="#7b2ff2" />
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
      <AppText weight="bold" style={styles.sectionTitle}>
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
        <Icon name="lock" size={20} color="#1E3A8A" style={styles.buttonIcon} />
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
    backgroundColor: '#F6F7FB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: "#1E3A8A",
    paddingTop: 70,
    paddingBottom: 30,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  label: {
    fontSize: 13,
    color: "#6B7280",
  },

  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  buttonSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  editButton: {
    backgroundColor: "#1E3A8A",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 14,
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#1E3A8A",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 14,
  },
  passwordButtonText: {
    color: "#1E3A8A",
    fontSize: 15,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DC2626",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 14,
  },
  logoutButtonText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "600",
  },

});

export default ProfileScreen;
