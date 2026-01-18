import { Habit, HabitData } from './Habit';
import { SoloHabit } from './SoloHabit';
import { GroupHabit } from './GroupHabit';

export class HabitFactory {
    static create(data: HabitData): Habit {
        // Check if it has phone numbers to determine type
        if (data.phoneNumbers && data.phoneNumbers.length > 0) {
            return GroupHabit.fromJSON(data);
        }
        return SoloHabit.fromJSON(data);
    }
}