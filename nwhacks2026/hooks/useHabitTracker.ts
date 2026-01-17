// hooks/useHabitTracker.js
import { useState, useEffect } from 'react';
import { sendShameText } from '../utils/smsService';

export const useHabitTracker = () => {
    const [isHabitDone, setIsHabitDone] = useState(false);
    const [lastCheckDate, setLastCheckDate] = useState(new Date().getDate());

    // The Manual Trigger
    const triggerPenaltyManual = () => {
        sendShameText();
    };

    // The Automatic Midnight Checker
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const targetHour = 0; // 0 = Midnight. Change this to current hour to test!

            // If it's the right time AND we haven't checked today
            if (now.getHours() === targetHour && now.getDate() !== lastCheckDate) {
                setLastCheckDate(now.getDate());

                if (!isHabitDone) {
                    sendShameText();
                }
            }
        }, 10000); // Check every 10 seconds

        return () => clearInterval(timer);
    }, [isHabitDone, lastCheckDate]);

    return {
        isHabitDone,
        setIsHabitDone,
        triggerPenaltyManual
    };
};