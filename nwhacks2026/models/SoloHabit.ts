import {Habit, HabitData } from './Habit';

/**
 * SoloHabit - Individual habit tracking (no phone numbers)
 */
export class SoloHabit extends Habit {
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
    super(
      action,
      goalDays,
      completedDays,
      id,
      createdAt,
      updatedAt,
      currentStreak,
      daysPerWeekDone,
      isActive
    );
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
      daysPerWeekDone: this.daysPerWeekDone,
      isActive: this.isActive,
    };
  }

  /**
   * Create a SoloHabit instance from plain object
   */
  static fromJSON(data: HabitData): SoloHabit {
    return new SoloHabit(
      data.action,
      data.goalDays,
      data.completedDays,
      data.id,
      typeof data.createdAt === 'string' ? new Date(data.createdAt) : data.createdAt,
      typeof data.updatedAt === 'string' ? new Date(data.updatedAt) : data.updatedAt,
      data.currentStreak,
      data.daysPerWeekDone,
      data.isActive
    );
  }
}
