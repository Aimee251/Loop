// app/(tabs)/we-screen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Image,
  Alert,
  ListRenderItemInfo,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  background: "#FDFBF7",
  textPrimary: "#4A4A4A",
  textSecondary: "#8E8E93",
  card1: "#E6EEFA",
  card2: "#C2DAF8",
  card3: "#E8F0F0",
  navBar: "#FFFFFF",
  primaryBtn: "#4A4A4A",
};

type MemberStatus = "done" | "later" | "pending";

type Member = {
  id: string;
  name: string;
  avatar?: string;
  status: MemberStatus;
  timeLabel?: string;
};

type SharedHabit = {
  id: string;
  title: string;
  withLabel: string;
  members: Member[];
  compact?: boolean;
};

const statusLabel = (s: MemberStatus) => {
  switch (s) {
    case "done":
      return "Done";
    case "later":
      return "Later";
    default:
      return "Pending";
  }
};

function nowLabel() {
  return "Just now";
}

export default function WeScreen() {
  const insets = useSafeAreaInsets();

  const initialData: SharedHabit[] = useMemo(
    () => [
      {
        id: "h1",
        title: "Morning Walk",
        withLabel: "With Mia & Lily",
        members: [
          {
            id: "m1",
            name: "Mia",
            status: "done",
            timeLabel: "10m ago",
            avatar:
              "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=60",
          },
          {
            id: "m2",
            name: "You",
            status: "pending",
            timeLabel: "",
            avatar:
              "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=200&q=60",
          },
          {
            id: "m3",
            name: "Lily",
            status: "later",
            timeLabel: "Later",
            avatar:
              "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=200&q=60",
          },
        ],
      },
      {
        id: "h2",
        title: "Read Together",
        withLabel: "With Tom",
        compact: true,
        members: [
          { id: "m4", name: "You", status: "pending" },
          { id: "m5", name: "Tom", status: "later" },
        ],
      },
      {
        id: "h3",
        title: "Drink Water",
        withLabel: "With Nora",
        compact: true,
        members: [
          { id: "m6", name: "You", status: "pending" },
          { id: "m7", name: "Nora", status: "done" },
        ],
      },
    ],
    []
  );

  const [habits, setHabits] = useState<SharedHabit[]>(initialData);

  // tracks whether YOU checked in for each habit
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(new Set());

  const sharedCount = habits.length;
  const isCheckedIn = (habitId: string) => checkedInIds.has(habitId);

  const handleCheckIn = (habitId: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;

        const updatedMembers = h.members.map((m) => {
          if (m.name !== "You") return m;
          return {
            ...m,
            status: "done" as MemberStatus,
            timeLabel: nowLabel(),
          };
        });

        return { ...h, members: updatedMembers };
      })
    );

    setCheckedInIds((prev) => {
      const next = new Set(prev);
      next.add(habitId);
      return next;
    });

    Alert.alert("Checked in ✅", "Nice! Now you can Support or Boost.");
  };

  const onReact = (habit: SharedHabit, type: "support" | "spark") => {
    Alert.alert(
      "Sent",
      type === "support" ? "Support sent." : "Nice boost sent."
    );
  };

  const renderHabit = ({ item, index }: ListRenderItemInfo<SharedHabit>) => {
    const cardColor = [COLORS.card1, COLORS.card2, COLORS.card3][index % 3];
    const checked = isCheckedIn(item.id);

    if (item.compact) {
      return (
        <CompactHabitCard
          habit={item}
          bg={cardColor}
          checkedIn={checked}
          onCheckIn={() => handleCheckIn(item.id)}
          onReact={(t) => onReact(item, t)}
        />
      );
    }

    return (
      <HabitCard
        habit={item}
        bg={cardColor}
        checkedIn={checked}
        onCheckIn={() => handleCheckIn(item.id)}
        onReact={(t) => onReact(item, t)}
      />
    );
  };

  // Nav height = base 78 + safe area bottom
  const NAV_BASE_HEIGHT = 78;
  const navHeight = NAV_BASE_HEIGHT + insets.bottom;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.screen}>
        <FlatList
          style={styles.list}
          data={habits}
          keyExtractor={(h) => h.id}
          renderItem={renderHabit}
          extraData={checkedInIds}
          showsVerticalScrollIndicator={false}
          bounces
          contentInsetAdjustmentBehavior={
            Platform.OS === "ios" ? "automatic" : undefined
          }
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 10,
            // ✅ Enough to scroll above nav with NO huge empty space
            paddingBottom: navHeight + 40,
          }}
          ListHeaderComponent={
            <View>
              <View style={styles.header}>
                <Text style={styles.greetingSub}>Shared Moments</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{sharedCount} today</Text>
                </View>
              </View>

              <Text style={styles.subTitle}>
                Keep each other on track with small check-ins.
              </Text>
            </View>
          }
        />

        {/* ✅ Bottom Nav: flush to bottom, no gap */}
        <View style={[styles.bottomNav, { height: navHeight, paddingBottom: insets.bottom }]}>
          <Pressable
            style={styles.navItem}
            onPress={() => Alert.alert("Nav", "Home")}
          >
            <Ionicons name="home" size={28} color={COLORS.textPrimary} />
          </Pressable>

          <Pressable
            style={styles.addButton}
            onPress={() => Alert.alert("Nav", "We")}
          >
            <Ionicons name="people" size={28} color={COLORS.textPrimary} />
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={() => Alert.alert("Nav", "AI")}
          >
            <Ionicons name="sparkles" size={26} color={COLORS.textPrimary} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ---------- Components ---------- */

function HabitCard({
  habit,
  bg,
  checkedIn,
  onCheckIn,
  onReact,
}: {
  habit: SharedHabit;
  bg: string;
  checkedIn: boolean;
  onCheckIn: () => void;
  onReact: (t: "support" | "spark") => void;
}) {
  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{habit.title}</Text>
        <Pressable hitSlop={10} onPress={() => Alert.alert("Menu", "Edit / Mute / Leave")}>
          <Text style={styles.actionText}>•••</Text>
        </Pressable>
      </View>

      <View style={styles.withRow}>
        <Text style={styles.cardWith}>{habit.withLabel}</Text>
        <Ionicons name="people" size={16} color={COLORS.textSecondary} style={{ marginLeft: 8 }} />
      </View>

      <View style={styles.avatarRow}>
        {habit.members.slice(0, 3).map((m, idx) => (
          <View key={m.id} style={[styles.avatarWrap, { marginLeft: idx === 0 ? 0 : -10 }]}>
            {m.avatar ? (
              <Image source={{ uri: m.avatar }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>{m.name[0].toUpperCase()}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.statusBox}>
        {habit.members.map((m) => (
          <View key={m.id} style={styles.statusRow}>
            <Text style={styles.statusName}>{m.name}</Text>
            <Text style={styles.statusValue}>
              {statusLabel(m.status)}
              {m.timeLabel ? <Text style={styles.statusTime}> · {m.timeLabel}</Text> : null}
            </Text>
          </View>
        ))}
      </View>

      {!checkedIn ? (
        <Pressable style={styles.primaryBtn} onPress={onCheckIn}>
          <Text style={styles.primaryBtnText}>Check in</Text>
        </Pressable>
      ) : (
        <View style={styles.reactionRow}>
          <Pressable style={styles.reactionBtn} onPress={() => onReact("support")}>
            <Ionicons name="heart" size={18} color={COLORS.textPrimary} />
            <Text style={styles.reactionText}>Support</Text>
          </Pressable>

          <Pressable style={styles.reactionBtn} onPress={() => onReact("spark")}>
            <Ionicons name="flash" size={18} color={COLORS.textPrimary} />
            <Text style={styles.reactionText}>Boost</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function CompactHabitCard({
  habit,
  bg,
  checkedIn,
  onCheckIn,
  onReact,
}: {
  habit: SharedHabit;
  bg: string;
  checkedIn: boolean;
  onCheckIn: () => void;
  onReact: (t: "support" | "spark") => void;
}) {
  const you = habit.members.find((m) => m.name === "You");
  const other = habit.members.find((m) => m.name !== "You");

  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{habit.title}</Text>
        <Pressable hitSlop={10} onPress={() => Alert.alert("Menu", "Edit / Mute / Leave")}>
          <Text style={styles.actionText}>•••</Text>
        </Pressable>
      </View>

      <View style={styles.withRow}>
        <Text style={styles.cardWith}>{habit.withLabel}</Text>
        <Ionicons name="people" size={16} color={COLORS.textSecondary} style={{ marginLeft: 8 }} />
      </View>

      <View style={styles.compactRow}>
        <Text style={styles.compactStatusText}>
          {you?.name ?? "You"}: {statusLabel(you?.status ?? "pending")}
        </Text>
        <Text style={styles.compactStatusText}>
          {other?.name ?? "Friend"}: {statusLabel(other?.status ?? "pending")}
        </Text>

        {!checkedIn ? (
          <Pressable style={styles.compactBtn} onPress={onCheckIn}>
            <Text style={styles.compactBtnText}>Check in</Text>
          </Pressable>
        ) : (
          <View style={styles.reactionRow}>
            <Pressable style={styles.reactionBtn} onPress={() => onReact("support")}>
              <Ionicons name="heart" size={18} color={COLORS.textPrimary} />
              <Text style={styles.reactionText}>Support</Text>
            </Pressable>

            <Pressable style={styles.reactionBtn} onPress={() => onReact("spark")}>
              <Ionicons name="flash" size={18} color={COLORS.textPrimary} />
              <Text style={styles.reactionText}>Boost</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  screen: { flex: 1 },
  list: { flex: 1 },

  header: {
    marginTop: 10,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greetingSub: { fontSize: 28, fontWeight: "300", color: COLORS.textPrimary },
  badge: {
    backgroundColor: "#E0E0E0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: { fontWeight: "600", color: COLORS.textPrimary, fontSize: 14 },

  subTitle: { color: COLORS.textSecondary, marginBottom: 16 },

  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  cardTitle: { fontSize: 20, fontWeight: "600", color: COLORS.textPrimary },
  cardWith: { fontSize: 14, color: COLORS.textSecondary },
  withRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  actionText: { fontSize: 16, color: COLORS.textSecondary, fontWeight: "600" },

  avatarRow: { flexDirection: "row", marginBottom: 12 },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#FFF",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  avatarFallbackText: { fontWeight: "700", color: COLORS.textPrimary },

  statusBox: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statusRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  statusName: { fontSize: 15, fontWeight: "600", color: COLORS.textPrimary },
  statusValue: { fontSize: 15, color: COLORS.textPrimary },
  statusTime: { color: COLORS.textSecondary },

  primaryBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primaryBtn,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryBtnText: { color: "#FFF", fontWeight: "700" },

  reactionRow: { flexDirection: "row", gap: 10 as any, marginTop: 12 },
  reactionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8 as any,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  reactionText: { fontWeight: "600", color: COLORS.textPrimary },

  compactRow: { marginTop: 10, gap: 8 as any },
  compactStatusText: { color: COLORS.textPrimary, fontWeight: "600" },
  compactBtn: {
    marginTop: 6,
    backgroundColor: COLORS.primaryBtn,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  compactBtnText: { color: "#FFF", fontWeight: "700" },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.navBar,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    elevation: 10,
  },
  addButton: {
    backgroundColor: "#D1D5DB",
    width: 55,
    height: 55,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -25,
    elevation: 5,
  },
  navItem: { padding: 10 },
});
