package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;
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

    @Column(name = "po_number", length = 250)
    private String poNumber;

    @Column(name = "ms_name", length = 250)
    private String msName;

    @Column(name = "ms_desc", length = 500)
    private String msDesc;

    @Column(name = "ms_amount")
    private Integer msAmount;

    @Column(name = "ms_currency", length = 10)
    private String msCurrency;

    @Temporal(TemporalType.DATE)
    @Column(name = "ms_date")
    private Date msDate;

    @Column(name = "ms_duration")
    private Integer msDuration;

    @Column(name = "ms_remarks", length = 500)
    private String msRemarks;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "start_timestamp")
    private Date startTimestamp;

    @Column(name = "last_update_by")
    private String lastUpdateBy;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "end_timestamp")
    private Date endTimestamp;

    // Getters and Setters

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

    public Date getStartTimestamp() {
        return startTimestamp;
    }

    public void setStartTimestamp(Date startTimestamp) {
        this.startTimestamp = startTimestamp;
    }

    public String getLastUpdateBy() {
        return lastUpdateBy;
    }

    public void setLastUpdateBy(String lastUpdateBy) {
        this.lastUpdateBy = lastUpdateBy;
    }

    public Date getEndTimestamp() {
        return endTimestamp;
    }

    public void setEndTimestamp(Date endTimestamp) {
        this.endTimestamp = endTimestamp;
    }
}
