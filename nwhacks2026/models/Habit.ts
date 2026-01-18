/**
 * Represents a habit that a user is tracking.
 * Two types supported:
 * 1. SoloHabit - Individual habit tracking
 * 2. GroupHabit - Habit with multiple phone numbers for group accountability
 */

export interface HabitData {
  /**
   * Explicit discriminator so a GroupHabit can exist even with 0 members.
   * (Otherwise an empty phoneNumbers array would look like a SoloHabit.)
   */
  type?: "solo" | "group";

  id: string;
  action: string;
  goalDays: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  currentStreak: number;
  completedDays: string[]; // Array of dates (YYYY-MM-DD) when habit was completed
  daysPerWeekDone: number; // Number of days completed in the current week
  isActive: boolean;

  // For GroupHabit only
  phoneNumbers?: string[];

  // GroupHabit extras
  groupId?: string; // Invite code / shared group identifier
  memberCompletedDays?: Record<string, string[]>; // phoneNumber -> completed days
  failedDays?: string[]; // dates the group failed (missed deadline)
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
    this.markDayAsCompleted(this.getTodayString());
  }

  /**
   * Unmark today as completed
   */
  unmarkAsCompleted(): void {
    this.unmarkDayAsCompleted(this.getTodayString());
  }

  /**
   * Mark a specific YYYY-MM-DD day as completed.
   * Needed for GroupHabit + "finalize yesterday" logic.
   */
  protected markDayAsCompleted(day: string): void {
    if (!this.completedDays.includes(day)) {
      this.completedDays.push(day);
      this.updateWeeklyProgress();
      this.updateStreak();
      this.updatedAt = new Date();
    }
  }

  /**
   * Unmark a specific YYYY-MM-DD day as completed.
   */
  protected unmarkDayAsCompleted(day: string): void {
    this.completedDays = this.completedDays.filter((d) => d !== day);
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
  protected updateStreak(): void {
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

      if (i === sortedDays.length - 1 && this.formatDateLocal(currentDate) === today) {
        streak = 1;
        expectedDate = new Date(currentDate.getTime());
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        const expectedDateStr = this.formatDateLocal(expectedDate);
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
   * Update weekly progress
   */
  protected updateWeeklyProgress(): void {
    const today = new Date(this.getTodayString());

    // Monday as week start
    const weekStart = new Date(today.getTime());
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);

    // Count completions in current week up to today
    let weekCompletions = 0;
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(weekStart.getTime());
      checkDate.setDate(checkDate.getDate() + i);

      if (checkDate > today) break;

      const dateStr = this.formatDateLocal(checkDate);
      if (this.completedDays.includes(dateStr)) weekCompletions++;
    }

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
    if (action !== undefined) this.action = action;
    if (goalDays !== undefined && goalDays > 0) this.goalDays = goalDays;
    this.updatedAt = new Date();
  }

  /**
   * Get current local date as YYYY-MM-DD
   * MUST be protected so GroupHabit can use it.
   */
  protected getTodayString(): string {
    return this.formatDateLocal(new Date());
  }

  /**
   * Format a Date as YYYY-MM-DD in the user's LOCAL timezone.
   */
  protected formatDateLocal(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
}