# 1. 빌드: JAR 파일만 생성
FROM eclipse-temurin:17-jdk-alpine AS builder

# 프로젝트 JAR 파일을 빌드 (Gradle의 bootJar 태스크를 사용한다고 가정)
WORKDIR /app
COPY build.gradle settings.gradle ./
COPY src ./src
# build.gradle에 bootBuildImage 태스크가 있지만, 여기서는 수동 빌드 명령 사용
# `./gradlew bootJar` 실행하여 JAR 파일 생성
RUN ./gradlew bootJar --no-daemon


# 2. 실행: JRE 환경에서 JAR 파일 실행
FROM openjdk:17-jre-slim

# Timezone 설정 (서버 로그 시간)
ENV TZ Asia/Seoul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 포트 설정
EXPOSE 8080

# 작업 디렉토리 설정
WORKDIR /app

# 빌드 단계에서 생성된 JAR 파일 복사
# build/libs/your-project-0.0.1-SNAPSHOT.jar 형태로 생성되었다고 가정
COPY --from=builder /app/build/libs/*.jar app.jar

# 컨테이너 실행 명령어: JAR 파일 실행 시 환경 변수를 사용하도록 설정
ENTRYPOINT ["java", "-jar", "app.jar"]
