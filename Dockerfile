FROM maven:3.9.11-eclipse-temurin-17 AS build
WORKDIR /build
COPY qik-backend/pom.xml ./pom.xml
COPY qik-backend/src ./src
RUN mvn --batch-mode package

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
RUN groupadd --system qik && useradd --system --gid qik qik
COPY --from=build /build/target/qik-backend-0.0.1-SNAPSHOT.jar app.jar
USER qik
EXPOSE 8080
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=65.0 -XX:+ExitOnOutOfMemoryError"
ENTRYPOINT ["java","-jar","/app/app.jar"]
