package com.Protronserver.Protronserver.DTOs;

public class SRNDTO {

    private Long poId;
    private String poNumber;
    private String msName;
    private String srnName;
    private String srnDsc;
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

    public String getMsName() {
        return msName;
    }

    public void setMsName(String msName) {
        this.msName = msName;
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

}
