# 🚀 Guia de Configuração e Desenvolvimento Android

## 1️⃣ Pré-requisitos

### Instalar Java Development Kit (JDK)
```bash
# Via Homebrew (macOS)
brew install openjdk@11

# Ou download direto em:
# https://www.oracle.com/java/technologies/downloads/
```

Após instalar, configure a variável de ambiente:
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 11)
```

Adicione ao seu `~/.zshrc` ou `~/.bash_profile`:
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 11)
```

### Instalar Android Studio
```bash
# Via Homebrew
brew install android-studio

# Ou download em:
# https://developer.android.com/studio
```

## 2️⃣ Configurar Android SDK

Após instalar Android Studio:

1. Abra Android Studio
2. Clique em **Android Studio → Preferences** (ou **Tools → SDK Manager**)
3. Instale:
   - SDK Platform (Android 9.0 / API 28 - conforme build.gradle.kts)
   - Android SDK Build-Tools 28
   - Android Emulator
   - Android SDK Platform-Tools

### Configurar local.properties

```bash
# Crie o arquivo local.properties na raiz do projeto
cat > /Users/leonardoviniciusdealmeida/haval-app-tool-multimidia/local.properties << 'EOF'
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
EOF
```

Substitua `YOUR_USERNAME` pelo seu nome de usuário do macOS.

## 3️⃣ Verificar Configuração

```bash
cd /Users/leonardoviniciusdealmeida/haval-app-tool-multimidia

# Verificar se gradle consegue encontrar o SDK
./gradlew --version

# Listar targets disponíveis
./gradlew tasks
```

## 4️⃣ Rodar a Aplicação

### Via Emulador Android

#### Opção A: Usar Android Studio AVD Manager
```bash
# Abra Android Studio e crie um emulador
# Tools → Device Manager → Create Device
```

#### Opção B: Linha de comando
```bash
# Listar emuladores disponíveis
emulator -list-avds

# Iniciar emulador
emulator -avd YOUR_AVD_NAME
```

### Build e Deploy

```bash
# Debug Build (instalação direta no emulador/dispositivo)
./gradlew installDebug

# Ou em uma linha
./gradlew clean build installDebug

# Release Build
./gradlew clean build bundleRelease
```

### Conectar Dispositivo Físico

```bash
# Habilitar USB Debugging no device
# Settings → Developer Options → USB Debugging

# Verificar dispositivos conectados
adb devices

# Install no dispositivo
./gradlew installDebug
```

## 5️⃣ Desenvolvimento Local

### Watch Mode (Rebuild automático)
```bash
cd cluster-widgets/air-control

# Build automático ao salvar
bun run build
```

### Atualizar app.html no Android

Após fazer mudanças no frontend:

```bash
# 1. Build do cluster-widgets/air-control
cd cluster-widgets/air-control
bun run build

# 2. Copy para Android
cp dist/app-night.html ../app/src/main/res/raw/app-night.html
cp dist/app-light.html ../app/src/main/res/raw/app-light.html

# 3. Rebuild e deploy Android
cd ../..
./gradlew clean installDebug
```

### Atalho (Shell Script)

Crie `build-and-deploy.sh`:
```bash
#!/bin/bash
set -e

echo "📦 Building cluster-widgets..."
cd cluster-widgets/air-control
bun run build
echo "✅ Cluster built"

echo "📋 Copying HTML files..."
cp dist/app-night.html ../../app/src/main/res/raw/app-night.html
cp dist/app-light.html ../../app/src/main/res/raw/app-light.html
echo "✅ HTML files copied"

echo "📱 Building and deploying Android..."
cd ../..
./gradlew clean installDebug
echo "✅ App deployed!"
```

Uso:
```bash
chmod +x build-and-deploy.sh
./build-and-deploy.sh
```

## 6️⃣ Debug e Logs

### Ver logs do app
```bash
adb logcat | grep havalshisuku
```

### Debug interativo
```bash
# Abre logcat no Android Studio
# View → Tool Windows → Logcat
```

### Debugar JavaScript no WebView
```bash
# Chrome DevTools para WebView
# Abra Chrome e vá para:
# chrome://inspect/#devices
```

## 7️⃣ Troubleshooting

### Erro: SDK not found
```bash
# Certifique-se que local.properties existe e aponta para o SDK certo
ls -la ~/Library/Android/sdk

# Se não existe, instale via Android Studio ou:
# https://developer.android.com/studio/command-line/sdkmanager
```

### Erro: Java not found
```bash
# Reinstale Java e configure JAVA_HOME
brew install openjdk@11
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 11)' >> ~/.zshrc
source ~/.zshrc
```

### Erro: Emulator not starting
```bash
# Listar AVDs
emulator -list-avds

# Criar novo AVD
avdmanager create avd -n my-avd -k "system-images;android-28;google_apis;arm64-v8a"
```

## 📱 Estrutura do Projeto

```
app/
  ├── src/main/
  │   ├── java/              # Código Kotlin/Java
  │   ├── res/
  │   │   └── raw/           # app-night.html, app-light.html (WebView)
  │   └── AndroidManifest.xml
  └── build.gradle.kts       # Config do módulo

cluster-widgets/air-control/
  ├── src/                   # Código frontend (TypeScript/JavaScript)
  ├── dist/                  # Compilado (HTML/CSS/JS)
  └── package.json

gradlew                      # Gradle Wrapper
build.gradle.kts             # Config da build
```

## 🔄 Fluxo de Desenvolvimento

1. **Editar frontend** → `cluster-widgets/air-control/src/**`
2. **Build frontend** → `bun run build`
3. **Copy HTML** → `dist/app-*.html` → `app/src/main/res/raw/`
4. **Build Android** → `./gradlew installDebug`
5. **Test no emulador/device**

## 🎯 Quick Start

```bash
# Setup completo
./gradlew --version
emulator -avd your-avd-name &  # Iniciar emulador em background

# Terminal 1: Watch frontend
cd cluster-widgets/air-control && bun run build

# Terminal 2: Build & deploy
./build-and-deploy.sh

# Terminal 3: Ver logs
adb logcat | grep havalshisuku
```

---

**Precisa de ajuda?**
- [Android Developer Guide](https://developer.android.com/guide)
- [Gradle Documentation](https://docs.gradle.org/)
- [Kotlin for Android](https://kotlinlang.org/docs/android-overview.html)
