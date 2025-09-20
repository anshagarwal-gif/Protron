package com.Protronserver.Protronserver.ResultDTOs;

public record SolutionStoryDto(
        Long projectId,
        String parentId,
        String status,
        int priority,
        String summary,
        String description,
        String system,
        int storyPoints,
        String assignee,
        Long releaseId,
        Long sprintId
) {}

