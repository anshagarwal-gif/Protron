package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Date;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "srn_details")
public class SRNDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "srn_id")
    private Long srnId;

    // Foreign key to PODetail
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "po_id", referencedColumnName = "po_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private PODetails poDetail;

    @Column(name = "po_number", length = 250)
    private String poNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ms_id", referencedColumnName = "ms_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "poDetail" })
    private POMilestone milestone;

    @Column(name = "srn_name", length = 100)
    private String srnName;

    @Column(name = "srn_dsc", length = 500)
    private String srnDsc;

    public enum SRNTypeEnum {
        FULL("full"),
        PARTIAL("partial");

        private final String value;

        SRNTypeEnum(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        public static boolean isValid(String value) {
            for (SRNTypeEnum type : values()) {
                if (type.getValue().equalsIgnoreCase(value)) {
                    return true;
                }
            }
            return false;
        }
    }


    @Column(name = "srn_type", nullable = false, length = 20)
    private String srnType;

    @Column(name = "srn_amount")
    private Integer srnAmount;

    @Column(name = "srn_currency")
    private String srnCurrency;

    @Column(name = "srn_remarks", length = 500)
    private String srnRemarks;

    @Column(name = "created_timestamp")
    private LocalDateTime createdTimestamp;

    @Column(name = "lastupdate_timestamp")
    private LocalDateTime lastUpdateTimestamp;

    @Column(name = "updatedby")
    private String updatedBy;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    // ------------------ Getters and Setters ------------------


    public Long getTenantId() {
        return tenantId;
    }

    public void setTenantId(Long tenantId) {
        this.tenantId = tenantId;
    }

    public Long getSrnId() {
        return srnId;
    }

    public void setSrnId(Long srnId) {
        this.srnId = srnId;
    }

    public PODetails getPoDetail() {
        return poDetail;
    }

    public void setPoDetail(PODetails poDetail) {
        this.poDetail = poDetail;
    }

    public String getPoNumber() {
        return poNumber;
    }

    public void setPoNumber(String poNumber) {
        this.poNumber = poNumber;
    }

    public POMilestone getMilestone() {
        return milestone;
    }

    public void setMilestone(POMilestone milestone) {
        this.milestone = milestone;
    }

    public String getSrnName() {
        return srnName;
    }

    public void setSrnName(String srnName) {
        this.srnName = srnName;
    }

    public String getSrnDsc() {
        return srnDsc;
    }

    public void setSrnDsc(String srnDsc) {
        this.srnDsc = srnDsc;
    }

    public Integer getSrnAmount() {
        return srnAmount;
    }

    public void setSrnAmount(Integer srnAmount) {
        this.srnAmount = srnAmount;
    }

    public String getSrnCurrency() {
        return srnCurrency;
    }

    public void setSrnCurrency(String srnCurrency) {
        this.srnCurrency = srnCurrency;
    }

    public String getSrnRemarks() {
        return srnRemarks;
    }

    public void setSrnRemarks(String srnRemarks) {
        this.srnRemarks = srnRemarks;
    }

    public LocalDateTime getCreatedTimestamp() {
        return createdTimestamp;
    }

    public void setCreatedTimestamp(LocalDateTime createdTimestamp) {
        this.createdTimestamp = createdTimestamp;
    }

    public LocalDateTime getLastUpdateTimestamp() {
        return lastUpdateTimestamp;
    }

    public void setLastUpdateTimestamp(LocalDateTime lastUpdateTimestamp) {
        this.lastUpdateTimestamp = lastUpdateTimestamp;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public String getSrnType() {
        return srnType;
    }

    public void setSrnType(String srnType) {
        if (!SRNTypeEnum.isValid(srnType)) {
            throw new IllegalArgumentException("Invalid srnType value. Allowed values: full, partial");
        }
        this.srnType = srnType.toLowerCase(); // normalize to lowercase if needed
    }
}
