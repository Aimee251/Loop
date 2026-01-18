/**
 * HabitManager handles all CRUD operations for habits.
 * This is a service class that manages both SoloHabit and GroupHabit storage and operations.
 *
 * Group Habit rule (deadline-based):
 *  - Members mark themselves completed for a given day.
 *  - A day is only "completed" for the group if EVERY member completed it.
 *  - When the day ends, if ANY member did NOT complete, the whole group FAILS that day.
 *
 * NOTE: HabitManager does not automatically know when a day ends.
 * In React Native, you typically call `finalizeGroupHabitsForDay(yesterday)`
 * when the app opens / returns to foreground.
 */

import { Habit } from './Habit';
import { SoloHabit } from './SoloHabit';
import { GroupHabit } from './GroupHabit';

export class HabitManager {
  private habits: Map<string, Habit> = new Map();
  private storageKey = 'habits_storage';
  private readonly MAX_HABITS = 3;

  constructor() {
    // Initialize - in the future, this could load from AsyncStorage or a backend
    this.loadHabits();
  }

  /**
   * Check if maximum habit limit has been reached
   */
  private isAtMaxHabits(): boolean {
    const activeHabits = this.getActiveHabits();
    return activeHabits.length >= this.MAX_HABITS;
  }

  /**
   * Get the number of active habits
   */
  getActiveHabitCount(): number {
    return this.getActiveHabits().length;
  }

  /**
   * Get the maximum allowed habits
   */
  getMaxHabits(): number {
    return this.MAX_HABITS;
  }

  /**
   * Create a new solo habit (individual tracking)
   */
  createSoloHabit(action: string, goalDays: number): SoloHabit | null {
    if (this.isAtMaxHabits()) {
      console.warn(`Cannot create habit. Maximum of ${this.MAX_HABITS} habits allowed.`);
      return null;
    }
    const habit = new SoloHabit(action, goalDays);
    this.habits.set(habit.id, habit);
    this.saveHabits();
    return habit;
  }

  /**
   * Create a new group habit (with multiple phone numbers)
   */
  createGroupHabit(action: string, goalDays: number, phoneNumbers: string[] = []): GroupHabit | null {
    if (this.isAtMaxHabits()) {
      console.warn(`Cannot create habit. Maximum of ${this.MAX_HABITS} habits allowed.`);
      return null;
    }
    const habit = new GroupHabit(action, goalDays, phoneNumbers);
    this.habits.set(habit.id, habit);
    this.saveHabits();
    return habit;
  }

  /**
   * Join an existing group habit using its invite code (groupId).
   * Returns the updated GroupHabit if found.
   */
  joinGroupHabitByCode(groupCode: string, phoneNumber: string): GroupHabit | null {
    const groupHabit = Array.from(this.habits.values()).find(
      (h) => h instanceof GroupHabit && (h as GroupHabit).groupId === groupCode
    ) as GroupHabit | undefined;

    if (!groupHabit) return null;
    groupHabit.addPhoneNumber(phoneNumber);
    this.saveHabits();
    return groupHabit;
  }

  /**
   * Convenience: join a group habit by its habit id.
   */
  joinGroupHabitById(habitId: string, phoneNumber: string): GroupHabit | null {
    const habit = this.habits.get(habitId);
    if (!(habit instanceof GroupHabit)) return null;
    habit.addPhoneNumber(phoneNumber);
    this.saveHabits();
    return habit;
  }

  /**
   * Mark a specific member as completed for a date (group habits only).
   * If dateStr is omitted, GroupHabit defaults to "today".
   *
   * dateStr format: "YYYY-MM-DD" (local day)
   */
  markGroupMemberCompleted(habitId: string, phoneNumber: string, dateStr?: string): GroupHabit | null {
    const habit = this.habits.get(habitId);
    if (!(habit instanceof GroupHabit)) return null;
    habit.markMemberCompleted(phoneNumber, dateStr);
    this.saveHabits();
    return habit;
  }

  /**
   * Enforce the deadline rule for a specific day (group habits only):
   * If ANY member did NOT complete by that day, the whole group fails that day.
   *
   * Call this when the app opens (typically for "yesterday"),
   * or from a scheduled job/backend.
   */
  finalizeGroupHabitsForDay(day: string): void {
    for (const habit of this.habits.values()) {
      if (habit instanceof GroupHabit && habit.isActive) {
        habit.finalizeDay(day);
      }
    }
    this.saveHabits();
  }

  /**
   * Create a new habit (legacy method - creates SoloHabit)
   */
  createHabit(action: string, goalDays: number): SoloHabit | null {
    return this.createSoloHabit(action, goalDays);
  }

  /**
   * Get a habit by ID
   */
  getHabit(id: string): Habit | undefined {
    return this.habits.get(id);
  }

  /**
   * Get all habits
   */
  getAllHabits(): Habit[] {
    return Array.from(this.habits.values());
  }

  /**
   * Get all active habits
   */
  getActiveHabits(): Habit[] {
    return this.getAllHabits().filter((habit) => habit.isActive);
  }

  /**
   * Update a habit
   */
  updateHabit(id: string, action?: string, goalDays?: number): Habit | undefined {
    const habit = this.habits.get(id);
    if (habit) {
      habit.edit(action, goalDays);
      this.saveHabits();
      return habit;
    }
    return undefined;
  }

  /**
   * Delete a habit (soft delete - marks as inactive)
   */
  deleteHabit(id: string): boolean {
    const habit = this.habits.get(id);
    if (habit) {
      habit.isActive = false;
      habit.updatedAt = new Date();
      this.saveHabits();
      return true;
    }
    return false;
  }

  /**
   * Permanently remove a habit
   */
  removeHabitPermanently(id: string): boolean {
    const result = this.habits.delete(id);
    if (result) {
      this.saveHabits();
    }
    return result;
  }

  /**
   * Mark a habit as completed for today
   * (Solo habits use this; group habits should use markGroupMemberCompleted)
   */
  markHabitAsCompleted(id: string): Habit | undefined {
    const habit = this.habits.get(id);
    if (habit) {
      habit.markAsCompleted();
      this.saveHabits();
      return habit;
    }
    return undefined;
  }

  /**
   * Unmark a habit as completed for today
   */
  unmarkHabitAsCompleted(id: string): Habit | undefined {
    const habit = this.habits.get(id);
    if (habit) {
      habit.unmarkAsCompleted();
      this.saveHabits();
      return habit;
    }
    return undefined;
  }

  /**
   * Save habits to storage (placeholder for AsyncStorage integration)
   */
  private saveHabits(): void {
    // TODO: Integrate with AsyncStorage or backend API
    // const habitsData = Array.from(this.habits.values()).map((h) => h.toJSON());
    // await AsyncStorage.setItem(this.storageKey, JSON.stringify(habitsData));
    console.log('Habits saved:', Array.from(this.habits.values()));
  }

  /**
   * Load habits from storage (placeholder for AsyncStorage integration)
   */
  private loadHabits(): void {
    // TODO: Integrate with AsyncStorage or backend API
    // const stored = await AsyncStorage.getItem(this.storageKey);
    // if (stored) {
    //   const habitsData: HabitData[] = JSON.parse(stored);
    //   habitsData.forEach((data) => {
    //     this.habits.set(data.id, Habit.fromJSON(data));
    //   });
    // }
    console.log('Habits loaded');
  }

  /**
   * Clear all habits
   */
  clearAll(): void {
    this.habits.clear();
    this.saveHabits();
  }

  /**
   * Get statistics for a habit
   */
  getHabitStats(id: string) {
    const habit = this.habits.get(id);
    if (!habit) return null;

    return {
      id: habit.id,
      action: habit.action,
      goalDays: habit.goalDays,
      progress: habit.getProgress(),
      isGoalReached: habit.isGoalReached(),
      totalCompletedDays: habit.completedDays.length,
      completedToday: habit.isCompletedToday(),
    };
  }
}

// Singleton instance
export const habitManager = new HabitManager();