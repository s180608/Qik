import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { router } from "expo-router";
import {
  Button,
  Field,
  Label,
  Muted,
  Notice,
  Title,
  styles,
} from "../components/ui";
import { useQik, riderApp } from "../context/QikContext";
export default function Auth() {
  const { signIn, register } = useQik();
  const [creating, setCreating] = useState(false),
    [first, setFirst] = useState(""),
    [last, setLast] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit() {
    setError("");
    if (
      !email.trim() ||
      !password ||
      (creating && (!first.trim() || !last.trim()))
    ) {
      setError("Fill in all the fields to continue.");
      return;
    }
    if (creating && password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      if (creating) await register(first, last, email, password);
      else await signIn(email, password);
      router.replace("/");
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.page}
      >
        <Label>
          {riderApp ? "Your next good deed" : "Your neighbourhood, on demand"}
        </Label>
        <Title>
          {creating ? "Make yourself at home." : "Good to see you."}
        </Title>
        <Muted>
          {riderApp
            ? "Sign in to keep the neighbourhood moving."
            : "Your next everyday shop starts here."}
        </Muted>
        <View style={{ marginTop: 30 }}>
          {creating && (
            <>
              <Field
                label="First name"
                value={first}
                onChangeText={setFirst}
                maxLength={60}
                autoComplete="given-name"
              />
              <Field
                label="Last name"
                value={last}
                onChangeText={setLast}
                maxLength={60}
                autoComplete="family-name"
              />
            </>
          )}
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            maxLength={240}
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={creating ? "new-password" : "current-password"}
            onSubmitEditing={() => void submit()}
          />
          {Boolean(error) && <Notice message={error} />}
          <Button
            title={creating ? "Create account →" : "Sign in →"}
            onPress={() => void submit()}
            loading={busy}
          />
          {!riderApp && (
            <Button
              secondary
              style={{ marginTop: 12 }}
              title={
                creating
                  ? "Already here? Sign in"
                  : "New to QIK? Create an account"
              }
              onPress={() => {
                setCreating(!creating);
                setError("");
              }}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
