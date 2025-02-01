
package com.protron.Protron.dao;

import com.protron.Protron.entities.Timesheet;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Repository
public class TimesheetDAO {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Fetch timesheet details along with tasks for a given employee.
     */
    public List<Timesheet> getTimesheetsForEmployee(Long employeeId) {
        String queryStr = "SELECT t FROM Timesheet t JOIN FETCH t.tasks WHERE t.employee.employeeId = :employeeId";
        TypedQuery<Timesheet> query = entityManager.createQuery(queryStr, Timesheet.class);
        query.setParameter("employeeId", employeeId);
        return query.getResultList();
    }

    /**
     * Fetch timesheets pending for approval by a manager.
     */
    public List<Map<String, Object>> getPendingApprovals(String managerId) {
        String queryStr = "SELECT t.timesheetId, e.email, t.status FROM Timesheet t " +
                "JOIN t.employee e WHERE t.status = 'Pending' AND t.employee.employeeId = :managerId";

        List<Object[]> results = entityManager.createQuery(queryStr, Object[].class)
                .setParameter("managerId", managerId)
                .getResultList();

        return results.stream().map(record -> Map.of(
                "timesheetId", record[0],
                "employeeEmail", record[1],
                "status", record[2])).collect(Collectors.toList());
    }

    /**
     * Approve a timesheet by updating its status.
     */
    public void approveTimesheet(String taskId, String managerId) {
        String queryStr = "UPDATE Timesheet t SET t.status = 'Approved' WHERE t.timesheetId = :taskId";
        entityManager.createQuery(queryStr)
                .setParameter("taskId", taskId)
                .executeUpdate();
    }

    /**
     * Reject a timesheet by updating its status and adding a rejection reason.
     */
    public void rejectTimesheet(String taskId, String managerId, String reason) {
        String queryStr = "UPDATE Timesheet t SET t.status = 'Rejected' WHERE t.timesheetId = :taskId";
        entityManager.createQuery(queryStr)
                .setParameter("taskId", taskId)
                .executeUpdate();
    }

    /**
     * Resubmit a rejected timesheet for approval.
     */
    public void resubmitTimesheet(String taskId, String employeeId) {
        String queryStr = "UPDATE Timesheet t SET t.status = 'Pending' WHERE t.timesheetId = :taskId";
        entityManager.createQuery(queryStr)
                .setParameter("taskId", taskId)
                .executeUpdate();
    }

    
}
