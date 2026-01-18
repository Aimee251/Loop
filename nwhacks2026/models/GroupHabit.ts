import { Habit, HabitData } from "./Habit";

/**
 * GroupHabit - Habit with multiple members for group accountability.
 *
 * Rule:
 *  - A day counts as completed ONLY if EVERY member completed that day.
 *  - After the day ends, if ANY member did NOT complete, the whole group FAILS that day.
 *
 * Your app should call `finalizeDay(yesterday)` when the app opens / foregrounds.
 */
export class GroupHabit extends Habit {
  phoneNumbers: string[];
  groupId: string;

  // per-member completions
  memberCompletedDays: Record<string, string[]>;

  // days the group failed (missed deadline)
  failedDays: string[];

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
    isActive: boolean = true,
    groupId?: string,
    memberCompletedDays: Record<string, string[]> = {},
    failedDays: string[] = []
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
    this.groupId = groupId || this.generateGroupCode();
    this.memberCompletedDays = memberCompletedDays;
    this.failedDays = failedDays;

    for (const phone of this.phoneNumbers) {
      if (!this.memberCompletedDays[phone]) this.memberCompletedDays[phone] = [];
    }
  }

  private generateGroupCode(): string {
    return `grp_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`;
  }

  addPhoneNumber(phoneNumber: string): void {
    if (!this.phoneNumbers.includes(phoneNumber)) {
      this.phoneNumbers.push(phoneNumber);
      if (!this.memberCompletedDays[phoneNumber]) this.memberCompletedDays[phoneNumber] = [];
      this.updatedAt = new Date();
    }
  }

  removePhoneNumber(phoneNumber: string): void {
    this.phoneNumbers = this.phoneNumbers.filter((n) => n !== phoneNumber);
    delete this.memberCompletedDays[phoneNumber];
    this.updatedAt = new Date();
  }

  getPhoneNumbers(): string[] {
    return [...this.phoneNumbers];
  }

  /**
   * Member check-in (defaults to today).
   * If this makes ALL members completed for that day, the group day is completed.
   */
  markMemberCompleted(phoneNumber: string, dateStr?: string): void {
    const day = dateStr || this.getTodayString();

    if (!this.phoneNumbers.includes(phoneNumber)) {
      throw new Error(`Member ${phoneNumber} is not in this group.`);
    }

    // If the group already failed that day, late check-ins shouldn't undo it.
    if (this.failedDays.includes(day)) return;

    const arr = this.memberCompletedDays[phoneNumber] || (this.memberCompletedDays[phoneNumber] = []);
    if (!arr.includes(day)) arr.push(day);

    // Only mark the group day complete if EVERYONE completed.
    if (this.isGroupCompletedOn(day)) {
      this.markDayAsCompleted(day);
    }

    this.updatedAt = new Date();
  }

  /**
   * Call this once the day has ended (usually for yesterday).
   * If ANY member didn't complete, the whole group fails that day.
   */
  finalizeDay(day: string): void {
    if (this.failedDays.includes(day)) return;

    if (!this.isGroupCompletedOn(day)) {
      this.failGroupOn(day);
      this.updatedAt = new Date();
      return;
    }

    // If everyone completed but the group day wasn't recorded yet, record it.
    if (!this.completedDays.includes(day)) {
      this.markDayAsCompleted(day);
    }

    this.updatedAt = new Date();
  }

  /**
   * True if every current member completed on that day.
   */
  isGroupCompletedOn(day: string): boolean {
    if (this.phoneNumbers.length === 0) return false;
    return this.phoneNumbers.every((p) => (this.memberCompletedDays[p] || []).includes(day));
  }

  /**
   * Mark the entire group as failed on a day (missed deadline).
   */
  private failGroupOn(day: string): void {
    if (!this.failedDays.includes(day)) this.failedDays.push(day);

    // Clear member logs for that day (keeps "failed" authoritative)
    for (const p of this.phoneNumbers) {
      const arr = this.memberCompletedDays[p] || [];
      this.memberCompletedDays[p] = arr.filter((d) => d !== day);
    }

    // Remove the group completion for that day if it exists
    this.unmarkDayAsCompleted(day);

    // Reset streak immediately
    this.currentStreak = 0;
  }

  toJSON(): HabitData {
    return {
      type: "group",
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
      groupId: this.groupId,
      memberCompletedDays: this.memberCompletedDays,
      failedDays: this.failedDays,
    };
  }

  static fromJSON(data: HabitData): GroupHabit {
    return new GroupHabit(
      data.action,
      data.goalDays,
      data.phoneNumbers || [],
      data.completedDays || [],
      data.id,
      typeof data.createdAt === "string" ? new Date(data.createdAt) : (data.createdAt as Date),
      typeof data.updatedAt === "string" ? new Date(data.updatedAt) : (data.updatedAt as Date),
      data.currentStreak || 0,
      data.daysPerWeekDone || 0,
      data.isActive ?? true,
      data.groupId,
      data.memberCompletedDays || {},
      data.failedDays || []
    );
  }
}