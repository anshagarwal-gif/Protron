package com.Protronserver.Protronserver.Service;

import com.Protronserver.Protronserver.DTOs.PaymentDTO;
import com.Protronserver.Protronserver.DTOs.PaymentSettlementRequest;
import com.Protronserver.Protronserver.Entities.*;
import com.Protronserver.Protronserver.Repository.InvoiceRepository;
import com.Protronserver.Protronserver.Repository.PaymentRepository;
import com.Protronserver.Protronserver.Repositories.PaymentAttachmentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PaymentAttachmentRepository paymentAttachmentRepository;

    public PaymentDTO settleInvoice(PaymentSettlementRequest request, Long tenantId) {
        // Find the invoice
        Invoice invoice = invoiceRepository.findByInvoiceId(request.getInvoiceId())
                .orElseThrow(() -> new RuntimeException("Invoice not found: " + request.getInvoiceId()));

        // Validate tenant access
        if (!invoice.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Access denied: You don't have permission to settle this invoice");
        }

        // Validate invoice status
        if (invoice.getStatus() == InvoiceStatus.CANCELLED || invoice.getStatus() == InvoiceStatus.REFUNDED) {
            throw new RuntimeException("Cannot settle a cancelled or refunded invoice");
        }

        BigDecimal totalPaidAmount = getTotalPaidAmount(invoice.getId());
        BigDecimal outstandingAmount = invoice.getTotalAmount().subtract(totalPaidAmount);

        if (request.getSettlementType() == PaymentSettlementRequest.SettlementType.FULL_PAYMENT) {
            if (request.getSettlementAmount().compareTo(outstandingAmount) != 0) {
                throw new RuntimeException("Full payment amount must equal the outstanding amount: " + outstandingAmount);
            }
        } else if (request.getSettlementType() == PaymentSettlementRequest.SettlementType.PARTIAL_PAYMENT) {
            if (request.getSettlementAmount().compareTo(outstandingAmount) > 0) {
                throw new RuntimeException("Partial payment amount cannot exceed the outstanding amount: " + outstandingAmount);
            }
        }

        Payment payment = createPaymentFromRequest(request, invoice, tenantId);
        
        // Update invoice status based on payment
        updateInvoiceStatusAfterPayment(invoice, request.getSettlementAmount());

        payment = paymentRepository.save(payment);
        invoiceRepository.save(invoice);

        return convertToDTO(payment);
    }

    public List<PaymentDTO> settleInvoiceWithMultiplePayments(PaymentSettlementRequest request, Long tenantId) {
        Invoice invoice = invoiceRepository.findByInvoiceId(request.getInvoiceId())
                .orElseThrow(() -> new RuntimeException("Invoice not found: " + request.getInvoiceId()));

        if (!invoice.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Access denied: You don't have permission to settle this invoice");
        }

        BigDecimal totalPaidAmount = getTotalPaidAmount(invoice.getId());
        BigDecimal outstandingAmount = invoice.getTotalAmount().subtract(totalPaidAmount);

        BigDecimal totalSettlementAmount = request.getPaymentDetails().stream()
                .map(PaymentSettlementRequest.PaymentDetail::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalSettlementAmount.compareTo(outstandingAmount) > 0) {
            throw new RuntimeException("Total settlement amount cannot exceed the outstanding amount: " + outstandingAmount);
        }

        List<PaymentDTO> paymentDTOs = new ArrayList<>();

        for (PaymentSettlementRequest.PaymentDetail detail : request.getPaymentDetails()) {
            Payment payment = new Payment();
            payment.setInvoice(invoice);
            payment.setTenantId(tenantId);
            payment.setPaymentType(PaymentType.PARTIAL_PAYMENT);
            payment.setPaymentStatus(PaymentStatus.COMPLETED);
            payment.setPaymentAmount(detail.getAmount());
            payment.setOriginalAmount(detail.getAmount());
            payment.setRemainingAmount(BigDecimal.ZERO);
            payment.setCurrency(invoice.getCurrency());
            payment.setPaymentMethod(detail.getPaymentMethod());
            payment.setTransactionReference(detail.getTransactionReference());
            payment.setChequeNumber(detail.getChequeNumber());
            payment.setBankName(detail.getBankName());
            payment.setPaymentDate(detail.getPaymentDate() != null ? detail.getPaymentDate() : LocalDate.now());
            payment.setNotes(detail.getNotes());
            payment.setSettlementDate(LocalDate.now());
            payment.setSettledBy(request.getSettledBy());
            payment.setSettlementNotes(request.getSettlementNotes());
            payment.setIsPartialPayment(true);
            payment.setAutoApplyToInvoice(true);

            payment = paymentRepository.save(payment);
            paymentDTOs.add(convertToDTO(payment));
        }

        // Update invoice status
        BigDecimal newTotalPaid = totalPaidAmount.add(totalSettlementAmount);
        updateInvoiceStatusAfterPayment(invoice, totalSettlementAmount);
        invoiceRepository.save(invoice);

        return paymentDTOs;
    }

    public List<PaymentDTO> getPaymentsByInvoiceId(String invoiceId, Long tenantId) {
        Invoice invoice = invoiceRepository.findByInvoiceId(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found: " + invoiceId));

        if (!invoice.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Access denied: You don't have permission to view payments for this invoice");
        }

        List<Payment> payments = paymentRepository.findActivePaymentsByInvoiceInvoiceId(invoiceId);
        return payments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PaymentDTO getPaymentById(String paymentId, Long tenantId) {
        Payment payment = paymentRepository.findByPaymentId(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));

        if (!payment.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Access denied: You don't have permission to view this payment");
        }

        return convertToDTO(payment);
    }

    public List<PaymentDTO> getAllPaymentsByTenant(Long tenantId) {
        List<Payment> payments = paymentRepository.findAllActivePaymentsByTenant(tenantId);
        return payments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PaymentDTO reversePayment(String paymentId, String reason, String reversedBy, Long tenantId) {
        Payment payment = paymentRepository.findByPaymentId(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));

        if (!payment.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Access denied: You don't have permission to reverse this payment");
        }

        if (payment.getIsReversed()) {
            throw new RuntimeException("Payment is already reversed");
        }

        payment.reversePayment(reason, reversedBy);
        payment = paymentRepository.save(payment);

        // Update invoice status
        Invoice invoice = payment.getInvoice();
        updateInvoiceStatusAfterPaymentReversal(invoice);
        invoiceRepository.save(invoice);

        return convertToDTO(payment);
    }

    public BigDecimal getTotalPaidAmount(Long invoiceId) {
        List<PaymentStatus> paidStatuses = Arrays.asList(
                PaymentStatus.COMPLETED,
                PaymentStatus.PARTIALLY_PAID
        );
        BigDecimal total = paymentRepository.sumPaidAmountByInvoiceId(invoiceId, paidStatuses);
        return total != null ? total : BigDecimal.ZERO;
    }

    public BigDecimal getOutstandingAmount(Long invoiceId) {
        List<PaymentStatus> activeStatuses = Arrays.asList(
                PaymentStatus.COMPLETED,
                PaymentStatus.PARTIALLY_PAID,
                PaymentStatus.PROCESSING
        );
        BigDecimal remaining = paymentRepository.sumRemainingAmountByInvoiceId(invoiceId, activeStatuses);
        return remaining != null ? remaining : BigDecimal.ZERO;
    }

    private Payment createPaymentFromRequest(PaymentSettlementRequest request, Invoice invoice, Long tenantId) {
        Payment payment = new Payment();
        payment.setInvoice(invoice);
        payment.setTenantId(tenantId);
        
        // Set payment type based on settlement type
        switch (request.getSettlementType()) {
            case FULL_PAYMENT:
                payment.setPaymentType(PaymentType.FULL_PAYMENT);
                break;
            case PARTIAL_PAYMENT:
                payment.setPaymentType(PaymentType.PARTIAL_PAYMENT);
                payment.setIsPartialPayment(true);
                break;
            default:
                payment.setPaymentType(PaymentType.PARTIAL_PAYMENT);
        }

        payment.setPaymentStatus(PaymentStatus.COMPLETED);
        payment.setPaymentAmount(request.getSettlementAmount());
        payment.setOriginalAmount(request.getSettlementAmount());
        payment.setRemainingAmount(BigDecimal.ZERO);
        payment.setCurrency(invoice.getCurrency());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setTransactionReference(request.getTransactionReference());
        payment.setChequeNumber(request.getChequeNumber());
        payment.setBankName(request.getBankName());
        payment.setPaymentDate(request.getPaymentDate());
        payment.setSettlementDate(LocalDate.now());
        payment.setSettledBy(request.getSettledBy());
        payment.setSettlementNotes(request.getSettlementNotes());
        payment.setAutoApplyToInvoice(request.getAutoApplyToInvoice());

        return payment;
    }

    private void updateInvoiceStatusAfterPayment(Invoice invoice, BigDecimal paymentAmount) {
        BigDecimal totalPaid = getTotalPaidAmount(invoice.getId());
        BigDecimal totalAmount = invoice.getTotalAmount();

        if (totalPaid.compareTo(totalAmount) >= 0) {
            invoice.setStatus(InvoiceStatus.PAID);
        } else if (totalPaid.compareTo(BigDecimal.ZERO) > 0) {
            invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
        } else {
            invoice.setStatus(InvoiceStatus.SAVED);
        }
    }

    private void updateInvoiceStatusAfterPaymentReversal(Invoice invoice) {
        BigDecimal totalPaid = getTotalPaidAmount(invoice.getId());
        BigDecimal totalAmount = invoice.getTotalAmount();

        if (totalPaid.compareTo(totalAmount) >= 0) {
            invoice.setStatus(InvoiceStatus.PAID);
        } else if (totalPaid.compareTo(BigDecimal.ZERO) > 0) {
            invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
        } else {
            invoice.setStatus(InvoiceStatus.SAVED);
        }
    }

    private PaymentDTO convertToDTO(Payment payment) {
        PaymentDTO dto = new PaymentDTO();
        dto.setId(payment.getId());
        dto.setPaymentId(payment.getPaymentId());
        dto.setInvoiceId(payment.getInvoice().getInvoiceId());
        dto.setInvoiceDbId(payment.getInvoice().getId());
        dto.setPaymentType(payment.getPaymentType());
        dto.setPaymentStatus(payment.getPaymentStatus());
        dto.setPaymentAmount(payment.getPaymentAmount());
        dto.setOriginalAmount(payment.getOriginalAmount());
        dto.setTaxAmount(payment.getTaxAmount());
        dto.setDiscountAmount(payment.getDiscountAmount());
        dto.setRemainingAmount(payment.getRemainingAmount());
        dto.setCurrency(payment.getCurrency());
        dto.setPaymentMethod(payment.getPaymentMethod());
        dto.setTransactionReference(payment.getTransactionReference());
        dto.setChequeNumber(payment.getChequeNumber());
        dto.setBankName(payment.getBankName());
        dto.setNotes(payment.getNotes());
        dto.setPaymentDate(payment.getPaymentDate());
        dto.setDueDate(payment.getDueDate());
        dto.setSettlementDate(payment.getSettlementDate());
        dto.setSettledBy(payment.getSettledBy());
        dto.setSettlementNotes(payment.getSettlementNotes());
        dto.setIsPartialPayment(payment.getIsPartialPayment());
        dto.setAutoApplyToInvoice(payment.getAutoApplyToInvoice());
        dto.setIsReversed(payment.getIsReversed());
        dto.setReversedAt(payment.getReversedAt());
        dto.setReversedBy(payment.getReversedBy());
        dto.setReversalReason(payment.getReversalReason());
        dto.setCreatedAt(payment.getCreatedAt());
        dto.setUpdatedAt(payment.getUpdatedAt());

        // Additional fields
        dto.setCustomerName(payment.getInvoice().getCustomerName());
        dto.setInvoiceName(payment.getInvoice().getInvoiceName());
        dto.setInvoiceTotalAmount(payment.getInvoice().getTotalAmount());
        dto.setTotalPaidAmount(getTotalPaidAmount(payment.getInvoice().getId()));
        dto.setOutstandingAmount(getOutstandingAmount(payment.getInvoice().getId()));

        return dto;
    }

    public PaymentDTO settleInvoiceWithAttachments(PaymentSettlementRequest request, Long tenantId, List<MultipartFile> attachments) {
        // First settle the payment
        PaymentDTO paymentDTO = settleInvoice(request, tenantId);
        
        // Then add attachments
        if (attachments != null && !attachments.isEmpty()) {
            try {
                Payment payment = paymentRepository.findByPaymentId(paymentDTO.getPaymentId())
                        .orElseThrow(() -> new RuntimeException("Payment not found after settlement: " + paymentDTO.getPaymentId()));
                
                for (int i = 0; i < attachments.size() && i < 4; i++) {
                    MultipartFile file = attachments.get(i);
                    PaymentAttachment attachment = new PaymentAttachment();
                    attachment.setPayment(payment);
                    attachment.setTenantId(tenantId);
                    attachment.setAttachmentData(file.getBytes());
                    attachment.setFileName(file.getOriginalFilename());
                    attachment.setContentType(file.getContentType());
                    attachment.setFileSize(file.getSize());
                    attachment.setAttachmentOrder(i + 1);
                    
                    paymentAttachmentRepository.save(attachment);
                }
                
                log.info("Added {} attachments to payment: {}", attachments.size(), paymentDTO.getPaymentId());
            } catch (IOException e) {
                throw new RuntimeException("Error processing payment attachments: " + e.getMessage(), e);
            }
        }
        
        return paymentDTO;
    }

    public List<PaymentDTO> settleInvoiceWithMultiplePaymentsAndAttachments(PaymentSettlementRequest request, Long tenantId, List<MultipartFile> attachments) {
        // First settle multiple payments
        List<PaymentDTO> paymentDTOs = settleInvoiceWithMultiplePayments(request, tenantId);
        
        // Then add attachments to the first payment (or distribute across payments)
        if (attachments != null && !attachments.isEmpty() && !paymentDTOs.isEmpty()) {
            try {
                // For simplicity, attach all files to the first payment
                Payment firstPayment = paymentRepository.findByPaymentId(paymentDTOs.get(0).getPaymentId())
                        .orElseThrow(() -> new RuntimeException("First payment not found after settlement: " + paymentDTOs.get(0).getPaymentId()));
                
                for (int i = 0; i < attachments.size() && i < 4; i++) {
                    MultipartFile file = attachments.get(i);
                    PaymentAttachment attachment = new PaymentAttachment();
                    attachment.setPayment(firstPayment);
                    attachment.setTenantId(tenantId);
                    attachment.setAttachmentData(file.getBytes());
                    attachment.setFileName(file.getOriginalFilename());
                    attachment.setContentType(file.getContentType());
                    attachment.setFileSize(file.getSize());
                    attachment.setAttachmentOrder(i + 1);
                    
                    paymentAttachmentRepository.save(attachment);
                }
                
                log.info("Added {} attachments to first payment: {}", attachments.size(), paymentDTOs.get(0).getPaymentId());
            } catch (IOException e) {
                throw new RuntimeException("Error processing payment attachments: " + e.getMessage(), e);
            }
        }
        
        return paymentDTOs;
    }
}
