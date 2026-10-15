import React, { useState } from "react";
import { View } from "react-native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import {
  ChoiceChip,
  SaveButton,
  SheetModal,
  Stepper,
  sheetStyles,
} from "@/components/SheetModal";
import { useData } from "@/core/DataContext";
import { useLoggedFeedback } from "@/core/LoggedFeedbackContext";
import { useTheme } from "@/hooks/useTheme";

type Tab = "food" | "drink" | "substance";
const MEALS = [
  { item: "Breakfast", category: "meal" as const },
  { item: "Lunch", category: "meal" as const },
  { item: "Dinner", category: "meal" as const },
  { item: "Snack", category: "snack" as const },
];
const DRINKS = ["Water", "Juice", "Fizzy drink", "Milk", "Other drink"];

/** Food in three taps or fewer (meal → optional tags → save). Substances stay hidden until switched on. */
export function IntakeSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const { addIntakeEntry, intakeConfig, insightSettings } = useData();
  const { showLogged } = useLoggedFeedback();
  const [tab, setTab] = useState<Tab>("food");
  const [meal, setMeal] = useState<(typeof MEALS)[number] | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [drink, setDrink] = useState<string | null>(null);
  const [substance, setSubstance] = useState<string | null>(null);
  const [amount, setAmount] = useState(1);

  const visibleTags = intakeConfig.tags.filter(
    (t) => !intakeConfig.hiddenTags.includes(t),
  );
  const substances = intakeConfig.substances.filter((s) => s.enabled);
  const selectedSubstance = substances.find((s) => s.id === substance);

  const reset = () => {
    setMeal(null);
    setTags([]);
    setDrink(null);
    setSubstance(null);
    setAmount(1);
  };

  const done = (label: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showLogged(label, "coffee");
    reset();
    onClose();
  };

  const save = () => {
    if (tab === "food" && meal) {
      addIntakeEntry({ category: meal.category, item: meal.item, tags });
      done(meal.item);
    } else if (tab === "drink" && drink) {
      addIntakeEntry({ category: "drink", item: drink, amount });
      done(drink);
    } else if (tab === "substance" && selectedSubstance) {
      addIntakeEntry({
        category: "substance",
        item: selectedSubstance.id,
        amount,
      });
      done(selectedSubstance.name);
    }
  };

  const canSave =
    (tab === "food" && !!meal) ||
    (tab === "drink" && !!drink) ||
    (tab === "substance" && !!selectedSubstance);

  return (
    <SheetModal visible={visible} title="Food & drink" onClose={onClose}>
      <View style={[sheetStyles.chips, { marginTop: 8 }]}>
        <ChoiceChip
          label="Food"
          icon="coffee"
          selected={tab === "food"}
          onPress={() => setTab("food")}
        />
        <ChoiceChip
          label="Drink"
          icon="droplet"
          selected={tab === "drink"}
          onPress={() => {
            setTab("drink");
            setAmount(1);
          }}
        />
        {insightSettings.substancesEnabled ? (
          <ChoiceChip
            label="Substances"
            icon="wind"
            selected={tab === "substance"}
            onPress={() => {
              setTab("substance");
              setAmount(1);
            }}
          />
        ) : null}
      </View>

      {tab === "food" ? (
        <>
          <ThemedText type="small" style={sheetStyles.label}>
            Which meal?
          </ThemedText>
          <View style={sheetStyles.chips}>
            {MEALS.map((m) => (
              <ChoiceChip
                key={m.item}
                label={m.item}
                selected={meal?.item === m.item}
                onPress={() => setMeal(m)}
              />
            ))}
          </View>
          <ThemedText type="small" style={sheetStyles.label}>
            Anything about it? (optional)
          </ThemedText>
          <View style={sheetStyles.chips}>
            {visibleTags.map((t) => (
              <ChoiceChip
                key={t}
                label={t}
                selected={tags.includes(t)}
                onPress={() =>
                  setTags((prev) =>
                    prev.includes(t)
                      ? prev.filter((x) => x !== t)
                      : [...prev, t],
                  )
                }
              />
            ))}
          </View>
        </>
      ) : null}

      {tab === "drink" ? (
        <>
          <ThemedText type="small" style={sheetStyles.label}>
            What did you drink?
          </ThemedText>
          <View style={sheetStyles.chips}>
            {DRINKS.map((d) => (
              <ChoiceChip
                key={d}
                label={d}
                selected={drink === d}
                onPress={() => setDrink(d)}
              />
            ))}
          </View>
          <ThemedText type="small" style={sheetStyles.label}>
            How many glasses or cups?
          </ThemedText>
          <Stepper
            label="Amount"
            value={amount}
            onChange={setAmount}
            min={1}
            max={12}
          />
          <ThemedText
            type="caption"
            style={{ color: theme.textSecondary, marginTop: 8 }}
          >
            Tea and coffee go under Substances (caffeine) if you’ve switched
            that on.
          </ThemedText>
        </>
      ) : null}

      {tab === "substance" ? (
        <>
          <ThemedText type="small" style={sheetStyles.label}>
            What did you have?
          </ThemedText>
          <View style={sheetStyles.chips}>
            {substances.map((s) => (
              <ChoiceChip
                key={s.id}
                label={s.name}
                selected={substance === s.id}
                onPress={() => setSubstance(s.id)}
              />
            ))}
          </View>
          {selectedSubstance ? (
            <>
              <ThemedText type="small" style={sheetStyles.label}>
                How much? ({selectedSubstance.unit})
              </ThemedText>
              <Stepper
                label="Amount"
                value={amount}
                onChange={setAmount}
                min={0.5}
                max={30}
                step={0.5}
              />
            </>
          ) : null}
          <ThemedText
            type="caption"
            style={{ color: theme.textSecondary, marginTop: 12 }}
          >
            This stays on your phone. It’s only used to show your own patterns,
            with no judgement and no advice.
          </ThemedText>
        </>
      ) : null}

      <SaveButton label="Save" onPress={save} disabled={!canSave} />
    </SheetModal>
  );
}
