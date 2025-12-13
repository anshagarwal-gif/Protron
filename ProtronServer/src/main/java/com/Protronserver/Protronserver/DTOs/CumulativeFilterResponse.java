package com.Protronserver.Protronserver.DTOs;



import com.Protronserver.Protronserver.Entities.SolutionStory;
import com.Protronserver.Protronserver.Entities.Task;

import java.util.List;

public class CumulativeFilterResponse {
    private List<Task> tasks;
    private List<SolutionStory> solutionStories;

    public CumulativeFilterResponse(List<Task> tasks, List<SolutionStory> solutionStories) {
        this.tasks = tasks;
        this.solutionStories = solutionStories;
    }

    public List<Task> getTasks() {
        return tasks;
    }

    public void setTasks(List<Task> tasks) {
        this.tasks = tasks;
    }

    public List<SolutionStory> getSolutionStories() {
        return solutionStories;
    }

    public void setSolutionStories(List<SolutionStory> solutionStories) {
        this.solutionStories = solutionStories;
    }
}
