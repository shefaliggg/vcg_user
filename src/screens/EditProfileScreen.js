import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userService from '../services/user.service';
import { LinearGradient } from 'expo-linear-gradient';
import AppText from '../components/AppText';


const EditProfileScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    companyName: '',
    gstNumber: '',
    taxId: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('authToken');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phone: userData.phone || '',
          companyName: userData.companyProfile?.companyName || '',
          gstNumber: userData.companyProfile?.gstNumber || '',
          taxId: userData.companyProfile?.taxId || '',
        });
      }
      // Optionally refresh profile if token exists
      if (token) {
        try {
          const freshUser = await userService.getProfile();
          setUser(freshUser);
          setFormData({
            firstName: freshUser.firstName || '',
            lastName: freshUser.lastName || '',
            phone: freshUser.phone || '',
            companyName: freshUser.companyProfile?.companyName || '',
            gstNumber: freshUser.companyProfile?.gstNumber || '',
            taxId: freshUser.companyProfile?.taxId || '',
          });
        } catch (serverError) {
          console.error('Server profile fetch failed:', serverError);
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Error', 'First name and last name are required');
      return;
    }

    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Update profile
      await userService.updateProfile(user._id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        companyProfile: {
          companyName: formData.companyName,
          gstNumber: formData.gstNumber,
          taxId: formData.taxId,
        },
      });

      // 2️⃣ Get updated profile from server
      const updatedUser = await userService.getProfile();

      // 3️⃣ Save updated user to AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      // 4️⃣ Show success
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);

    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };



  return (
    <LinearGradient
      colors={['#1E3A8A', '#2563EB']}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <AppText weight="bold" style={styles.headerTitle}>
            Edit Profile
          </AppText>

          <View style={{ width: 24 }} />
        </View>

        {/* Card */}
        <View style={styles.card}>

          {/* Personal Section */}
          <AppText weight="bold" style={styles.sectionTitle}>
            Personal Details
          </AppText>

          <View style={styles.inputGroup}>
            <AppText style={styles.label}>First Name *</AppText>
            <TextInput
              style={styles.input}
              value={formData.firstName}
              onChangeText={(v) => handleChange('firstName', v)}
              placeholder="Enter first name"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Last Name *</AppText>
            <TextInput
              style={styles.input}
              value={formData.lastName}
              onChangeText={(v) => handleChange('lastName', v)}
              placeholder="Enter last name"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Phone *</AppText>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(v) => handleChange('phone', v)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Company Section */}
          <AppText weight="bold" style={[styles.sectionTitle, { marginTop: 24 }]}>
            Company Details
          </AppText>

          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Company Name</AppText>
            <TextInput
              style={styles.input}
              value={formData.companyName}
              onChangeText={(v) => handleChange('companyName', v)}
              placeholder="Enter company name"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <AppText style={styles.label}>GST Number</AppText>
            <TextInput
              style={styles.input}
              value={formData.gstNumber}
              onChangeText={(v) => handleChange('gstNumber', v)}
              placeholder="Enter GST number"
              autoCapitalize="characters"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Tax ID</AppText>
            <TextInput
              style={styles.input}
              value={formData.taxId}
              onChangeText={(v) => handleChange('taxId', v)}
              placeholder="Enter tax ID"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <AppText weight="bold" style={styles.saveText}>
                Save Changes
              </AppText>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </LinearGradient>
  );
}


const styles = StyleSheet.create({
  header: {
    marginTop: 60,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
  },
  card: {
    backgroundColor: '#fff',
    marginTop: 40,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    
  },
  sectionTitle: {
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    marginBottom: 6,
    color: '#1E293B',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1E293B',
  },
  saveButton: {
    backgroundColor: '#1E40AF',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default EditProfileScreen;
