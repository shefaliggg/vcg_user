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

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validators = {
    currentPassword: (v) => (!v.trim() ? 'Required' : null),
    newPassword: (v) => {
      if (!v.trim()) return 'Required';
      if (v.length < 6) return 'Must be at least 6 characters';
      return null;
    },
    confirmPassword: (v, data) => {
      if (!v.trim()) return 'Required';
      if (v !== data.newPassword) return 'Passwords do not match';
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
        setUser(JSON.parse(storedUser));
      }
      // Refresh server-side user if token exists
      if (token) {
        try {
          const freshUser = await userService.getProfile();
          setUser(freshUser);
        } catch (serverError) {
          console.error('Server profile fetch failed:', serverError);
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (errors[field] && !validators[field](value, next)) {
        setErrors((prevErrors) => ({ ...prevErrors, [field]: undefined }));
      }
      // Re-check confirmPassword live when newPassword changes, so a
      // previously-flagged mismatch clears as soon as they line up again.
      if (field === 'newPassword' && errors.confirmPassword && !validators.confirmPassword(next.confirmPassword, next)) {
        setErrors((prevErrors) => ({ ...prevErrors, confirmPassword: undefined }));
      }
      return next;
    });
  };

  const handleChangePassword = async () => {
    const nextErrors = {};
    Object.keys(validators).forEach((field) => {
      const message = validators[field](formData[field], formData);
      if (message) nextErrors[field] = message;
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    if (!user) {
      Alert.alert('Error', 'User data not loaded');
      return;
    }

    try {
      setLoading(true);
      await userService.changePassword(user._id, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      Alert.alert('Success', 'Password changed successfully', [
        {
          text: 'OK',
          onPress: () => {
            setFormData({
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
            });
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };


  return (
    <View
      style={{ flex: 1, backgroundColor: colors.primary }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>

          <AppText variant="screenTitle" style={styles.headerTitle}>
            Change Password
          </AppText>

          <View style={{ width: 40 }} />
        </View>

        {/* Card */}
        <View style={styles.card}>

          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            Security
          </AppText>

          {/* Current Password */}
          <FormInput
            label="Current Password"
            required
            value={formData.currentPassword}
            onChangeText={(v) => handleChange('currentPassword', v)}
            placeholder="Enter current password"
            secureTextEntry={!showCurrentPassword}
            error={errors.currentPassword}
            rightElement={
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Icon
                  name={showCurrentPassword ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            }
          />

          {/* New Password */}
          <View style={styles.inputGroup}>
            <FormInput
              label="New Password"
              required
              value={formData.newPassword}
              onChangeText={(v) => handleChange('newPassword', v)}
              placeholder="Enter new password"
              secureTextEntry={!showNewPassword}
              error={errors.newPassword}
              containerStyle={{ marginBottom: errors.newPassword ? spacing.sm : 0 }}
              rightElement={
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Icon
                    name={showNewPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              }
            />

            {!errors.newPassword && (
              <AppText style={styles.hint}>
                Must be at least 6 characters
              </AppText>
            )}
          </View>

          {/* Confirm Password */}
          <FormInput
            label="Confirm New Password"
            required
            value={formData.confirmPassword}
            onChangeText={(v) => handleChange('confirmPassword', v)}
            placeholder="Re-enter new password"
            secureTextEntry={!showConfirmPassword}
            error={errors.confirmPassword}
            rightElement={
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Icon
                  name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            }
          />

          {/* Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabled]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <AppText variant="button" style={styles.saveText}>
                Update Password
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
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.button,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.white,
  },
  card: {
    backgroundColor: colors.surface,
    marginTop: spacing.xxxl,
    borderTopLeftRadius: radius.bottomSheet,
    borderTopRightRadius: radius.bottomSheet,
    padding: spacing.xl,
    flex: 1,
  },
  sectionTitle: {
    color: colors.text,
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.sm,
    color: colors.text,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.input,
    paddingHorizontal: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: spacing.base,
    fontSize: 15,
    color: colors.text,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.base,
    borderRadius: radius.button,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveText: {
    color: colors.white,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default ChangePasswordScreen;


