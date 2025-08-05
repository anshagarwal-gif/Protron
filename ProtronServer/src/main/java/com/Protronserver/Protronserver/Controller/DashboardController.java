package com.Protronserver.Protronserver.Controller;

import com.Protronserver.Protronserver.DashboardRecords.*;
import com.Protronserver.Protronserver.Service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/summary-stats")
    public ResponseEntity<SummaryStatsDTO> getSummaryStats() {
        return ResponseEntity.ok(dashboardService.getSummaryStats());
    }

    @GetMapping("/project-status-pie")
    public ResponseEntity<List<ProjectStatusDTO>> getStatusPie() {
        return ResponseEntity.ok(dashboardService.getProjectStatusPie());
    }

    @GetMapping("/project-team-count")
    public ResponseEntity<List<ProjectTeamCountDTO>> getProjectTeamCounts() {
        return ResponseEntity.ok(dashboardService.getProjectTeamCounts());
    }

    @GetMapping("/project-values")
    public ResponseEntity<List<ProjectValueDTO>> getProjectValues() {
        return ResponseEntity.ok(dashboardService.getProjectValues());
    }

    @GetMapping("/monthly-invoice-trend")
    public ResponseEntity<List<InvoiceTrendDTO>> getInvoiceTrends() {
        return ResponseEntity.ok(dashboardService.getMonthlyInvoiceTrends());
    }

    @GetMapping("/po-vs-invoice")
    public ResponseEntity<List<PoVsInvoiceDTO>> getPoVsInvoice() {
        return ResponseEntity.ok(dashboardService.getPoVsInvoice());
    }

}
