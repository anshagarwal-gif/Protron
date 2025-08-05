package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DashboardRecords.*;
import com.Protronserver.Protronserver.Repository.DashboardRepository;
import com.Protronserver.Protronserver.Repository.InvoiceRepository;
import com.Protronserver.Protronserver.Repository.PORepository;
import com.Protronserver.Protronserver.Utils.LoggedInUserUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class DashboardService {

    @Autowired
    private DashboardRepository dashboardRepo;
    @Autowired
    private InvoiceRepository invoiceRepo;
    @Autowired
    private PORepository poRepo;
    @Autowired
    private LoggedInUserUtils loggedInUserUtils;

    public SummaryStatsDTO getSummaryStats() {
        Long tenantId = getTenantId();
        return new SummaryStatsDTO(
                dashboardRepo.getTotalProjects(tenantId),
                dashboardRepo.getOpenProjects(tenantId),
                dashboardRepo.getWIPProjects(tenantId),
                dashboardRepo.getClosedProjects(tenantId)
        );
    }

    public List<ProjectStatusDTO> getProjectStatusPie() {
        Long tenantId = getTenantId();
        int total = dashboardRepo.getTotalProjects(tenantId);
        if (total == 0) return List.of();
        int open = dashboardRepo.getOpenProjects(tenantId);
        int wip = dashboardRepo.getWIPProjects(tenantId);
        int closed = dashboardRepo.getClosedProjects(tenantId);

        return List.of(
                new ProjectStatusDTO("Open", open, (open * 100.0) / total),
                new ProjectStatusDTO("WIP", wip, (wip * 100.0) / total),
                new ProjectStatusDTO("Closed", closed, (closed * 100.0) / total)
        );
    }

    public List<ProjectTeamCountDTO> getProjectTeamCounts() {
        return dashboardRepo.getTopProjectsTeamCount(getTenantId());
    }

    public List<ProjectValueDTO> getProjectValues() {
        return dashboardRepo.getTopProjectValues(getTenantId());
    }

    public List<InvoiceTrendDTO> getMonthlyInvoiceTrends() {
        List<Object[]> results = invoiceRepo.getMonthlyInvoiceTrendsRaw();

        return results.stream()
                .map(row -> new InvoiceTrendDTO(
                        row[0] != null ? row[0].toString() : null,
                        row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO
                ))
                .toList();
    }

    public List<PoVsInvoiceDTO> getPoVsInvoice() {
        return poRepo.getPoVsInvoiceData(getTenantId());
    }

    private Long getTenantId() {
        return loggedInUserUtils.getLoggedInUser().getTenant().getTenantId();
    }

}
