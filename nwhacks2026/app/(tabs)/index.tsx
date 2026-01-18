import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

// Define the Mood Data Types
type MoodKey = 'energetic' | 'tired' | 'anxious' | 'calm';

interface MoodOption {
  key: MoodKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

// Shared Colors
const COLORS = {
  background: '#FDFBF7',
  textPrimary: '#4A4A4A',
  textSecondary: '#8E8E93',
  card1: '#E6EEFA',
  card2: '#E3F2E1',
  card3: '#FAE6E6',
};

const MOOD_TAGS: MoodOption[] = [
  { key: 'energetic', label: 'Energetic', icon: 'flash', color: COLORS.card1 },
  { key: 'tired', label: 'Tired', icon: 'bed', color: COLORS.card2 },
  { key: 'anxious', label: 'Anxious', icon: 'pulse', color: COLORS.card3 },
  { key: 'calm', label: 'Calm', icon: 'leaf', color: '#E0F7FA' },
];

export default function MoodScreen() {
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    checkPreviousMood();
  }, []);

  const checkPreviousMood = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const savedDate = await AsyncStorage.getItem("mood_date");
      const savedMood = await AsyncStorage.getItem("user_mood");

      if (savedDate === today && savedMood) {
        router.replace({ pathname: "/HomeScreen", params: { mood: savedMood } });
      } else {
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
    }
  };

  const handleMoodSelect = async (selectedMood: MoodKey) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      await AsyncStorage.setItem("user_mood", selectedMood);
      await AsyncStorage.setItem("mood_date", today);

      router.replace({ pathname: "/HomeScreen", params: { mood: selectedMood } });
    } catch (e) {
      console.error("Failed to save mood", e);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.textPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.greeting}>Good Afternoon,</Text>
        <Text style={styles.name}>Aimee</Text>

        <View style={styles.spacer} />

        <Text style={styles.title}>How are you feeling?</Text>
        <Text style={styles.subtitle}>We'll adjust your habits to match your energy.</Text>

        <View style={styles.grid}>
          {MOOD_TAGS.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.card, { backgroundColor: m.color }]}
              onPress={() => handleMoodSelect(m.key)}
              activeOpacity={0.85}
            >
              <View style={styles.cardContent}>
                <Ionicons name={m.icon} size={40} color={COLORS.textPrimary} />
                <Text style={styles.label}>{m.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  content: {
    padding: 30,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '300',
    color: COLORS.textPrimary,
  },
  name: {
    fontSize: 34,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 40,
  },
  spacer: {
    height: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 30,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  card: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 10,
    textAlign: 'center',
  },
});