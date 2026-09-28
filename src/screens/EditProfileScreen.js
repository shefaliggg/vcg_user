import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
import AppText from '../components/AppText';
import FormInput from '../components/FormInput';
import { colors } from '../themes/colors';
import { spacing } from '../themes/spacing';
import { radius } from '../themes/radius';

const PHONE_REGEX = /^[0-9()\-\s+]{7,}$/;


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
  const [errors, setErrors] = useState({});

  const validators = {
    firstName: (v) => (!v.trim() ? 'Required' : null),
    lastName: (v) => (!v.trim() ? 'Required' : null),
    phone: (v) => {
      if (!v.trim()) return 'Required';
      if (!PHONE_REGEX.test(v.trim())) return 'Enter a valid phone number';
      return null;
    },
  };

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
    if (errors[field] && validators[field] && !validators[field](value)) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSave = async () => {
    const nextErrors = {};
    Object.keys(validators).forEach((field) => {
      const message = validators[field](formData[field]);
      if (message) nextErrors[field] = message;
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

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
    <View
      style={{ flex: 1, backgroundColor: colors.primary }}
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

          <AppText variant="sectionTitle" style={styles.headerTitle}>
            Edit Profile
          </AppText>

          <View style={{ width: 24 }} />
        </View>

        {/* Card */}
        <View style={styles.card}>

          {/* Personal Section */}
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            Personal Details
          </AppText>

          <FormInput
            label="First Name"
            required
            value={formData.firstName}
            onChangeText={(v) => handleChange('firstName', v)}
            placeholder="Enter first name"
            error={errors.firstName}
          />

          <FormInput
            label="Last Name"
            required
            value={formData.lastName}
            onChangeText={(v) => handleChange('lastName', v)}
            placeholder="Enter last name"
            error={errors.lastName}
          />

          <FormInput
            label="Phone"
            required
            value={formData.phone}
            onChangeText={(v) => handleChange('phone', v)}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            error={errors.phone}
          />

          {/* Company Section */}
          <AppText variant="sectionTitle" style={[styles.sectionTitle, { marginTop: 24 }]}>
            Company Details
          </AppText>

          <FormInput
            label="Company Name"
            value={formData.companyName}
            onChangeText={(v) => handleChange('companyName', v)}
            placeholder="Enter company name"
          />

          <FormInput
            label="GST Number"
            value={formData.gstNumber}
            onChangeText={(v) => handleChange('gstNumber', v)}
            placeholder="Enter GST number"
            autoCapitalize="characters"
          />

          <FormInput
            label="Tax ID"
            value={formData.taxId}
            onChangeText={(v) => handleChange('taxId', v)}
            placeholder="Enter tax ID"
          />

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <AppText variant="button" style={styles.saveText}>
                Save Changes
              </AppText>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
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
  },
  card: {
    backgroundColor: colors.surface,
    marginTop: 40,
    borderTopLeftRadius: radius.bottomSheet,
    borderTopRightRadius: radius.bottomSheet,
    padding: spacing.xl,

  },
  sectionTitle: {
    color: colors.text,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    marginBottom: 6,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.input,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    height: 50,
    justifyContent: 'center',
    borderRadius: radius.button,
    alignItems: 'center',
    marginTop: 20,
  },
  saveText: {
    color: '#fff',
  },
  disabled: {
    opacity: 0.6,
  },
});

export default EditProfileScreen;


