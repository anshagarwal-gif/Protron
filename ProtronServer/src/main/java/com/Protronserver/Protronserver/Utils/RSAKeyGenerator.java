package com.Protronserver.Protronserver.Utils;

import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileOutputStream;
import java.security.KeyPair;
import java.security.KeyPairGenerator;

@Component
public class RSAKeyGenerator {

    private static final String KEY_FOLDER = "keys";
    private static final String PUBLIC_KEY_FILE = KEY_FOLDER + "/public.pem";
    private static final String PRIVATE_KEY_FILE = KEY_FOLDER + "/private.pem";

    public RSAKeyGenerator() {
        try {
            generateKeysIfNeeded();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate RSA keys", e);
        }
    }

    private void generateKeysIfNeeded() throws Exception {
        File folder = new File(KEY_FOLDER);
        if (!folder.exists()) folder.mkdirs();

        File publicKeyFile = new File(PUBLIC_KEY_FILE);
        File privateKeyFile = new File(PRIVATE_KEY_FILE);

        if (publicKeyFile.exists() && privateKeyFile.exists()) {
            System.out.println("✅ RSA keys already exist. Skipping generation.");
            return;
        }

        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
        keyGen.initialize(2048);
        KeyPair pair = keyGen.generateKeyPair();

        try (FileOutputStream out = new FileOutputStream(publicKeyFile)) {
            out.write(pair.getPublic().getEncoded());
        }

        try (FileOutputStream out = new FileOutputStream(privateKeyFile)) {
            out.write(pair.getPrivate().getEncoded());
        }

        System.out.println("🔐 RSA keys generated successfully in: " + folder.getAbsolutePath());
    }
}
