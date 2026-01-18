/**
 * Represents a habit that a user is tracking.
 * Two types supported:
 * 1. SoloHabit - Individual habit tracking
 * 2. GroupHabit - Habit with multiple phone numbers for group accountability
 * 
 * See SoloHabit.ts and GroupHabit.ts for the concrete implementations.
 */

import { SoloHabit } from './SoloHabit';
import { GroupHabit } from './GroupHabit';

export interface HabitData {
  id: string;
  action: string;
  goalDays: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  currentStreak: number;
  completedDays: string[]; // Array of dates (YYYY-MM-DD) when habit was completed
  daysPerWeekDone: number; // Number of days completed in the current week
  isActive: boolean;
  phoneNumbers?: string[]; // For GroupHabit only
}

export abstract class Habit {
  id: string;
  action: string;
  goalDays: number;
  createdAt: Date;
  updatedAt: Date;
  currentStreak: number;
  completedDays: string[];
  daysPerWeekDone: number;
  isActive: boolean;

  constructor(
    action: string,
    goalDays: number,
    completedDays: string[] = [],
    id?: string,
    createdAt?: Date,
    updatedAt?: Date,
    currentStreak: number = 0,
    daysPerWeekDone: number = 0,
    isActive: boolean = true
  ) {
    this.id = id || this.generateId();
    this.action = action;
    this.goalDays = goalDays;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
    this.currentStreak = currentStreak;
    this.completedDays = completedDays;
    this.daysPerWeekDone = daysPerWeekDone;
    this.isActive = isActive;
  }

  /**
   * Generate a unique ID for the habit
   */
  private generateId(): string {
    return `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Mark today as completed for this habit
   */
  markAsCompleted(): void {
    const today = this.getTodayString();
    if (!this.completedDays.includes(today)) {
      this.completedDays.push(today);
      this.updateWeeklyProgress();
      this.updateStreak();
      this.updatedAt = new Date();
    }
  }

  /**
   * Unmark today as completed
   */
  unmarkAsCompleted(): void {
    const today = this.getTodayString();
    this.completedDays = this.completedDays.filter((day) => day !== today);
    this.updateWeeklyProgress();
    this.updateStreak();
    this.updatedAt = new Date();
  }

  /**
   * Check if the habit was completed today
   */
  isCompletedToday(): boolean {
    return this.completedDays.includes(this.getTodayString());
  }

  /**
   * Update the current streak based on completed days
   */
  private updateStreak(): void {
    if (this.completedDays.length === 0) {
      this.currentStreak = 0;
      return;
    }

    const sortedDays = [...this.completedDays].sort();
    let streak = 1;
    const today = this.getTodayString();
    let expectedDate = new Date(today);

    for (let i = sortedDays.length - 1; i >= 0; i--) {
      const currentDay = sortedDays[i];
      const currentDate = new Date(currentDay);

      if (
        i === sortedDays.length - 1 &&
        currentDate.toISOString().split("T")[0] === today
      ) {
        streak = 1;
        expectedDate = new Date(currentDate);
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        const expectedDateStr = expectedDate.toISOString().split("T")[0];
        if (currentDay === expectedDateStr) {
          streak++;
          expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    this.currentStreak = streak;
  }

  /**
   * Update weekly progress and adjust goalDays if week is incomplete
   */
  private updateWeeklyProgress(): void {
    // Get the start of current week (Monday)
    const today = new Date(this.getTodayString());
    const weekStart = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);

    // Count completions in current week
    let weekCompletions = 0;
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(weekStart);
      checkDate.setDate(checkDate.getDate() + i);
      const dateStr = checkDate.toISOString().split("T")[0];
      
      // Stop counting if we haven't reached that day yet
      if (checkDate > today) {
        break;
      }
      
      if (this.completedDays.includes(dateStr)) {
        weekCompletions++;
      }
    }

    // If it's the end of the week and we didn't meet the goal, add shortfall to goalDays
    const daysIntoWeek = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    this.daysPerWeekDone = weekCompletions;
  }

  /**
   * Check if goal is reached
   */
  isGoalReached(): boolean {
    return this.completedDays.length >= this.goalDays;
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    return Math.min((this.completedDays.length / this.goalDays) * 100, 100);
  }

  /**
   * Edit the habit
   */
  edit(action?: string, goalDays?: number): void {
    if (action !== undefined) {
      this.action = action;
    }
    if (goalDays !== undefined && goalDays > 0) {
      this.goalDays = goalDays;
    }
    this.updatedAt = new Date();
  }

  /**
   * Get the current date as YYYY-MM-DD string
   */
  private getTodayString(): string {
    return new Date().toISOString().split("T")[0];
  }

  /**
   * Create a Habit instance from plain object
   */
  static fromJSON(data: HabitData): Habit {
    if (data.phoneNumbers && data.phoneNumbers.length > 0) {
      return GroupHabit.fromJSON(data);
    }
    return SoloHabit.fromJSON(data);
  }
}

