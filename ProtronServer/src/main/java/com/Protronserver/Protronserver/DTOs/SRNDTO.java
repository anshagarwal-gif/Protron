package com.Protronserver.Protronserver.DTOs;

public class SRNDTO {

    private Long poId;
    private String poNumber;
    private Long msId;
    private String srnName;
    private String srnDsc;
    private String srnType;
    private Integer srnAmount;
    private String srnCurrency;
    private String srnRemarks;

    // Getters and Setters
    public Long getPoId() {
        return poId;
    }

    public void setPoId(Long poId) {
        this.poId = poId;
    }

    public String getPoNumber() {
        return poNumber;
    }

    public void setPoNumber(String poNumber) {
        this.poNumber = poNumber;
    }

    public Long getMsId() {
        return msId;
    }

    public void setMsId(Long msId) {
        this.msId = msId;
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

    public String getSrnType() {
        return srnType;
    }

    public void setSrnType(String srnType) {
        this.srnType = srnType;
    }
}
