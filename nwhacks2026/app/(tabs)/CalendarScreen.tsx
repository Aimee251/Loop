import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';
import { useLocalSearchParams, router } from 'expo-router';

// Import your backend logic
import { habitManager } from '../../models/HabitManager';
import { Habit } from '../../models/Habit';

// Define the new color palette from the image
const COLORS = {
  white: '#FFFFFF',
  lightest: '#E8F0F0', // Very Light Grey/Blue
  lightBlue: '#D0E2F0', // Light Blue
  accentBlue: '#C2DAF8', // Bright Accent Blue
  mediumBlue: '#B0C8E0', // Medium Blue
  lightGrey: '#CECFC9', // Light Grey
  mediumGrey: '#95969B', // Medium Grey
  charcoal: '#484848', // Dark Charcoal
  darkCharcoal: '#2D4150', // Slightly darker for calendar days
};

export default function CalendarScreen() {
  const { habitId } = useLocalSearchParams();
  const [habit, setHabit] = useState<Habit | undefined>(undefined);
  const [markedDates, setMarkedDates] = useState<any>({});
  
  // 1. Load Habit Data
  useEffect(() => {
    loadHabitData();
  }, [habitId]);

  const loadHabitData = () => {
    const data = habitManager.getHabit(habitId as string);
    if (data) {
      setHabit(data);
      updateCalendarMarks(data);
    }
  };

  // 2. Transform backend 'completedDays' into Calendar format
  const updateCalendarMarks = (currentHabit: Habit) => {
    const marks: any = {};
    
    // Mark completed days
    currentHabit.completedDays.forEach((date) => {
      marks[date] = {
        selected: true,
        selectedColor: COLORS.lightGrey, // Use light grey for past completions
        selectedTextColor: COLORS.charcoal,
      };
    });

    // Mark today (highlighted with accent blue)
    const today = new Date().toISOString().split('T')[0];
    marks[today] = {
      selected: true,
      selectedColor: COLORS.accentBlue, // Use the bright accent blue for today
      selectedTextColor: COLORS.white,
    };

    setMarkedDates(marks);
  };

  // 3. Handle Calendar Day Press
  const onDayPress = (day: DateData) => {
    if (!habit) return;

    // Logic: Toggle completion for the selected date
    console.log('Selected day', day.dateString);
    // Refresh UI
    loadHabitData();
  };

  // 4. Handle Mark Completion Button
  const handleMarkCompletion = () => {
    if (!habit) return;

    const today = new Date().toISOString().split('T')[0];
    
    // Toggle completion
    if (habit.isCompletedToday()) {
      habitManager.unmarkHabitAsCompleted(habit.id);
    } else {
      habitManager.markHabitAsCompleted(habit.id);
    }

    // Reload data to update all stats live
    loadHabitData();
  };

  const handleBack = () => {
    router.back();
  };

  if (!habit) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerContent}>
        <Text>Loading habit...</Text>
      </View>
    </SafeAreaView>
  );

  const progressPercentage = (habit.completedDays.length / habit.goalDays) * 100;
  const isCompletedToday = habit.isCompletedToday();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* --- Header with Back and Completion Button --- */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" color={COLORS.charcoal} size={24} />
          </TouchableOpacity>
          
          {/* Completion Button */}
          <TouchableOpacity 
            onPress={handleMarkCompletion}
            style={[
              styles.completionButton,
              isCompletedToday && styles.completionButtonActive
            ]}
          >
            <Ionicons 
              name={isCompletedToday ? "checkmark-done" : "checkmark"} 
              color={isCompletedToday ? COLORS.white : COLORS.accentBlue} 
              size={24} 
            />
          </TouchableOpacity>
        </View>

        {/* --- Summary Widget --- */}
        <View style={styles.summaryWidget}>
          <Text style={styles.habitName}>{habit.action}</Text>
          <Text style={styles.summaryText}>
            {habit.completedDays.length}/{habit.goalDays} days completed                                    {Math.min(progressPercentage, 100).toFixed(0)}%
          </Text>
          
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(progressPercentage, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            Goal: {habit.goalDays} days  |  Current Streak: {habit.currentStreak} days 
          </Text>
        </View>

        {/* --- Calendar Widget --- */}
        <View style={styles.calendarWidget}>
          <Text style={styles.widgetTitle}>Calendar</Text>
          <View style={styles.calendarContainer}>
            <Calendar
              current={new Date().toISOString().split('T')[0]}
              onDayPress={onDayPress}
              markedDates={markedDates}
              
              theme={{
                backgroundColor: COLORS.white,
                calendarBackground: COLORS.white,
                textSectionTitleColor: COLORS.charcoal,
                selectedDayBackgroundColor: COLORS.accentBlue, // Highlighted day
                selectedDayTextColor: COLORS.white,
                todayTextColor: COLORS.accentBlue, // Today's text color
                dayTextColor: COLORS.darkCharcoal, // Normal day text color
                textDisabledColor: COLORS.lightGrey,
                arrowColor: COLORS.charcoal,
                monthTextColor: COLORS.charcoal,
                textDayFontWeight: '400',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '500',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
            />
          </View>
        </View>

        {/* --- AI Chat Widget (Empty for now) --- */}
        <View style={styles.aiChatWidget}>
          <Text style={styles.widgetTitle}>AI Assistant</Text>
          <View style={styles.emptyPlaceholder}>
            <Text style={styles.placeholderText}>Coming soon...</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightest, // Use the very light grey/blue for the background
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header Row with Back and Completion Buttons
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  // Back Button
  backButton: {
    padding: 8,
  },

  // Completion Button
  completionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.accentBlue,
    shadowColor: COLORS.mediumGrey,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completionButtonActive: {
    backgroundColor: COLORS.accentBlue,
    borderColor: COLORS.accentBlue,
  },

  // Summary Widget Styles
  summaryWidget: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    shadowColor: COLORS.mediumGrey, // Softer shadow color
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.lightBlue, // Add a light blue border for a frosty look
  },
  habitName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.charcoal,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.mediumGrey,
    fontWeight: '500',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: COLORS.lightBlue, // Light blue track for the progress bar
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.accentBlue, // Bright accent blue for the progress fill
    borderRadius: 6,
  },
  progressLabel: {
    fontSize: 13,
    color: COLORS.mediumGrey,
    fontWeight: '500',
  },

  // Calendar Widget Styles
  calendarWidget: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    shadowColor: COLORS.mediumGrey,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.lightBlue, // Light blue border
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.charcoal,
    marginBottom: 16,
  },
  calendarContainer: {
    borderRadius: 10,
    overflow: 'hidden',
  },

  // AI Chat Widget Styles
  aiChatWidget: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    shadowColor: COLORS.mediumGrey,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    minHeight: 200,
    borderWidth: 1,
    borderColor: COLORS.lightBlue, // Light blue border
  },
  emptyPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 150,
    backgroundColor: COLORS.lightest, // Use the lightest color for the placeholder background
    borderRadius: 10,
  },
  placeholderText: {
    fontSize: 14,
    color: COLORS.mediumGrey,
    fontStyle: 'italic',
  },
});