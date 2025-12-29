FROM alpine/java:17-jdk

WORKDIR /root

COPY ./target/balta-backend-1.0.0.jar .

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "balta-backend-1.0.0.jar"]