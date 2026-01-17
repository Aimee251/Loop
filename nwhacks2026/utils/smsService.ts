// utils/smsService.js
import { Alert } from 'react-native';

export const sendShameText = async () => {
    try {
        console.log("🚀 Triggering Shame Text...");

        // Replace with your IFTTT/Zapier/API URL
        await fetch('https://hooks.zapier.com/hooks/catch/26089976/ugnuta5/', { method: 'POST' });

        // For Hackathon Demo:
        Alert.alert("🔥 PENALTY TRIGGERED", "Text sent: 'Hayden missed his habit, check in on him!'");
        return true;
    } catch (error) {
        console.error("Failed to send text:", error);
        return false;
    }
};

export const sendPraiseText = async () => {
    try {
        console.log("🚀 Triggering Shame Text...");

        // Replace with your IFTTT/Zapier/API URL
        await fetch('https://hooks.zapier.com/hooks/catch/26089976/ugnt55f/', { method: 'POST' });

        // For Hackathon Demo:
        Alert.alert("🔥 PENALTY TRIGGERED", "Text sent: 'Hayden missed his habit, check in on him!'");
        return true;
    } catch (error) {
        console.error("Failed to send text:", error);
        return false;
    }
};