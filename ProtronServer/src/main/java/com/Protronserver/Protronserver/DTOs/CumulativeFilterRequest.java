package com.Protronserver.Protronserver.DTOs;

public class CumulativeFilterRequest {
    private TaskFilterDTO taskFilter;
    private SolutionStoryFilterDTO solutionStoryFilter;

    private Integer page = 0;
    private Integer size = 20;

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

    public Integer getPage() {
        return page;
    }

    public void setPage(Integer page) {
        this.page = page;
    }

    public Integer getSize() {
        return size;
    }

    public void setSize(Integer size) {
        this.size = size;
    }
}
