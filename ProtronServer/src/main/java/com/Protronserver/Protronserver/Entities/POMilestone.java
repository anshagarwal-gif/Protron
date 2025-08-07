package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Date;

@Entity
@Table(name = "po_milestone")
public class POMilestone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ms_id")
    private Long msId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "po_id", referencedColumnName = "po_id", nullable = false)
    private PODetails poDetail;

    @Column(name = "po_number")
    private String poNumber;

    @Column(name = "ms_name")
    private String msName;

    @Column(name = "ms_desc")
    private String msDesc;

    @Column(name = "ms_amount")
    private Integer msAmount;

    @Column(name = "ms_currency")
    private String msCurrency;

    @Column(name = "ms_date")
    private Date msDate;

    @Column(name = "ms_duration")
    private Integer msDuration;

    @Column(name = "ms_remarks")
    private String msRemarks;

    @Column(name = "start_timestamp")
    private LocalDateTime startTimestamp;

    @Column(name = "last_update_by")
    private String lastUpdateBy;

    @Column(name = "end_timestamp")
    private LocalDateTime endTimestamp;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    // Getters and Setters

    public Long getTenantId() {
        return tenantId;
    }

    public void setTenantId(Long tenantId) {
        this.tenantId = tenantId;
    }

    public Long getMsId() {
        return msId;
    }

    public void setMsId(Long msId) {
        this.msId = msId;
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

    public String getMsName() {
        return msName;
    }

    public void setMsName(String msName) {
        this.msName = msName;
    }

    public String getMsDesc() {
        return msDesc;
    }

    public void setMsDesc(String msDesc) {
        this.msDesc = msDesc;
    }

    public Integer getMsAmount() {
        return msAmount;
    }

    public void setMsAmount(Integer msAmount) {
        this.msAmount = msAmount;
    }

    public String getMsCurrency() {
        return msCurrency;
    }

    public void setMsCurrency(String msCurrency) {
        this.msCurrency = msCurrency;
    }

    public Date getMsDate() {
        return msDate;
    }

    public void setMsDate(Date msDate) {
        this.msDate = msDate;
    }

    public Integer getMsDuration() {
        return msDuration;
    }

    public void setMsDuration(Integer msDuration) {
        this.msDuration = msDuration;
    }

    public String getMsRemarks() {
        return msRemarks;
    }

    public void setMsRemarks(String msRemarks) {
        this.msRemarks = msRemarks;
    }

    public LocalDateTime getStartTimestamp() {
        return startTimestamp;
    }

    public void setStartTimestamp(LocalDateTime startTimestamp) {
        this.startTimestamp = startTimestamp;
    }

    public String getLastUpdateBy() {
        return lastUpdateBy;
    }

    public void setLastUpdateBy(String lastUpdateBy) {
        this.lastUpdateBy = lastUpdateBy;
    }

    public LocalDateTime getEndTimestamp() {
        return endTimestamp;
    }

    public void setEndTimestamp(LocalDateTime endTimestamp) {
        this.endTimestamp = endTimestamp;
    }
}
