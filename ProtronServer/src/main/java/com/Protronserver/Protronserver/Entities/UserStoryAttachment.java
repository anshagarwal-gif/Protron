package com.Protronserver.Protronserver.Entities;
import jakarta.persistence.*;

@Entity
@Table(name = "user_story_attachment")

public class UserStoryAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "us_id", length = 15)
    private String usId;

    @Column(length = 255)
    private String fileName;

    @Column(length = 1000)
    private String fileUrl;

    // Getters and setters
    
}
