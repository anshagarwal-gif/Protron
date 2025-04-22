package com.Protronserver.Protronserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@SpringBootApplication
@EnableAspectJAutoProxy
public class ProtronserverApplication {

	public static void main(String[] args) {
		SpringApplication.run(ProtronserverApplication.class, args);
	}

}
