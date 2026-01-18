// app/(tabs)/we-screen.tsx
import React, { useMemo, useState } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Alert,
  ListRenderItemInfo,
  Platform,
  TouchableOpacity,
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
        title: "Wake up at 9am",
        withLabel: "Group Habit",
        members: [
          {
            id: "m1",
            name: "You",
            status: "pending",
            timeLabel: "",
            avatar:
              "",
          },
          {
            id: "m2",
            name: "6729718961",
            status: "later",
            timeLabel: "Later",
            avatar:
              "",
          },
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
    Alert.alert("Sent", type === "support" ? "Support sent." : "Nice boost sent.");
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

  // ✅ Match HomeScreen layout: floating pill nav with safe-area-aware bottom spacing
  const bottomOffset = 30 + insets.bottom;

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
          contentInsetAdjustmentBehavior={Platform.OS === "ios" ? "automatic" : undefined}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 10,
            // ✅ leave room so list doesn't hide behind floating nav
            paddingBottom: bottomOffset + 90,
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

        {/* ✅ Bottom Nav (HomeScreen style) */}
        <View style={[styles.bottomNav, { bottom: bottomOffset }]}>
          <TouchableOpacity style={styles.navItem} onPress={() => router.replace("/")}>
            <Ionicons name="wallet" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => Alert.alert("Add", "Open add habit from Home for now.")}
          >
            <Ionicons name="add" size={32} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => router.replace("/we-screen")}>
            <Ionicons name="stats-chart" size={24} color="#C5C5C7" />
          </TouchableOpacity>
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
        <TouchableOpacity onPress={() => Alert.alert("Menu", "Edit / Mute / Leave")} hitSlop={10}>
          <Text style={styles.actionText}>•••</Text>
        </TouchableOpacity>
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
        <TouchableOpacity style={styles.primaryBtn} onPress={onCheckIn}>
          <Text style={styles.primaryBtnText}>Check in</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.reactionRow}>
          <TouchableOpacity style={styles.reactionBtn} onPress={() => onReact("support")}>
            <Ionicons name="heart" size={18} color={COLORS.textPrimary} />
            <Text style={styles.reactionText}>Support</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.reactionBtn} onPress={() => onReact("spark")}>
            <Ionicons name="flash" size={18} color={COLORS.textPrimary} />
            <Text style={styles.reactionText}>Boost</Text>
          </TouchableOpacity>
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
        <TouchableOpacity onPress={() => Alert.alert("Menu", "Edit / Mute / Leave")} hitSlop={10}>
          <Text style={styles.actionText}>•••</Text>
        </TouchableOpacity>
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
          <TouchableOpacity style={styles.compactBtn} onPress={onCheckIn}>
            <Text style={styles.compactBtnText}>Check in</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.reactionRow}>
            <TouchableOpacity style={styles.reactionBtn} onPress={() => onReact("support")}>
              <Ionicons name="heart" size={18} color={COLORS.textPrimary} />
              <Text style={styles.reactionText}>Support</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.reactionBtn} onPress={() => onReact("spark")}>
              <Ionicons name="flash" size={18} color={COLORS.textPrimary} />
              <Text style={styles.reactionText}>Boost</Text>
            </TouchableOpacity>
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

  // ✅ HomeScreen-style floating nav
  bottomNav: {
    position: "absolute",
    left: 20,
    right: 20,
    height: 70,
    backgroundColor: COLORS.navBar,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderRadius: 35,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  addButton: {
    backgroundColor: "#1C1C1E",
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    top: -10,
  },
  navItem: { padding: 10 },
});
