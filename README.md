# Sona - Adaptive Ambient Music App

An Endel-inspired app with adaptive ambient music + 3D visual environments that respond in real-time to time of day, weather, heart rate, and season.

## 🎯 Project Status

**Current Phase**: Phase 1 - Foundation Setup ✅ COMPLETE

### Phase 1 Completion Checklist
- ✅ Expo project initialized with TypeScript
- ✅ Project structure created (folders, initial files)
- ✅ Expo Router configured for file-based navigation
- ✅ Design system and theme constants
- ✅ Supabase client and auth service
- ✅ RevenueCat SDK integration
- ✅ Base UI components (Button, Card, Slider, Toggle, Modal, TextInput)
- ✅ Auth store with Zustand
- ✅ Auth screens (signin, signup)
- ✅ Error boundaries and logging

## 🚀 Getting Started

### Quick Start

**New to the project?** Follow the step-by-step guide:
👉 **[First Run Guide](./docs/FIRST_RUN.md)** - Complete walkthrough for your first build

**Already set up?** Just need to run:
```bash
npm start
# Press 'i' for iOS
```

### Documentation

- 📖 **[First Run Guide](./docs/FIRST_RUN.md)** - Step-by-step for first-time setup (START HERE!)
- 🏗️ **[Building the App](./docs/BUILDING_THE_APP.md)** - Detailed build process and troubleshooting
- ⚡ **[Quick Start](./docs/QUICKSTART.md)** - 5-minute setup (if you know Expo)
- 🔌 **[Running Without RevenueCat](./docs/RUNNING_WITHOUT_REVENUECAT.md)** - Skip subscriptions for now

### Prerequisites

- Node.js 18+
- **Xcode** (for iOS) or **Android Studio** (for Android)
- Supabase account (free tier works)

**Note**: This app uses native modules, so Expo Go is not supported. You need a development build (handled by `npx expo run:ios`).

## 📁 Project Structure

```
sona-app/
├── app/                      # Expo Router pages
│   ├── _layout.tsx          # Root layout with providers
│   ├── index.tsx            # Entry point
│   ├── (auth)/              # Auth screens
│   ├── (main)/              # Main app screens
│   └── (onboarding)/        # Onboarding flow
├── src/
│   ├── audio/               # Audio engine (Phase 2)
│   ├── rendering/           # 3D rendering (Phase 4)
│   ├── integration/         # Integration layer (Phase 5)
│   ├── stores/              # Zustand state management
│   ├── services/            # API & external services
│   ├── components/          # React components
│   │   ├── ui/             # Base UI components
│   │   ├── player/         # Player components (Phase 6)
│   │   └── mixer/          # Mixer components (Phase 6)
│   ├── hooks/              # Custom React hooks
│   ├── constants/          # Theme & config constants
│   ├── types/              # TypeScript types
│   └── lib/                # Utilities & helpers
├── assets/
│   └── audio/              # Audio loops & manifests
└── docs/                   # Documentation
```

## 🎨 Design System

### Colors
- Background: `#0A0A0B`
- Surface: `#141416`
- Primary (Teal): `#2DD4BF`
- Text: `#FAFAFA`
- Text Secondary: `#A1A1AA`

### Typography
- Font sizes: xs (12) to xxxl (48)
- Font weights: 300 (light) to 700 (bold)

### Spacing
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, xxl: 48px

## 🔧 Tech Stack

### Core
- **React Native** 0.81.5
- **Expo** 54.0.33
- **TypeScript** 5.9.2
- **Expo Router** 6.0.23 (file-based navigation)

### State Management
- **Zustand** 4.5.0

### Backend & Services
- **Supabase** 2.39.0 (Auth, Database)
- **RevenueCat** 7.0.0 (Subscriptions)

### UI & Animations
- **React Native Reanimated** 3.6.0
- **React Native Safe Area Context** 5.6.0

## 📚 Documentation

- [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md) - Complete 11-week roadmap
- See `docs/` folder for detailed phase documentation

## 🔐 Environment Variables

Environment variables (see `.env.example`):

```bash
# Supabase (REQUIRED for auth)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# RevenueCat (OPTIONAL - app runs without these)
# EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=
# EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=
```

**Note**: The app will run without RevenueCat credentials. Subscription features will simply be disabled, and all users will be treated as free tier.

## 📋 Next Steps (Phase 2)

Phase 2 will focus on building the audio engine core:

1. Setup react-native-audio-api
2. Implement AudioEngine, LayerManager, AudioLayer
3. Create LoopLibrary with metadata system
4. Build 3 initial soundscape modes (Focus, Relax, Sleep)
5. Source/create initial 30 audio loops
6. Implement crossfading system
7. Add binaural beat synthesis
8. Create effects chain (reverb, filter, compression)

See [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md) for full details.

## 🤝 Contributing

This is a personal project, but feedback and suggestions are welcome!

## 📄 License

Private - All Rights Reserved

## 🎵 About

Sona is an adaptive ambient music app inspired by Endel, combining real-time audio generation with immersive 3D visuals that respond to your environment and biometrics.

**Vision**: Help people focus, relax, and sleep better through adaptive soundscapes.

**Differentiation**:
- Full 3D backgrounds (not just minimal UI)
- Transparent pricing (cheap monthly, annual, lifetime)
- Hybrid audio approach (loops + synthesis)
- iOS-first with future Android support
