package com.Protronserver.Protronserver.Repositories;

import com.Protronserver.Protronserver.Entities.PaymentAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentAttachmentRepository extends JpaRepository<PaymentAttachment, Long> {

    Optional<PaymentAttachment> findByAttachmentId(String attachmentId);

    List<PaymentAttachment> findByPaymentPaymentId(String paymentId);

    List<PaymentAttachment> findByPaymentPaymentIdOrderByAttachmentOrderAsc(String paymentId);

    @Query("SELECT pa FROM PaymentAttachment pa WHERE pa.payment.paymentId = :paymentId AND pa.tenantId = :tenantId")
    List<PaymentAttachment> findByPaymentIdAndTenantId(@Param("paymentId") String paymentId, @Param("tenantId") Long tenantId);

    void deleteByPaymentPaymentId(String paymentId);

    @Query("SELECT COUNT(pa) FROM PaymentAttachment pa WHERE pa.payment.paymentId = :paymentId AND pa.tenantId = :tenantId")
    Long countByPaymentIdAndTenantId(@Param("paymentId") String paymentId, @Param("tenantId") Long tenantId);
}
