/**
 * Represents a habit that a user is tracking.
 * Each habit has an action (what to do) and a goal (number of days to complete).
 */

export interface HabitData {
  id: string;
  action: string;
  goalDays: number;
  createdAt: Date;
  updatedAt: Date;
  currentStreak: number;
  completedDays: string[]; // Array of dates (YYYY-MM-DD) when habit was completed
  isActive: boolean;
}

export class Habit {
  id: string;
  action: string;
  goalDays: number;
  createdAt: Date;
  updatedAt: Date;
  currentStreak: number;
  completedDays: string[];
  isActive: boolean;

  constructor(
    action: string,
    goalDays: number,
    id?: string,
    createdAt?: Date,
    updatedAt?: Date,
    currentStreak: number = 0,
    completedDays: string[] = [],
    isActive: boolean = true
  ) {
    this.id = id || this.generateId();
    this.action = action;
    this.goalDays = goalDays;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
    this.currentStreak = currentStreak;
    this.completedDays = completedDays;
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
   * Check if goal is reached
   */
  isGoalReached(): boolean {
    return this.currentStreak >= this.goalDays;
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    return Math.min((this.currentStreak / this.goalDays) * 100, 100);
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
   * Convert to plain object (useful for storage/serialization)
   */
  toJSON(): HabitData {
    return {
      id: this.id,
      action: this.action,
      goalDays: this.goalDays,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      currentStreak: this.currentStreak,
      completedDays: this.completedDays,
      isActive: this.isActive,
    };
  }

  /**
   * Create a Habit instance from plain object
   */
  static fromJSON(data: HabitData): Habit {
    return new Habit(
      data.action,
      data.goalDays,
      data.id,
      new Date(data.createdAt),
      new Date(data.updatedAt),
      data.currentStreak,
      data.completedDays,
      data.isActive
    );
  }
}
