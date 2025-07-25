package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;
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
    @JoinColumn(name = "ms_id", referencedColumnName = "ms_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "poDetail" })
    private POMilestone milestone;

    @Column(name = "srn_name", length = 100)
    private String srnName;

    @Column(name = "srn_dsc", length = 500)
    private String srnDsc;

    @Column(name = "srn_amount")
    private Integer srnAmount;

    @Column(name = "srn_currency")
    private String srnCurrency;

    @Column(name = "srn_remarks", length = 500)
    private String srnRemarks;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_timestamp")
    private Date createdTimestamp;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "lastupdate_timestamp")
    private Date lastUpdateTimestamp;

    @Column(name = "updatedby")
    private String updatedBy;

    // ------------------ Getters and Setters ------------------

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

    public Date getCreatedTimestamp() {
        return createdTimestamp;
    }

    public void setCreatedTimestamp(Date createdTimestamp) {
        this.createdTimestamp = createdTimestamp;
    }

    public Date getLastUpdateTimestamp() {
        return lastUpdateTimestamp;
    }

    public void setLastUpdateTimestamp(Date lastUpdateTimestamp) {
        this.lastUpdateTimestamp = lastUpdateTimestamp;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}
