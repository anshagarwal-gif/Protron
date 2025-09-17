package com.Protronserver.Protronserver.Entities;
import jakarta.persistence.*;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "solution_story")

public class SolutionStory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ss_id", length = 15, unique=true)
    @Pattern(regexp = "SS-\\d{6}", message = "Solution Story ID must be in the format 'SS-000012'")
    private String ssId;

    @Column(name = "tenant_id", length = 15)
    private String tenantId;

    @Column(name = "project_id", length = 15)
    private String projectId;

    @Column(name = "parent_id", length = 15)
    private String parentId;

    @Column(name = "us_id", length = 15)
    private String userStoryId;

    @Column(length = 3)
    private int priority;

    @Column(length = 500)
    private String summary;

    @Column(length = 500)
    private String description;

    @Column(length = 50)
    private String system;

    @Column(name = "story_points")
    private Integer storyPoints;

    // Getters and setters
}
