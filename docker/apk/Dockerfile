FROM node:22-bookworm

WORKDIR /app

# ---- Install system dependencies ----
RUN apt-get update && apt-get install -y \
    procps \
    wget \
    unzip \
    gnupg \
    && rm -rf /var/lib/apt/lists/*
RUN wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | gpg --dearmor -o /usr/share/keyrings/adoptium.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb bookworm main" > /etc/apt/sources.list.d/adoptium.list && \
    apt-get update && apt-get install -y temurin-21-jdk && \
    rm -rf /var/lib/apt/lists/*
ENV ANDROID_SDK_ROOT=/sdk
RUN mkdir -p ${ANDROID_SDK_ROOT}/cmdline-tools && \
    wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/cmdtools.zip && \
    unzip -q /tmp/cmdtools.zip -d ${ANDROID_SDK_ROOT}/cmdline-tools && \
    rm /tmp/cmdtools.zip && \
    mv ${ANDROID_SDK_ROOT}/cmdline-tools/cmdline-tools ${ANDROID_SDK_ROOT}/cmdline-tools/latest && \
    yes | ${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin/sdkmanager --sdk_root=${ANDROID_SDK_ROOT} --licenses && \
    yes | ${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin/sdkmanager --sdk_root=${ANDROID_SDK_ROOT} \
    "platform-tools" \
    "platforms;android-35" \
    "build-tools;35.0.0"
ENV ANDROID_HOME=${ANDROID_SDK_ROOT}
ENV JAVA_HOME=/usr/lib/jvm/temurin-21-jdk-amd64
ENV PATH=$PATH:${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:${ANDROID_SDK_ROOT}/platform-tools:${ANDROID_SDK_ROOT}/build-tools/35.0.0:${JAVA_HOME}/bin

RUN npm install -g @ionic/cli

COPY app/package*.json ./
RUN npm ci

COPY app/ .

COPY docker/apk/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]