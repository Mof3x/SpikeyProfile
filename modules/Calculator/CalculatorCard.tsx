import React, { useState } from "react";
import { StyleSheet, View, Pressable, Text } from "react-native";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import * as Haptics from "expo-haptics";

export function CalculatorCard() {
  const { theme } = useTheme();
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const handleNumberPress = (num: string) => {
    Haptics.selectionAsync();
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleOperation = (op: string) => {
    Haptics.selectionAsync();
    const currentValue = parseFloat(display);
    
    if (previousValue === null) {
      setPreviousValue(currentValue);
    } else if (operation) {
      const result = calculate(previousValue, currentValue, operation);
      setDisplay(result.toString());
      setPreviousValue(result);
    }
    
    setOperation(op);
    setWaitingForNewValue(true);
  };

  const calculate = (prev: number, current: number, op: string): number => {
    switch (op) {
      case "+":
        return prev + current;
      case "-":
        return prev - current;
      case "×":
        return prev * current;
      case "÷":
        return current !== 0 ? prev / current : 0;
      default:
        return current;
    }
  };

  const handleEquals = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (operation && previousValue !== null) {
      const result = calculate(previousValue, parseFloat(display), operation);
      setDisplay(result.toString());
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const Button = ({ label, onPress, style }: any) => (
    <Pressable
      onPress={onPress}
      style={[styles.button, { backgroundColor: theme.surfaceVariant }, style]}
    >
      <Text style={[styles.buttonText, { color: theme.text, fontSize: 18, fontWeight: "600" }]}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <Card style={styles.container}>
      <View style={[styles.display, { backgroundColor: theme.backgroundSecondary }]}>
        <ThemedText type="h2" style={styles.displayText}>
          {display.length > 10 ? display.slice(0, 10) : display}
        </ThemedText>
      </View>

      <View style={styles.grid}>
        <View style={styles.row}>
          <Button label="C" onPress={handleClear} style={{ flex: 1 }} />
          <Button label="÷" onPress={() => handleOperation("÷")} style={[styles.opButton, { flex: 1, backgroundColor: theme.primary + "30" }]} />
          <Button label="×" onPress={() => handleOperation("×")} style={[styles.opButton, { flex: 1, backgroundColor: theme.primary + "30" }]} />
        </View>
        
        <View style={styles.row}>
          <Button label="7" onPress={() => handleNumberPress("7")} style={{ flex: 1 }} />
          <Button label="8" onPress={() => handleNumberPress("8")} style={{ flex: 1 }} />
          <Button label="9" onPress={() => handleNumberPress("9")} style={{ flex: 1 }} />
          <Button label="-" onPress={() => handleOperation("-")} style={[styles.opButton, { backgroundColor: theme.primary + "30" }]} />
        </View>
        
        <View style={styles.row}>
          <Button label="4" onPress={() => handleNumberPress("4")} style={{ flex: 1 }} />
          <Button label="5" onPress={() => handleNumberPress("5")} style={{ flex: 1 }} />
          <Button label="6" onPress={() => handleNumberPress("6")} style={{ flex: 1 }} />
          <Button label="+" onPress={() => handleOperation("+")} style={[styles.opButton, { backgroundColor: theme.primary + "30" }]} />
        </View>
        
        <View style={styles.row}>
          <Button label="1" onPress={() => handleNumberPress("1")} style={{ flex: 1 }} />
          <Button label="2" onPress={() => handleNumberPress("2")} style={{ flex: 1 }} />
          <Button label="3" onPress={() => handleNumberPress("3")} style={{ flex: 1 }} />
          <Button label="=" onPress={handleEquals} style={[styles.opButton, { backgroundColor: theme.success }]} />
        </View>
        
        <View style={styles.row}>
          <Button label="0" onPress={() => handleNumberPress("0")} style={{ flex: 2 }} />
          <Button label="." onPress={() => handleNumberPress(".")} style={{ flex: 1 }} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  display: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    alignItems: "flex-end",
  },
  displayText: {
    textAlign: "right",
  },
  grid: {
    gap: Spacing.xs,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  button: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  buttonText: {
    textAlign: "center",
  },
  opButton: {
    borderRadius: BorderRadius.md,
  },
});
