package com.Protronserver.Protronserver.DTOs;

public class CumulativeFilterRequest {
    private TaskFilterDTO taskFilter;
    private SolutionStoryFilterDTO solutionStoryFilter;

    public TaskFilterDTO getTaskFilter() {
        return taskFilter;
    }

    public void setTaskFilter(TaskFilterDTO taskFilter) {
        this.taskFilter = taskFilter;
    }

    public SolutionStoryFilterDTO getSolutionStoryFilter() {
        return solutionStoryFilter;
    }

    public void setSolutionStoryFilter(SolutionStoryFilterDTO solutionStoryFilter) {
        this.solutionStoryFilter = solutionStoryFilter;
    }
}
