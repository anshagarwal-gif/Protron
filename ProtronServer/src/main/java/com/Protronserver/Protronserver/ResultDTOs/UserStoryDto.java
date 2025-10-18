package com.Protronserver.Protronserver.ResultDTOs;

import java.time.LocalDateTime;

// Using a Java 17 Record for a concise, immutable DTO
public record UserStoryDto(
                Long projectId,
                String parentId,
                String status,
                int priority,
                String summary,
                String asA,
                String iWantTo,
                String soThat,
                String acceptanceCriteria,
                String system,
                int storyPoints,
                String assignee,
                Long releaseId,
                Long sprintId) {
}
