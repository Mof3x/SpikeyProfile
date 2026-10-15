import React, { useState } from "react";
import { View } from "react-native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import {
  ChoiceChip,
  SaveButton,
  SheetModal,
  sheetStyles,
} from "@/components/SheetModal";
import { useData, type ExerciseType } from "@/core/DataContext";
import { useLoggedFeedback } from "@/core/LoggedFeedbackContext";

const TYPES: { id: ExerciseType; label: string; icon: string }[] = [
  { id: "walk", label: "Walk", icon: "navigation" },
  { id: "run", label: "Run", icon: "wind" },
  { id: "gym", label: "Gym", icon: "activity" },
  { id: "yoga", label: "Yoga / stretch", icon: "feather" },
  { id: "cycle", label: "Cycle", icon: "disc" },
  { id: "swim", label: "Swim", icon: "droplet" },
  { id: "sport", label: "Sport", icon: "target" },
  { id: "other", label: "Other", icon: "more-horizontal" },
];

const MINUTES = [10, 20, 30, 45, 60, 90];
const INTENSITY: { id: 1 | 2 | 3; label: string }[] = [
  { id: 1, label: "Easy" },
  { id: 2, label: "Moderate" },
  { id: 3, label: "Hard" },
];

/** Type → minutes → save: three taps. How hard it felt is optional (defaults to moderate). */
export function ExerciseSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { addExerciseEntry } = useData();
  const { showLogged } = useLoggedFeedback();
  const [type, setType] = useState<ExerciseType | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [intensity, setIntensity] = useState<1 | 2 | 3>(2);

  const reset = () => {
    setType(null);
    setMinutes(null);
    setIntensity(2);
  };

  const save = () => {
    if (!type || !minutes) return;
    addExerciseEntry({ type, minutes, intensity });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showLogged(`Exercise: ${minutes} min`, "trending-up");
    reset();
    onClose();
  };

  return (
    <SheetModal visible={visible} title="Log exercise" onClose={onClose}>
      <ThemedText type="small" style={sheetStyles.label}>
        What did you do?
      </ThemedText>
      <View style={sheetStyles.chips}>
        {TYPES.map((t) => (
          <ChoiceChip
            key={t.id}
            label={t.label}
            icon={t.icon}
            selected={type === t.id}
            onPress={() => setType(t.id)}
          />
        ))}
      </View>
      <ThemedText type="small" style={sheetStyles.label}>
        For how long?
      </ThemedText>
      <View style={sheetStyles.chips}>
        {MINUTES.map((m) => (
          <ChoiceChip
            key={m}
            label={m === 90 ? "90+ min" : `${m} min`}
            selected={minutes === m}
            onPress={() => setMinutes(m)}
          />
        ))}
      </View>
      <ThemedText type="small" style={sheetStyles.label}>
        How hard did it feel? (optional)
      </ThemedText>
      <View style={sheetStyles.chips}>
        {INTENSITY.map((i) => (
          <ChoiceChip
            key={i.id}
            label={i.label}
            selected={intensity === i.id}
            onPress={() => setIntensity(i.id)}
          />
        ))}
      </View>
      <SaveButton label="Save" onPress={save} disabled={!type || !minutes} />
    </SheetModal>
  );
}
