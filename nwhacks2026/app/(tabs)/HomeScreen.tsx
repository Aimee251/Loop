import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, SafeAreaView, ScrollView, 
  TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, 
  Platform, ActivityIndicator, Dimensions, Alert 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from "expo-router"; 
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  interpolate,
  Extrapolation 
} from 'react-native-reanimated';

import { habitManager } from '@/models/HabitManager'; 
import { getMoodAdjustedTask } from '@/utils/moodAi';

// --- CONSTANTS ---
const COLORS = {
  background: '#F2F2F7', 
  textPrimary: '#1C1C1E',
  textSecondary: '#8E8E93',
  card1: '#DCE8FA', 
  card2: '#DEF5DB', 
  card3: '#FBE4E4',
  navBar: '#FFFFFF', 
  modalOverlay: 'rgba(0,0,0,0.5)', 
  primaryBtn: '#000000',
};

// Goal days is now user-provided (required)
const MIN_GOAL_DAYS = 7;
const MAX_GOAL_DAYS = 120;

// --- ANIMATED CARD COMPONENT ---
// We extract this to manage individual animations efficiently
const HabitCard = ({ 
  habit, 
  index, 
  aiInfo, 
  isExpanded, 
  onPress, 
  onDelete 
}) => {
  // 1. Define the animation driver (0 = collapsed, 1 = expanded)
  // We rely on the parent prop 'isExpanded' to trigger changes
  const animation = useSharedValue(0);

  useEffect(() => {
    // Smooth spring animation for natural movement
    animation.value = withSpring(isExpanded ? 1 : 0, {
      damping: 100,    // Controls "bounciness" (lower = more bounce)
      stiffness: 1000, // Controls speed
    });
  }, [isExpanded]);

  // 2. Interpolate styles based on animation value
  const animatedStyle = useAnimatedStyle(() => {
    // Calculated margin: collapsed = -120 (stack), expanded = 20 (breathing room)
    const marginTop = index === 0 
      ? withTiming(isExpanded ? 20 : 0) // First card just slides down a bit
      : interpolate(animation.value, [0, 1], [-130, 20]); // Others slide out from stack

    // Height change
    const height = interpolate(animation.value, [0, 1], [200, 300]);
    
    // Scale effect (pop up slightly when active)
    const scale = interpolate(animation.value, [0, 1], [0.95, 1]);

    return {
      marginTop,
      height,
      transform: [{ scale }],
      zIndex: isExpanded ? 100 : index, // Ensure active card is on top
    };
  });

  // Fade in content when expanded
  const contentStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(animation.value, [0, 0.5, 1], [0, 0, 1], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(animation.value, [0, 1], [20, 0]) }
      ]
    };
  });

  const cardColor = [COLORS.card1, COLORS.card2, COLORS.card3][index % 3];

  return (
    <Animated.View style={[styles.card, { backgroundColor: cardColor }, animatedStyle]}>
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => onPress(habit.id)} 
        style={styles.cardInner}
      >
        {/* HEADER (Always Visible) */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons 
              name={habit.phoneNumbers && habit.phoneNumbers.length > 0 ? "account-group" : "water-outline"} 
              size={28} color={COLORS.textPrimary} 
            />
            <Text style={styles.cardTitle}>{habit.action}</Text>
          </View>
          
          {isExpanded ? (
            <TouchableOpacity onPress={() => onDelete(habit.id)} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} style={{ opacity: 0.5 }}/>
          )}
        </View>

        {/* EXPANDED CONTENT */}
        <Animated.View style={[styles.cardBody, contentStyle]}>
          {aiInfo ? (
            <View>
              <Text style={styles.aiLabel}>ADJUSTED GOAL</Text>
              <Text style={styles.aiTask}>{aiInfo.modifiedTask}</Text>
              <Text style={styles.aiNote}>{aiInfo.researchNote}</Text>
            </View>
          ) : (
            <Text style={styles.loadingTextSmall}>Syncing with mood...</Text>
          )}
        </Animated.View>

      </TouchableOpacity>
    </Animated.View>
  );
};


// --- MAIN SCREEN ---
export default function MainScreen() {
  const { mood } = useLocalSearchParams(); 
  const currentMood = mood || 'calm'; 

  const [habits, setHabits] = useState([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState({}); 
  const [expandedCardId, setExpandedCardId] = useState(null);

  // Form State
  const [habitName, setHabitName] = useState('');
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Required goal duration input
  const [goalDaysInput, setGoalDaysInput] = useState('');
  const [optimalDaysLoading, setOptimalDaysLoading] = useState(false);
  const [optimalDaysWhy, setOptimalDaysWhy] = useState<string>('');
  const [optimalDaysRange, setOptimalDaysRange] = useState<[number, number] | null>(null);

  useEffect(() => {
    refreshHabits();
    if (currentMood) fetchAiForHabits(currentMood);
  }, [currentMood]);

  const refreshHabits = () => {
    const activeHabits = habitManager.getActiveHabits();
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

  const parseGoalDays = (): number | null => {
    const n = Number(goalDaysInput);
    if (!Number.isFinite(n)) return null;
    const days = Math.round(n);
    if (days < MIN_GOAL_DAYS || days > MAX_GOAL_DAYS) return null;
    return days;
  };

  const handleGenerateOptimalDays = async () => {
    if (!habitName.trim()) {
      Alert.alert('Required', 'Enter a habit name first.');
      return;
    }

    try {
      setOptimalDaysLoading(true);
      // Duration is computed habit-first (not mood-based). Use a fixed tag.
      const res = await getMoodAdjustedTask({ moodTag: 'neutral', habitAction: habitName.trim() });
      setGoalDaysInput(String(res.recommendedDays));
      setOptimalDaysWhy(res.daysWhy);
      setOptimalDaysRange(res.recommendedRange);
    } catch (e) {
      console.error(e);
      Alert.alert('Could not generate', 'Something went wrong generating an optimal duration.');
    } finally {
      setOptimalDaysLoading(false);
    }
  };

  const handleCreateHabit = () => {
    if (!habitName.trim()) return Alert.alert("Required", "Enter a name");

    const goalDays = parseGoalDays();
    if (!goalDays) {
      return Alert.alert(
        'Required',
        `Enter a duration between ${MIN_GOAL_DAYS} and ${MAX_GOAL_DAYS} days (or tap “Generate Optimal”).`
      );
    }

    if (isGroupMode) {
       if (!phoneNumber.trim()) return Alert.alert('Required', "Enter your friend's phone number");
       habitManager.createGroupHabit(habitName.trim(), goalDays, [phoneNumber.trim()]);
    } else {
       habitManager.createSoloHabit(habitName.trim(), goalDays);
    }
    setHabitName('');
    setPhoneNumber('');
    setIsGroupMode(false);
    setGoalDaysInput('');
    setOptimalDaysWhy('');
    setOptimalDaysRange(null);
    setAddModalVisible(false);
    refreshHabits();
    if (currentMood) fetchAiForHabits(currentMood); 
  };

  const handleDelete = (id) => {
    habitManager.deleteHabit(id);
    refreshHabits();
  };

  const toggleCard = (id) => {
    setExpandedCardId(prev => prev === id ? null : id);
  };

  const closeAddModal = () => {
    setAddModalVisible(false);
    setHabitName('');
    setPhoneNumber('');
    setIsGroupMode(false);
    setGoalDaysInput('');
    setOptimalDaysWhy('');
    setOptimalDaysRange(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        contentOffset={{ x: 0, y: -20 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingSub}>Loop</Text>
            <Text style={styles.dateText}>Your Habit Porgress</Text>
          </View>
            <TouchableOpacity
              style={styles.moodBadge}
              activeOpacity={0.8}
              onPress={() => router.push("/MoodScreen")}
            >
              <Text style={styles.moodText}>
                {typeof currentMood === 'string'
                  ? currentMood.charAt(0).toUpperCase() + currentMood.slice(1)
                  : ''}
              </Text>
            </TouchableOpacity>
        </View>

        {/* AI Loading */}
        {aiLoading && (
           <View style={styles.loadingRow}>
             <ActivityIndicator size="small" color={COLORS.textPrimary} />
             <Text style={styles.loadingText}>Syncing Mood...</Text>
           </View>
        )}

        {/* --- STACKED CARD LIST --- */}
        <View style={styles.cardStackContainer}>
          {habits.length === 0 ? (
             <View style={styles.emptyState}>
                <Text style={{color: COLORS.textSecondary}}>No cards found.</Text>
             </View>
          ) : (
            habits.map((habit, index) => (
              <HabitCard 
                key={habit.id}
                habit={habit}
                index={index}
                aiInfo={aiData[habit.id]}
                isExpanded={expandedCardId === habit.id}
                onPress={toggleCard}
                onDelete={handleDelete}
              />
            ))
          )}
        </View>
        
        <View style={{ height: 120 }} /> 
      </ScrollView>

      {/* --- ADD MODAL --- */}
      <Modal visible={addModalVisible} animationType="slide" transparent={true} onRequestClose={closeAddModal}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.addModalContent}>
            <View style={styles.modalHeaderRow}>
               <Text style={styles.modalTitle}>New Habit</Text>
               <TouchableOpacity onPress={closeAddModal}>
                 <Ionicons name="close-circle" size={30} color={COLORS.textSecondary} />
               </TouchableOpacity>
            </View>

            <TextInput 
              style={styles.input} placeholder="Habit Name" 
              value={habitName}
              onChangeText={(t) => {
                setHabitName(t);
                // If the habit name changes, reset the "optimal" explanation so it doesn't mismatch.
                setOptimalDaysWhy('');
                setOptimalDaysRange(null);
              }}
            />

            {/* Duration (required) */}
            <View style={styles.durationRow}>
              <TextInput
                style={[styles.input, styles.durationInput]}
                placeholder={`Duration (${MIN_GOAL_DAYS}-${MAX_GOAL_DAYS} days)`}
                value={goalDaysInput}
                onChangeText={(t) => {
                  // Allow only digits
                  const cleaned = t.replace(/[^0-9]/g, '');
                  setGoalDaysInput(cleaned);
                }}
                keyboardType="number-pad"
              />

              <TouchableOpacity
                style={[styles.optimalBtn, (!habitName.trim() || optimalDaysLoading) && styles.optimalBtnDisabled]}
                disabled={!habitName.trim() || optimalDaysLoading}
                onPress={handleGenerateOptimalDays}
              >
                {optimalDaysLoading ? (
                  <ActivityIndicator size="small" color={COLORS.textPrimary} />
                ) : (
                  <Text style={styles.optimalBtnText}>Generate Optimal</Text>
                )}
              </TouchableOpacity>
            </View>

            {!!optimalDaysWhy && (
              <View style={styles.optimalExplainBox}>
                <Text style={styles.optimalExplainTitle}>
                  Why {goalDaysInput || 'this'} days?
                  {optimalDaysRange ? ` (range: ${optimalDaysRange[0]}–${optimalDaysRange[1]})` : ''}
                </Text>
                <Text style={styles.optimalExplainText}>{optimalDaysWhy}</Text>
              </View>
            )}

            <View style={styles.modeRow}>
               <TouchableOpacity onPress={() => setIsGroupMode(false)} style={[styles.modeBtn, !isGroupMode && styles.modeBtnActive]}>
                 <Text style={{fontWeight: !isGroupMode ? '700' : '400'}}>Solo</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => setIsGroupMode(true)} style={[styles.modeBtn, isGroupMode && styles.modeBtnActive]}>
                 <Text style={{fontWeight: isGroupMode ? '700' : '400'}}>Group</Text>
               </TouchableOpacity>
            </View>

            {isGroupMode && (
              <TextInput 
                style={styles.input} placeholder="Friend's Phone #" 
                value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad"
              />
            )}

            <TouchableOpacity style={styles.createBtn} onPress={handleCreateHabit}>
               <Text style={{color: '#FFF', fontWeight: 'bold'}}>Add Habit</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/')}>
          <Ionicons name="wallet" size={28} color={COLORS.textPrimary}/>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
          <Ionicons name="add" size={32} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
           <Ionicons name="stats-chart" size={24} color="#C5C5C7"/>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 20, paddingTop: 10 },
  
  header: { marginBottom: 30, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetingSub: { fontSize: 34, fontWeight: '800', color: COLORS.textPrimary },
  dateText: { fontSize: 16, color: COLORS.textSecondary, fontWeight: '500', marginTop: -5 },
  moodBadge: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 30, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 2 },
  moodText: { fontWeight: '700', color: COLORS.textPrimary, fontSize: 14 },
  
  loadingRow: { flexDirection: 'row', gap: 10, marginBottom: 20, justifyContent: 'center' },
  loadingText: { color: COLORS.textSecondary, fontSize: 12 },

  // --- STACK STYLES ---
  cardStackContainer: { paddingTop: 10 },
  card: { 
    borderRadius: 20, 
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 }, 
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden'
  },
  cardInner: { padding: 24, flex: 1 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  iconBtn: { padding: 4 },

  cardBody: { justifyContent: 'center' },
  aiLabel: { fontSize: 11, fontWeight: '900', color: COLORS.textSecondary, marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' },
  aiTask: { fontSize: 26, fontWeight: '400', color: COLORS.textPrimary, marginBottom: 12, lineHeight: 32 },
  aiNote: { fontSize: 14, color: COLORS.textPrimary, opacity: 0.6, lineHeight: 20, fontStyle: 'italic' },
  loadingTextSmall: { fontSize: 14, color: COLORS.textSecondary, fontStyle: 'italic' },
  
  emptyState: { alignItems: 'center', padding: 40 },

  // Modal & Nav
  modalOverlay: { flex: 1, backgroundColor: COLORS.modalOverlay, justifyContent: 'flex-end' },
  addModalContent: { backgroundColor: '#F2F2F7', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  input: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 15, fontSize: 16 },

  // Duration input + generator
  durationRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 },
  durationInput: { flex: 1, marginBottom: 0 },
  optimalBtn: { 
    paddingHorizontal: 14,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optimalBtnDisabled: { opacity: 0.5 },
  optimalBtnText: { fontWeight: '700', color: COLORS.textPrimary, fontSize: 12 },
  optimalExplainBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  optimalExplainTitle: { fontSize: 12, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  optimalExplainText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },

  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  modeBtn: { flex: 1, padding: 12, backgroundColor: '#E5E5EA', borderRadius: 10, alignItems: 'center' },
  modeBtnActive: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#C7C7CC' },
  createBtn: { backgroundColor: COLORS.primaryBtn, padding: 18, borderRadius: 14, alignItems: 'center' },

  bottomNav: { position: 'absolute', bottom: 30, left: 20, right: 20, height: 70, backgroundColor: COLORS.navBar, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderRadius: 35, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  addButton: { backgroundColor: '#1C1C1E', width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', top: -10 },
  navItem: { padding: 10 },
});