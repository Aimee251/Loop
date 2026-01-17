/**
 * HabitManager handles all CRUD operations for habits.
 * This is a service class that manages habit storage and operations.
 */

import { Habit, HabitData } from './Habit';

export class HabitManager {
  private habits: Map<string, Habit> = new Map();
  private storageKey = 'habits_storage';

  constructor() {
    // Initialize - in the future, this could load from AsyncStorage or a backend
    this.loadHabits();
  }

  /**
   * Create a new habit
   */
  createHabit(action: string, goalDays: number, daysPerWeek : number): Habit {
    const habit = new Habit(action, goalDays, daysPerWeek);
    this.habits.set(habit.id, habit);
    this.saveHabits();
    return habit;
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
  updateHabit(
    id: string,
    action?: string,
    goalDays?: number
  ): Habit | undefined {
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
