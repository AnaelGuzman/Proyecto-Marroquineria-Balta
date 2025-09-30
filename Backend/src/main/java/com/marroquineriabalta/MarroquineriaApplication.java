package com.marroquineriabalta;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MarroquineriaApplication {

    public static void main(String[] args) {
        SpringApplication.run(MarroquineriaApplication.class, args);
        System.out.println("===========================================");
        System.out.println("✓ Backend Marroquinería Balta iniciado");
        System.out.println("✓ Puerto: 8080");
        System.out.println("✓ API disponible en: http://localhost:8080/api");
        System.out.println("===========================================");
    }
}
