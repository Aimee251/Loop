import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { Calendar, DateData } from 'react-native-calendars';

// Import your backend logic
import { habitManager } from '../../models/HabitManager'; // Adjust path as needed
import { Habit } from '../../models/Habit';

interface HabitDetailScreenProps {
  habitId: string; // Passed from navigation
  onBack: () => void;
}

export const HabitDetailScreen: React.FC<HabitDetailScreenProps> = ({
  habitId,
  onBack,
}) => {
  const [habit, setHabit] = useState<Habit | undefined>(undefined);
  const [markedDates, setMarkedDates] = useState<any>({});
  
  // 1. Load Habit Data
  useEffect(() => {
    loadHabitData();
  }, [habitId]);

  const loadHabitData = () => {
    const data = habitManager.getHabit(habitId);
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
        selectedColor: '#E0E0E0', // Light grey for past completions
        selectedTextColor: 'black',
      };
    });

    // Mark today (highlighted red like in your image)
    const today = new Date().toISOString().split('T')[0];
    marks[today] = {
      selected: true,
      selectedColor: '#FF4B4B', // The red circle from your image
      selectedTextColor: 'white',
    };

    setMarkedDates(marks);
  };

  // 3. Handle Calendar Day Press
  const onDayPress = (day: DateData) => {
    if (!habit) return;

    // Logic: Toggle completion for the selected date
    // Note: Your backend currently supports marking 'today', 
    // but for a full calendar we might need to update the backend 
    // to allow toggling specific past dates. 
    // For now, we simulate a refresh.
    
    console.log('Selected day', day.dateString);
    // Refresh UI
    loadHabitData();
  };

  if (!habit) return <View style={styles.container}><Text>Loading...</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* --- Header Section --- */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ChevronLeft color="black" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{habit.action}</Text>
          <View style={{ width: 24 }} /> {/* Spacer for centering */}
        </View>

        {/* --- To-Do List Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>To-Do List</Text>
          
          {/* Static UI items to match your image */}
          <View style={styles.todoItem}>
            <View style={styles.checkbox} />
          </View>
          <View style={styles.todoItem}>
            <View style={styles.checkbox} />
          </View>

          {/* Add Button */}
          <TouchableOpacity style={styles.addButton}>
            <Plus color="black" size={24} />
          </TouchableOpacity>
        </View>

        {/* --- Summary Section --- */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>Short summary here</Text>
          <Text style={styles.statsText}>
            Streak: {habit.currentStreak} days {'\n'}
            Goal: {habit.goalDays} days
          </Text>
        </View>

        {/* --- Calendar Section --- */}
        <View style={styles.calendarContainer}>
          <Calendar
            // Current month (default)
            current={'2020-10-01'} // Hardcoded to match image, remove to use actual date
            
            onDayPress={onDayPress}
            markedDates={markedDates}
            
            // Styling to match the clean look
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#000000',
              selectedDayBackgroundColor: '#FF4B4B',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#FF4B4B',
              dayTextColor: '#2d4150',
              textDisabledColor: '#d9e1e8',
              arrowColor: 'black',
              monthTextColor: 'black',
              textDayFontWeight: '400',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '500',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
  },
  // Header Styles
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EAEaea', // The light grey pill background
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: 'black',
  },

  // Section Styles
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF', // Blue color like the image
    textDecorationLine: 'underline',
    marginBottom: 15,
  },
  todoItem: {
    backgroundColor: '#D9D9D9', // Grey bars
    height: 50,
    borderRadius: 12,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
  },
  checkbox: {
    width: 24,
    height: 24,
    backgroundColor: 'white', // White checkbox inside grey bar
    borderRadius: 6,
    opacity: 0.8,
  },
  addButton: {
    backgroundColor: '#D9D9D9',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },

  // Summary Styles
  summaryContainer: {
    height: 120,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 15,
    padding: 20,
    justifyContent: 'center',
    marginBottom: 30,
    backgroundColor: 'white',
  },
  summaryText: {
    fontSize: 16,
    color: 'black',
    marginBottom: 10,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },

  // Calendar Styles
  calendarContainer: {
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 15,
    padding: 10,
    backgroundColor: 'white',
    // Shadow for elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
});