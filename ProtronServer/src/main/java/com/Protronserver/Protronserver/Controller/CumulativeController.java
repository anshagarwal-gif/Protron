package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.CumulativeFilterRequest;
import com.Protronserver.Protronserver.DTOs.CumulativeFilterResponse;
import com.Protronserver.Protronserver.Entities.SolutionStory;
import com.Protronserver.Protronserver.Entities.Task;
import com.Protronserver.Protronserver.Service.SolutionStoryService;
import com.Protronserver.Protronserver.Service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cumulative")
public class CumulativeController {

    private final TaskService taskService;
    private final SolutionStoryService solutionStoryService;

    @Autowired
    public CumulativeController(TaskService taskService, SolutionStoryService solutionStoryService) {
        this.taskService = taskService;
        this.solutionStoryService = solutionStoryService;
    }

    @PostMapping("/filter")
    public ResponseEntity<CumulativeFilterResponse> filterCumulative(@RequestBody CumulativeFilterRequest request) {
        List<Task> tasks = null;
        if (request.getTaskFilter() != null) {
            tasks = taskService.getFilteredTasks(request.getTaskFilter());
        }

        List<SolutionStory> solutionStories = null;
        if (request.getSolutionStoryFilter() != null) {
            solutionStories = solutionStoryService.getFilteredStories(request.getSolutionStoryFilter());
        }

        return ResponseEntity.ok(new CumulativeFilterResponse(tasks, solutionStories));
    }
}
