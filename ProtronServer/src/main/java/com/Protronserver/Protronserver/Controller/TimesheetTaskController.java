package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DTOs.TimesheetTaskRequestDTO;
import com.Protronserver.Protronserver.Entities.TimesheetTask;
import com.Protronserver.Protronserver.Service.TimesheetTaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/timesheet-tasks")
public class TimesheetTaskController {

    @Autowired
    private TimesheetTaskService timesheetTaskService;

    @PostMapping("/add")
    public ResponseEntity<TimesheetTask> addTimesheetTask(@RequestBody TimesheetTaskRequestDTO dto) {
        TimesheetTask savedTask = timesheetTaskService.addTask(dto);
        return ResponseEntity.ok(savedTask);
    }

    @GetMapping("/between")
    public ResponseEntity<List<TimesheetTask>> getTasksBetweenDates(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date end
    ) {
        List<TimesheetTask> tasks = timesheetTaskService.getTasksBetweenDates(start, end);

        return ResponseEntity.ok(tasks);
    }

}
