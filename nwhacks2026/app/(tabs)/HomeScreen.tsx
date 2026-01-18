import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, SafeAreaView, ScrollView, 
  TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, 
  Platform, Alert, ActivityIndicator, Dimensions 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from "expo-router"; 

// --- UPDATED IMPORT ---
// We import the 'habitManager' instance, not just the class
import { habitManager } from '@/models/HabitManager'; 
import { getMoodAdjustedTask } from '@/utils/moodAi';

// --- CONSTANTS ---
const COLORS = {
  background: '#FDFBF7', textPrimary: '#4A4A4A', textSecondary: '#8E8E93',
  card1: '#E6EEFA', card2: '#E3F2E1', card3: '#FAE6E6',
  navBar: '#FFFFFF', modalOverlay: 'rgba(0,0,0,0.3)', primaryBtn: '#4A4A4A',
};

const DEFAULT_GOAL_DAYS = 66; // Standard habit formation time

const { height } = Dimensions.get('window');

export default function MainScreen() {
  // 1. Get Mood from URL Params
  const { mood } = useLocalSearchParams(); 
  const currentMood = mood || 'calm'; // Default fallback

  const [habits, setHabits] = useState([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState({}); 

  // Form State
  const [habitName, setHabitName] = useState('');
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    refreshHabits();
    if (currentMood) fetchAiForHabits(currentMood);
  }, [currentMood]);

  // --- FIXED: Use the instance method and spread the result ---
  const refreshHabits = () => {
    const activeHabits = habitManager.getActiveHabits();
    // We use [...array] to create a new reference so React knows to re-render
    setHabits([...activeHabits]);
  };

  const fetchAiForHabits = async (moodTag) => {
    setAiLoading(true);
    const currentHabits = habitManager.getActiveHabits();
    const newAiData = {};

    await Promise.all(currentHabits.map(async (h) => {
      try {
        const res = await getMoodAdjustedTask({ moodTag, habitAction: h.action });
        newAiData[h.id] = res;
      } catch (e) { console.error(e); }
    }));

    setAiData(newAiData);
    setAiLoading(false);
  };

  const handleCreateHabit = () => {
    if (!habitName.trim()) return Alert.alert("Required", "Enter a name");
    
    // --- FIXED: Pass correct arguments to Manager ---
    if (isGroupMode) {
        // Group Habit requires: action, goalDays, phoneNumbers (Array)
        habitManager.createGroupHabit(habitName, DEFAULT_GOAL_DAYS, [phoneNumber]);
    } else {
        // Solo Habit requires: action, goalDays
        habitManager.createSoloHabit(habitName, DEFAULT_GOAL_DAYS);
    }

    // Reset Form
    setHabitName(''); 
    setPhoneNumber(''); 
    setIsGroupMode(false);
    setAddModalVisible(false);
    
    // Refresh UI
    refreshHabits();
    
    // Fetch AI for the new list
    if (currentMood) fetchAiForHabits(currentMood); 
  };

  const handleDelete = (id) => {
    habitManager.deleteHabit(id);
    refreshHabits();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greetingSub}>Today's Plan</Text>
          <View style={styles.moodBadge}>
             <Text style={styles.moodText}>Mood: {typeof currentMood === 'string' ? currentMood.charAt(0).toUpperCase() + currentMood.slice(1) : ''}</Text>
          </View>
        </View>

        {/* AI Loading Indicator */}
        {aiLoading && (
           <View style={styles.loadingRow}>
             <ActivityIndicator size="small" color={COLORS.textPrimary} />
             <Text style={styles.loadingText}>Tailoring habits to your mood...</Text>
           </View>
        )}

        {/* Habit List */}
        {habits.length === 0 ? (
             <View style={{padding: 20, alignItems: 'center'}}>
                <Text style={{color: COLORS.textSecondary}}>No habits yet. Tap + to start.</Text>
             </View>
        ) : (
            habits.map((habit, index) => {
            const cardColor = [COLORS.card1, COLORS.card2, COLORS.card3][index % 3];
            const aiInfo = aiData[habit.id];

            return (
                <TouchableOpacity 
                  key={habit.id} 
                  onPress={() => router.push({
                    pathname: '/calendar',
                    params: { habitId: habit.id }
                  })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{habit.action}</Text>
                        <TouchableOpacity onPress={() => handleDelete(habit.id)}>
                            <Text style={styles.actionText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.cardBody}>
                        <View style={styles.circleLogo}>
                            <MaterialCommunityIcons 
                            // Determine icon based on if phoneNumbers exist (GroupHabit)
                            name={habit.phoneNumbers && habit.phoneNumbers.length > 0 ? "account-group" : "water-outline"} 
                            size={32} color={COLORS.textPrimary} 
                            />
                        </View>

                        {aiInfo ? (
                        <View style={styles.aiContainer}>
                            <Text style={styles.aiLabel}>Adjusted Goal:</Text>
                            <Text style={styles.aiTask}>{aiInfo.modifiedTask}</Text>
                            <Text style={styles.aiNote}>{aiInfo.researchNote}</Text>
                        </View>
                        ) : (
                            <Text style={styles.loadingTextSmall}>Loading adjustment...</Text>
                        )}
                    </View>
                  </View>
                </TouchableOpacity>
            );
            })
        )}
        
        <View style={{ height: 100 }} /> 
      </ScrollView>

      {/* Add Habit Modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent={true} onRequestClose={() => setAddModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.addModalContent}>
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                 <Text style={styles.modalTitle}>New Habit</Text>
              </TouchableOpacity>
            </View>

            <TextInput 
              style={styles.input} placeholder="Habit Name" 
              value={habitName} onChangeText={setHabitName}
            />

            <View style={styles.modeRow}>
               <TouchableOpacity onPress={() => setIsGroupMode(false)} style={[styles.modeBtn, !isGroupMode && styles.modeBtnActive]}>
                 <Text>Me Mode</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => setIsGroupMode(true)} style={[styles.modeBtn, isGroupMode && styles.modeBtnActive]}>
                 <Text>We Mode</Text>
               </TouchableOpacity>
            </View>

            {isGroupMode && (
              <TextInput 
                style={styles.input} placeholder="Friend's Phone #" 
                value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad"
              />
            )}

            <TouchableOpacity style={styles.createBtn} onPress={handleCreateHabit}>
               <Text style={{color: '#FFF', fontWeight: 'bold'}}>Create Habit</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/')}>
          <Ionicons name="home" size={28} color={COLORS.textPrimary}/>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
          <Ionicons name="add" size={32} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
           <View style={styles.placeholderIcon}/>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 24 },
  header: { marginBottom: 20, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetingSub: { fontSize: 28, fontWeight: '300', color: COLORS.textPrimary },
  moodBadge: { backgroundColor: '#E0E0E0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  moodText: { fontWeight: '600', color: COLORS.textPrimary, fontSize: 14 },
  loadingRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  loadingText: { color: COLORS.textSecondary, fontStyle: 'italic' },
  card: { borderRadius: 24, padding: 20, marginBottom: 20, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontSize: 20, fontWeight: '600', color: COLORS.textPrimary },
  actionText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  cardBody: { alignItems: 'center', marginVertical: 10 },
  circleLogo: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  aiContainer: { alignItems: 'center', paddingHorizontal: 10 },
  aiLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4, textTransform: 'uppercase' },
  aiTask: { fontSize: 18, fontWeight: '600', textAlign: 'center', color: COLORS.textPrimary, marginBottom: 5 },
  aiNote: { fontSize: 12, color: COLORS.textPrimary, textAlign: 'center', opacity: 0.7, fontStyle: 'italic' },
  loadingTextSmall: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: COLORS.modalOverlay, justifyContent: 'flex-end' },
  addModalContent: { backgroundColor: '#EBEBEB', padding: 24, borderTopLeftRadius: 30, borderTopRightRadius: 30, minHeight: height * 0.5 },
  modalTitle: { fontSize: 22, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 10 },
  input: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 20 },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  modeBtn: { flex: 1, padding: 15, backgroundColor: '#FFF', borderRadius: 12, alignItems: 'center' },
  modeBtnActive: { borderWidth: 2, borderColor: '#A0A0A0' },
  createBtn: { backgroundColor: COLORS.primaryBtn, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  bottomNav: { position: 'absolute', bottom: 0, width: '100%', height: 90, backgroundColor: COLORS.navBar, flexDirection: 'row', justifyContent: 'space-around', paddingTop: 15, borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 10 },
  addButton: { backgroundColor: '#D1D5DB', width: 55, height: 55, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: -25, elevation: 5 },
  navItem: { padding: 10 },
  placeholderIcon: { width: 24, height: 24, backgroundColor: '#E5E7EB', borderRadius: 6 },
});