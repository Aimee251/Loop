import { Habit, HabitData } from './Habit';

/**
 * GroupHabit - Habit with multiple phone numbers for group accountability
 */
export class GroupHabit extends Habit {
  phoneNumbers: string[];

  constructor(
    action: string,
    goalDays: number,
    phoneNumbers: string[] = [],
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
    this.phoneNumbers = phoneNumbers;
  }

  /**
   * Add a phone number to the group
   */
  addPhoneNumber(phoneNumber: string): void {
    if (!this.phoneNumbers.includes(phoneNumber)) {
      this.phoneNumbers.push(phoneNumber);
      this.updatedAt = new Date();
    }
  }

  /**
   * Remove a phone number from the group
   */
  removePhoneNumber(phoneNumber: string): void {
    this.phoneNumbers = this.phoneNumbers.filter((num) => num !== phoneNumber);
    this.updatedAt = new Date();
  }

  /**
   * Get all phone numbers in the group
   */
  getPhoneNumbers(): string[] {
    return [...this.phoneNumbers];
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
      phoneNumbers: this.phoneNumbers,
    };
  }

  /**
   * Create a GroupHabit instance from plain object
   */
  static fromJSON(data: HabitData): GroupHabit {
    return new GroupHabit(
      data.action,
      data.goalDays,
      data.phoneNumbers || [],
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
