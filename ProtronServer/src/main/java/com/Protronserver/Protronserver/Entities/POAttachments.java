package com.Protronserver.Protronserver.Entities;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "po_attachments")
public class POAttachments {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // PO-level
    @Column(name = "po_number")
    private String poNumber;

    @Column(name = "po_id")
    private Long poId;

    @Lob
    @Column(name = "po_attachment1")
    private byte[] poAttachment1;

    @Lob
    @Column(name = "po_attachment2")
    private byte[] poAttachment2;

    @Lob
    @Column(name = "po_attachment3")
    private byte[] poAttachment3;

    @Lob
    @Column(name = "po_attachment4")
    private byte[] poAttachment4;

    // Milestone-level
    @Column(name = "ms_id")
    private Long msId;

    @Column(name = "ms_number")
    private String msNumber;

    @Lob
    @Column(name = "ms_attachment1")
    private byte[] msAttachment1;

    @Lob
    @Column(name = "ms_attachment2")
    private byte[] msAttachment2;

    @Lob
    @Column(name = "ms_attachment3")
    private byte[] msAttachment3;

    @Lob
    @Column(name = "ms_attachment4")
    private byte[] msAttachment4;

    // SRN-level
    @Column(name = "srn_id")
    private Long srnId;

    @Column(name = "srn_name")
    private String srnName;

    @Lob
    @Column(name = "srn_attachment1")
    private byte[] srnAttachment1;

    @Lob
    @Column(name = "srn_attachment2")
    private byte[] srnAttachment2;

    @Lob
    @Column(name = "srn_attachment3")
    private byte[] srnAttachment3;

    @Lob
    @Column(name = "srn_attachment4")
    private byte[] srnAttachment4;

    // Utilization-level
    @Column(name = "utilization_id")
    private Long utilizationId;

    @Lob
    @Column(name = "utilization_attachment1")
    private byte[] utilizationAttachment1;

    @Lob
    @Column(name = "utilization_attachment2")
    private byte[] utilizationAttachment2;

    @Lob
    @Column(name = "utilization_attachment3")
    private byte[] utilizationAttachment3;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "start_timestamp")
    private Date startTimestamp;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "end_timestamp")
    private Date endTimestamp;

    @Column(name = "last_updated_by")
    private String lastUpdatedBy;

    // ------------------ Getters and Setters ------------------

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPoNumber() {
        return poNumber;
    }

    public void setPoNumber(String poNumber) {
        this.poNumber = poNumber;
    }

    public Long getPoId() {
        return poId;
    }

    public void setPoId(Long poId) {
        this.poId = poId;
    }

    public byte[] getPoAttachment1() {
        return poAttachment1;
    }

    public void setPoAttachment1(byte[] poAttachment1) {
        this.poAttachment1 = poAttachment1;
    }

    public byte[] getPoAttachment2() {
        return poAttachment2;
    }

    public void setPoAttachment2(byte[] poAttachment2) {
        this.poAttachment2 = poAttachment2;
    }

    public byte[] getPoAttachment3() {
        return poAttachment3;
    }

    public void setPoAttachment3(byte[] poAttachment3) {
        this.poAttachment3 = poAttachment3;
    }

    public byte[] getPoAttachment4() {
        return poAttachment4;
    }

    public void setPoAttachment4(byte[] poAttachment4) {
        this.poAttachment4 = poAttachment4;
    }

    public Long getMsId() {
        return msId;
    }

    public void setMsId(Long msId) {
        this.msId = msId;
    }

    public String getMsNumber() {
        return msNumber;
    }

    public void setMsNumber(String msNumber) {
        this.msNumber = msNumber;
    }

    public byte[] getMsAttachment1() {
        return msAttachment1;
    }

    public void setMsAttachment1(byte[] msAttachment1) {
        this.msAttachment1 = msAttachment1;
    }

    public byte[] getMsAttachment2() {
        return msAttachment2;
    }

    public void setMsAttachment2(byte[] msAttachment2) {
        this.msAttachment2 = msAttachment2;
    }

    public byte[] getMsAttachment3() {
        return msAttachment3;
    }

    public void setMsAttachment3(byte[] msAttachment3) {
        this.msAttachment3 = msAttachment3;
    }

    public byte[] getMsAttachment4() {
        return msAttachment4;
    }

    public void setMsAttachment4(byte[] msAttachment4) {
        this.msAttachment4 = msAttachment4;
    }

    public Long getSrnId() {
        return srnId;
    }

    public void setSrnId(Long srnId) {
        this.srnId = srnId;
    }

    public String getSrnName() {
        return srnName;
    }

    public void setSrnName(String srnName) {
        this.srnName = srnName;
    }

    public byte[] getSrnAttachment1() {
        return srnAttachment1;
    }

    public void setSrnAttachment1(byte[] srnAttachment1) {
        this.srnAttachment1 = srnAttachment1;
    }

    public byte[] getSrnAttachment2() {
        return srnAttachment2;
    }

    public void setSrnAttachment2(byte[] srnAttachment2) {
        this.srnAttachment2 = srnAttachment2;
    }

    public byte[] getSrnAttachment3() {
        return srnAttachment3;
    }

    public void setSrnAttachment3(byte[] srnAttachment3) {
        this.srnAttachment3 = srnAttachment3;
    }

    public byte[] getSrnAttachment4() {
        return srnAttachment4;
    }

    public void setSrnAttachment4(byte[] srnAttachment4) {
        this.srnAttachment4 = srnAttachment4;
    }

    public Long getUtilizationId() {
        return utilizationId;
    }

    public void setUtilizationId(Long utilizationId) {
        this.utilizationId = utilizationId;
    }

    public byte[] getUtilizationAttachment1() {
        return utilizationAttachment1;
    }

    public void setUtilizationAttachment1(byte[] utilizationAttachment1) {
        this.utilizationAttachment1 = utilizationAttachment1;
    }

    public byte[] getUtilizationAttachment2() {
        return utilizationAttachment2;
    }

    public void setUtilizationAttachment2(byte[] utilizationAttachment2) {
        this.utilizationAttachment2 = utilizationAttachment2;
    }

    public byte[] getUtilizationAttachment3() {
        return utilizationAttachment3;
    }

    public void setUtilizationAttachment3(byte[] utilizationAttachment3) {
        this.utilizationAttachment3 = utilizationAttachment3;
    }

    public Date getStartTimestamp() {
        return startTimestamp;
    }

    public void setStartTimestamp(Date startTimestamp) {
        this.startTimestamp = startTimestamp;
    }

    public Date getEndTimestamp() {
        return endTimestamp;
    }

    public void setEndTimestamp(Date endTimestamp) {
        this.endTimestamp = endTimestamp;
    }

    public String getLastUpdatedBy() {
        return lastUpdatedBy;
    }

    public void setLastUpdatedBy(String lastUpdatedBy) {
        this.lastUpdatedBy = lastUpdatedBy;
    }
}
