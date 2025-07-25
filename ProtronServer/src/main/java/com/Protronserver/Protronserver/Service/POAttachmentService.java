package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.Entities.POAttachments;
import com.Protronserver.Protronserver.Entities.PODetails;
import com.Protronserver.Protronserver.Repository.POAttachmentRepository;
import com.Protronserver.Protronserver.Repository.PORepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Date;
import java.util.Optional;

@Service
public class POAttachmentService {

    @Autowired
    private POAttachmentRepository poAttachmentRepository;

    @Autowired
    private PORepository poRepository;

    @Transactional
    public POAttachments addOrUpdateAttachment(String poNumber, String entityType, Long entityId, String attachmentSlot, MultipartFile file, String updatedBy) throws IOException {
        Long poId = poRepository.findPoIdByPoNumber(poNumber)
                .orElseThrow(()-> new IllegalArgumentException("Po not found with Po number: " + poNumber));
        POAttachments attachments = poAttachmentRepository.findByPoNumber(poNumber)
                .orElseGet(() -> {
                    POAttachments newAttachment = new POAttachments();
                    newAttachment.setPoNumber(poNumber);
                    newAttachment.setPoId(poId);
                    newAttachment.setStartTimestamp(new Date());
                    return newAttachment;
                });

        byte[] fileBytes = file.getBytes();
        attachments.setLastUpdatedBy(updatedBy);
        attachments.setEndTimestamp(new Date());

        switch (attachmentSlot.toLowerCase()) {
            // PO-level attachments
            case "po_attachment1":
                attachments.setPoAttachment1(fileBytes);
                break;
            case "po_attachment2":
                attachments.setPoAttachment2(fileBytes);
                break;
            case "po_attachment3":
                attachments.setPoAttachment3(fileBytes);
                break;
            case "po_attachment4":
                attachments.setPoAttachment4(fileBytes);
                break;

            // Milestone-level attachments
            case "ms_attachment1":
                attachments.setMsId(entityId);
                attachments.setMsAttachment1(fileBytes);
                break;
            case "ms_attachment2":
                attachments.setMsId(entityId);
                attachments.setMsAttachment2(fileBytes);
                break;
            case "ms_attachment3":
                attachments.setMsId(entityId);
                attachments.setMsAttachment3(fileBytes);
                break;
            case "ms_attachment4":
                attachments.setMsId(entityId);
                attachments.setMsAttachment4(fileBytes);
                break;

            // SRN-level attachments
            case "srn_attachment1":
                attachments.setSrnId(entityId);
                attachments.setSrnAttachment1(fileBytes);
                break;
            case "srn_attachment2":
                attachments.setSrnId(entityId);
                attachments.setSrnAttachment2(fileBytes);
                break;
            case "srn_attachment3":
                attachments.setSrnId(entityId);
                attachments.setSrnAttachment3(fileBytes);
                break;
            case "srn_attachment4":
                attachments.setSrnId(entityId);
                attachments.setSrnAttachment4(fileBytes);
                break;

            // Utilization-level attachments
            case "utilization_attachment1":
                attachments.setUtilizationId(entityId);
                attachments.setUtilizationAttachment1(fileBytes);
                break;
            case "utilization_attachment2":
                attachments.setUtilizationId(entityId);
                attachments.setUtilizationAttachment2(fileBytes);
                break;
            case "utilization_attachment3":
                attachments.setUtilizationId(entityId);
                attachments.setUtilizationAttachment3(fileBytes);
                break;

            default:
                throw new IllegalArgumentException("Invalid attachment slot: " + attachmentSlot);
        }

        return poAttachmentRepository.save(attachments);
    }

    @Transactional
    public POAttachments deleteAttachment(String poNumber, String attachmentSlot, String updatedBy) {
        POAttachments attachments = poAttachmentRepository.findByPoNumber(poNumber)
                .orElseThrow(() -> new IllegalArgumentException("No attachments found for PO number: " + poNumber));

        attachments.setLastUpdatedBy(updatedBy);
        attachments.setEndTimestamp(new Date());

        // Set the specified field to null
        switch (attachmentSlot.toLowerCase()) {
            case "po_attachment1": attachments.setPoAttachment1(null); break;
            case "po_attachment2": attachments.setPoAttachment2(null); break;
            case "po_attachment3": attachments.setPoAttachment3(null); break;
            case "po_attachment4": attachments.setPoAttachment4(null); break;

            case "ms_attachment1": attachments.setMsAttachment1(null); break;
            case "ms_attachment2": attachments.setMsAttachment2(null); break;
            case "ms_attachment3": attachments.setMsAttachment3(null); break;
            case "ms_attachment4": attachments.setMsAttachment4(null); break;

            case "srn_attachment1": attachments.setSrnAttachment1(null); break;
            case "srn_attachment2": attachments.setSrnAttachment2(null); break;
            case "srn_attachment3": attachments.setSrnAttachment3(null); break;
            case "srn_attachment4": attachments.setSrnAttachment4(null); break;

            case "utilization_attachment1": attachments.setUtilizationAttachment1(null); break;
            case "utilization_attachment2": attachments.setUtilizationAttachment2(null); break;
            case "utilization_attachment3": attachments.setUtilizationAttachment3(null); break;

            default:
                throw new IllegalArgumentException("Invalid attachment slot: " + attachmentSlot);
        }

        return poAttachmentRepository.save(attachments);
    }

    public Optional<POAttachments> getAttachmentsForPO(String poNumber) {
        return poAttachmentRepository.findByPoNumber(poNumber);
    }
}
