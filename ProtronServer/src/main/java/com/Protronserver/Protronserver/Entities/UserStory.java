package com.Protronserver.Protronserver.Entities;
import jakarta.persistence.*;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "user_story")

public class UserStory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "us_id", length = 15, unique = true)
    @Pattern(regexp = "US-\\d{6}", message = "User Story ID must be in the format 'US-000012'")
    private String usId;

    @Column(name = "tenant_id", length = 15)
    private String tenantId;

    @Column(name = "project_id", length = 15)
    private String projectId;

    @Column(name = "parent_id", length = 15)
    private String parentId;

    @Column(length = 3)
    private int priority;

    @Column(length = 500)
    private String summary;

    @Column(length = 150)
    private String asA;

    @Column(length = 500)
    private String iWantTo;

    @Column(length = 50)
    private String soThat;

    @Column(length = 1000)
    private String acceptanceCriteria;

    @Column(length = 50)
    private String system;

    @Column(name = "story_points")
    private Integer storyPoints;
}
