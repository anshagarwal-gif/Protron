package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;

@Entity
@Table(name = "solution_story_attachment")

public class SolutionStoryAttachment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ss_id", length = 15)
    private String ssId;

    @Column(length = 255)
    private String fileName;

    @Column(length = 1000)
    private String fileUrl;

}
