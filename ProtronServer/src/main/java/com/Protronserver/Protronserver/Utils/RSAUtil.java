package com.Protronserver.Protronserver.Utils;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Component
public class RSAUtil {

    private static final String PRIVATE_KEY_PATH = "keys/private.pem";
    private static final String PUBLIC_KEY_PATH = "keys/public.pem";

    private InputStream getKeyStream(String path) throws Exception {
        try {
            // Try from classpath (inside resources)
            return new ClassPathResource(path).getInputStream();
        } catch (Exception e) {
            // Fallback to filesystem
            File file = new File(path);
            if (file.exists()) return new FileInputStream(file);
            throw new RuntimeException("Key file not found: " + path);
        }
    }

    public PrivateKey getPrivateKey() throws Exception {
        try (InputStream is = getKeyStream(PRIVATE_KEY_PATH)) {
            byte[] bytes = is.readAllBytes();
            PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(bytes);
            return KeyFactory.getInstance("RSA").generatePrivate(spec);
        }
    }

    public PublicKey getPublicKey() throws Exception {
        try (InputStream is = getKeyStream(PUBLIC_KEY_PATH)) {
            byte[] bytes = is.readAllBytes();
            X509EncodedKeySpec spec = new X509EncodedKeySpec(bytes);
            return KeyFactory.getInstance("RSA").generatePublic(spec);
        }
    }

    public String decrypt(String encryptedText) throws Exception {
        PrivateKey privateKey = getPrivateKey();
        Cipher cipher = Cipher.getInstance("RSA");
        cipher.init(Cipher.DECRYPT_MODE, privateKey);
        byte[] decodedBytes = Base64.getDecoder().decode(encryptedText);
        return new String(cipher.doFinal(decodedBytes));
    }
}
