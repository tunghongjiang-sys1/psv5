# Loopie Town — Book of Information

A manual for editing **Loopie Town** (`projserve`): an Expo + React Native (web-first) classroom
game where students join a session, shop on a budget, and teachers ("Kelda") run the session from
a passcode-locked dashboard. Data lives in **Firebase Realtime Database**; auth is **anonymous**.

---

## 1. Setup

### 1.1 Software

| Thing | Version | Why |
|---|---|---|
| Expo SDK | ~56 | App framework + build/dev server |
| React Native | 0.85.3 | UI runtime (runs on web via react-native-web) |
| React | 19.2.3 | UI library |
| expo-router | ~56.2.11 | File-based navigation (`app/` folder = routes) |
| firebase | ^12.16.0 | Realtime Database + anonymous auth |
| @expo-google-fonts/dm-sans | ^0.4.2 | The app's only font family (DM Sans) |
| TypeScript | ~6.0.3 | Type checking (`tsconfig.json`) |

Package manager: **npm** (there is a `package-lock.json`; no yarn/pnpm files).

### 1.2 Environment

- **No backend server of your own.** Everything server-side is Firebase.
- Firebase config is hard-coded in `lib/firebaseConfig.ts` (project `ps-d-228ec`, RTDB URL
  `...asia-southeast1.firebasedatabase.app`). It is a dev project — fine to edit data, but
  don't commit real secrets here.
- `.env.local` exists but the app doesn't read env vars for Firebase; config is in code.
- Fonts must load before any screen renders — `app/_layout.tsx` blocks on `useFonts` and
  anonymous sign-in. If fonts fail, you get a spinner forever.
- The app runs **web-first** (`npx expo start --web`, or `npm run web`). Some helpers use
  `window.localStorage` and `window.confirm` with native fallbacks — keep that dual path.

### 1.3 Terminal commands

```bash
npm install            # install deps
npm run web            # dev server for browser (main dev loop)
npm run ios            # iOS simulator
npm run android        # Android emulator
npx tsc --noEmit       # typecheck (do this before committing)
```

There is no test suite and no linter config beyond `.prettierrc.json`
(no semicolons, single quotes, trailing commas, 100 col).

---

## 2. UI — knowing the UI and which files

### 2.1 Route map (expo-router: file path = URL)

```
app/
  _layout.tsx            Root: loads fonts + anonymous auth, renders <Stack>
  index.tsx              Welcome screen ("I'm a Student" / "I'm a Teacher")
  student/
    _layout.tsx          Student stack
    name.tsx             Join screen: type name → creates student in Firebase
    groupings.tsx        Group assignment view (student side)
    interview.tsx        Interview chat with personas
    whiteboard.tsx       Collaborative whiteboard (strokes saved to Firebase)
    shopping.tsx         Shop with budget, buy/borrow items
    submit.tsx           Final submission
    reflections.tsx      Reflection questions
  kelda/                 (teacher area — passcode locked)
    _layout.tsx
    login.tsx            6-key passcode pad (passcode: lib/helpers.ts `teachpass`)
    dashboard.tsx        Session controls, stats, unlock toggles
    session.tsx          Create/activate a session, set budget, unlock features
    groupings.tsx        Group assignment (teacher side)
    submissions.tsx      Review student submissions
    student-detail.tsx   One student's full detail
```

Navigation is `router.push('/path')` / `router.replace('/path')` from `expo-router`.
`replace` = can't go back; `push` = can.

### 2.2 Visuals

- **Headers / nav bars**: plain `View` + `Text` at top of each screen
  (see `styles.navbar` in `app/student/name.tsx`). There is no shared Header component.
- **Footer**: none — screens are single-page.
- **Sidebars**: none; wide layouts use a two-column `contentrow` (flex row when
  `useWindowDimensions().width >= 600`).
- **Buttons**: `Pressable` + inline styles. Common pattern:
  ```tsx
  <Pressable onPress={...} style={({pressed}) => [styles.button, pressed && styles.pressed]}>
    <Text style={styles.buttontext}>Label</Text>
  </Pressable>
  ```
- **Input forms**: React Native `TextInput` (see `name.tsx`).
- **Modals / pop-ups**: **not** RN `Modal` — the app uses
  `showAlert(title, msg)` and `showConfirm(title, msg, onConfirm, onCancel)` from
  `lib/helpers.ts`. These map to `window.alert/confirm` on web and `Alert.alert` on native.
  Use them; don't import `Alert` directly in screens.

### 2.3 Logic

- **Authentication** — `lib/useAnonymousAuth.ts`: signs in anonymously on load.
  There are no user accounts. "Teacher" auth = the passcode in `lib/helpers.ts`
  (`teachpass`), checked in `app/kelda/login.tsx`, stored via `lib/keldaState.ts`
  (localStorage key `loopietown.keldaState.v1`).
- **Data fetching** — `usefb(path)` in `lib/helpers.ts`: live Firebase listener.
  Returns `undefined` while loading, `null` if missing, else the value. Always handle
  `undefined` first (render a spinner) or you'll crash on the first render.
- **Writes** — always wrap in `fw(...)` (also `lib/helpers.ts`): adds an 8s timeout with a
  helpful error if the RTDB URL/rules are wrong.
- **State managers** — two tiny localStorage-backed stores with subscribe:
  - `lib/students.ts` → `studentState` (`loopietown.studentState.v1`): studentId, sessionId, name.
  - `lib/keldaState.ts` → `keldaState` (`loopietown.keldaState.v1`): isUnlocked + last route.
  Both follow the same pattern: `get()`, `set(partial)`, `subscribe(fn)`, plus
  `useStudentState()` / `useKeldaState()` hooks.

### 2.4 Assets

- **Styles**: every screen has its own `StyleSheet.create` at the bottom of the file.
  There is **no global stylesheet** and **no Tailwind**.
- **Theme**: the color palette lives in **two** places — keep them in sync:
  - `lib/helpers.ts` → `export const c = { teal, navy, yellow, pink, ... }` (the real one)
  - `app/index.tsx` → its own local `const c = {...}` (copy)
- **Fonts**: DM Sans only. Families: `DMSans_400Regular`, `DMSans_500Medium`,
  `DMSans_700Bold` (loaded in `app/_layout.tsx`). Set via `fontFamily` in styles.
- **Media**: `assets/` — `mascot.png` (the Loopie mascot), teacher personas
  (`ms lee.png`, `mr tan.png`, `mr chan.png`, `ms lim.png`), misc `1..5.png`,
  and `one_icon_one_png_named/` — 58 shop item images, mapped by name in
  `lib/shoppingitems.ts` (`buyImages`).

---

## 3. Data model (Firebase Realtime Database)

```
activeSession                     → { id, status: 'active'|..., ... }
sessions/<sessionId>/personaMode  → 'elderly' | 'children' (who students interview;)
                                    default 'elderly' when missing — normalize with
                                    normalizePersonaMode() from lib/helpers.ts
sessions/<sessionId>/students/<studentId> →
  { name, id, authUid, joinedAt, preferredGroup: [],
    bought: {}, borrowed: {}, chats: {}, reflection: '', reflections: {},
    whiteboard: '', rating: 0, submitted: false,
    interviewStatuses: { <personaId>: 'not_started'|'in_progress'|'completed' } }
```

Persona list lives in `components/interviewChatConfig.tsx`. Each persona has a
`group: 'elderly' | 'children'`; student-facing lists are filtered by the session's
`personaMode` (elderly: Mr Chan, Ms Lee, Mr Tan, Ms Lim — children: Jayden 9, Alyssa 11,
Daniel 12). Toggle it from the teacher session screen (`app/kelda/session.tsx`, Phase 2).

- `activeSession` is a single pointer; students read it to know where to join.
- Student creation happens in `app/student/name.tsx` (name is checked for duplicates).
- If a screen reads `sessions/...` and gets `undefined`, it's still loading.

---

## 4. Common changes (recipes)

### 4.1 Change text
Find the string in the screen file under `app/<area>/<screen>.tsx` and edit the JSX.
Screen titles, button labels, and alerts are all inline text.

### 4.2 Change a color or text color
1. If it's a themed color: update `lib/helpers.ts` `c` (and the copy in `app/index.tsx`).
2. If it's a one-off: edit the `StyleSheet` at the bottom of that screen file.
Colors are hex strings; `c.navy` is the main dark, `c.teal` the main background,
`c.yellow` teacher accents, `c.pink` the logo.

### 4.3 Swap an image
Replace the file in `assets/` (same name = zero code changes), or change the
`source={require('../assets/...')}` path. Shop items map through `lib/shoppingitems.ts` —
the key name must match what the game logic uses.

### 4.4 Hide / show a feature
- **Teacher-toggled features** (interview / shopping / reflections / summary) are controlled
  by the `unlocked` node in Firebase: `sessions/<id>/unlocked/{interview,shopping,...}`,
  flipped from `app/kelda/session.tsx`, read with `usefb` in student screens.
- **Whole screens**: remove the route file, or remove the `Pressable` that routes to it.
- **Student flow order** is just the `router.replace` chain:
  name → groupings → interview → shopping → reflections → submit.

---

## 5. Safety, testing, deployment

### 5.1 What NOT to touch
- `lib/firebaseConfig.ts` — breaks auth/DB for everyone if wrong.
- `lib/useAnonymousAuth.ts` — the loading gate; a bug here = infinite spinner.
- `app/_layout.tsx` font loading — same.
- `lib/helpers.ts` `fw()` timeout and `usefb()` — every screen depends on their contract
  (`undefined` = loading, `null` = missing).
- The `teachpass` value unless you intend to change the teacher passcode everywhere.
- Firebase security rules (managed in the Firebase console, not in this repo).

### 5.2 Local verification
1. `npx tsc --noEmit` — must be clean.
2. `npm run web` and click through both roles:
   - Student: join with a name → walk the whole flow to submit.
   - Teacher: passcode → dashboard → create/activate session → unlock features.
3. Check the browser console for Firebase permission errors (they surface as timeouts
   via `fw` after 8s).

### 5.3 Version control
- Repo is git; `main` branch. Commit small, one purpose per commit.
- Don't commit `.env.local`, `.DS_Store`, or `.expo/` (gitignored).
- 3 human contributors; no CI configured — typecheck locally before pushing.

### 5.4 Deployment
- `.vercel/` exists: the web build deploys via **Vercel** (static export of the
  expo-web bundle). `npx expo export --platform web` is the underlying build.
- Native builds would go through EAS (`app.json` holds the Expo config), but the current
  usage is web.
- After deploy, hard-refresh: Firebase listeners reconnect automatically, but localStorage
  state (`studentState`, `keldaState`) persists per browser.

---

## 6. Gotchas the original outline missed

1. **Two sources of truth for colors** (see 2.4) — change both or screens will disagree.
2. **`usefb` returns `undefined` first** — every screen must handle it; the loading spinners
   exist for this reason.
3. **Name collisions**: student names must be unique per session (checked in `name.tsx`);
   the DB key is `Name_With_Underscores_<timestamp>`.
4. **Wide-screen layout** switches at `width >= 600` in several files — test both widths.
5. **The teacher passcode is in the client bundle** — it's a classroom deterrent, not security.
6. **No tests exist.** If you add logic to `lib/groupAssignment.ts` (the balanced-split
   algorithm) or `lib/helpers.ts`, verify by hand in the UI.
7. **`keldaState.getLastRoute()`** reopens the last teacher screen after re-unlock —
   keep that behavior when touching login routing.
8. **Firebase RTDB region is asia-southeast1** — writes from far away are slower;
   the 8s `fw` timeout exists because of this.
