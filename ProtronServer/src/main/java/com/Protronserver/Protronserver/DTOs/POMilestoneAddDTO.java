package com.Protronserver.Protronserver.DTOs;

import java.util.Date;

public class POMilestoneAddDTO {

    private Long poId;
    private String msName;
    private String msDesc;
    private Integer msAmount;
    private String msCurrency;
    private Date msDate;
    private Integer msDuration;
    private String msRemarks;

    public Long getPoId() {
        return poId;
    }

    public void setPoId(Long poId) {
        this.poId = poId;
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
}
