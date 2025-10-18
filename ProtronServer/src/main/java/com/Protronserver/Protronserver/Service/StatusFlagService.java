package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTO.StatusFlagDTO;
import com.Protronserver.Protronserver.Entities.StatusFlag;
import com.Protronserver.Protronserver.Repository.StatusFlagRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StatusFlagService {

    @Autowired
    private StatusFlagRepository statusFlagRepository;

    // Get all status flags by status type
    public List<StatusFlagDTO> getStatusFlagsByType(String statusType) {
        System.out.println("StatusFlagService: Fetching status flags for type: " + statusType);
        try {
            List<StatusFlag> result = statusFlagRepository.findByStatusType(statusType);
            System.out.println("StatusFlagService: Found " + result.size() + " status flags");

            // Convert to DTOs to avoid serialization issues
            return result.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("StatusFlagService: Error fetching status flags: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    // Convert StatusFlag entity to DTO
    private StatusFlagDTO convertToDTO(StatusFlag statusFlag) {
        return new StatusFlagDTO(
                statusFlag.getStatusId(),
                statusFlag.getTenantId(),
                statusFlag.getStatusType(),
                statusFlag.getStatusName(),
                statusFlag.getStatusValue(),
                statusFlag.getRemarks());
    }

    // Get all status flags by status type and tenant
    public List<StatusFlag> getStatusFlagsByTypeAndTenant(String statusType, Long tenantId) {
        return statusFlagRepository.findByStatusTypeAndTenantId(statusType, tenantId);
    }

    // Get all distinct status types
    public List<String> getAllStatusTypes() {
        return statusFlagRepository.findDistinctStatusTypes();
    }

    // Get all status flags by tenant
    public List<StatusFlag> getStatusFlagsByTenant(Long tenantId) {
        return statusFlagRepository.findByTenantId(tenantId);
    }

    // Get all status flags
    public List<StatusFlag> getAllStatusFlags() {
        System.out.println("StatusFlagService: Fetching all status flags");
        try {
            List<StatusFlag> result = statusFlagRepository.findAll();
            System.out.println("StatusFlagService: Found " + result.size() + " total status flags");
            return result;
        } catch (Exception e) {
            System.err.println("StatusFlagService: Error fetching all status flags: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    // Save status flag
    public StatusFlag saveStatusFlag(StatusFlag statusFlag) {
        return statusFlagRepository.save(statusFlag);
    }

    // Delete status flag by ID
    public void deleteStatusFlag(Integer statusId) {
        statusFlagRepository.deleteById(statusId);
    }

    // Get status flag by ID
    public StatusFlag getStatusFlagById(Integer statusId) {
        return statusFlagRepository.findById(statusId).orElse(null);
    }
}
