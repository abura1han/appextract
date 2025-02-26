FROM ubuntu:latest

# Set environment variables
ENV ANDROID_HOME=/root/Android
ENV PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$PATH
ENV PATH=$ANDROID_HOME/platform-tools:$PATH
ENV PATH=$ANDROID_HOME/emulator:$PATH
ENV PATH=$ANDROID_HOME/tools:$PATH
ENV PATH=$ANDROID_HOME/tools/bin:$PATH
ENV PATH=$ANDROID_HOME/build-tools/34.0.0:$PATH

# Install dependencies
RUN apt-get update && apt-get install -y \
    openjdk-17-jdk \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Create directories
RUN mkdir -p $ANDROID_HOME/cmdline-tools && cd $ANDROID_HOME/cmdline-tools \
    && wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip \
    && unzip cmdline-tools.zip \
    && mv cmdline-tools latest \
    && rm cmdline-tools.zip

# Accept licenses automatically
RUN yes | sdkmanager --licenses || true

# Install Android SDK Build-Tools and Platform-Tools
RUN sdkmanager --install "platform-tools" "build-tools;34.0.0"

# Verify installation
RUN aapt2 version

CMD ["/bin/bash"]
