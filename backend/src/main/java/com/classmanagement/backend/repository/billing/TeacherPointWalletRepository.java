package com.classmanagement.backend.repository.billing;

import com.classmanagement.backend.entity.billing.TeacherPointWallet;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;

public interface TeacherPointWalletRepository extends JpaRepository<TeacherPointWallet, Long> {
    @Modifying
    @Query(value = "insert into teacher_point_wallets (teacher_id) values (:teacherId) on conflict (teacher_id) do nothing", nativeQuery = true)
    void createIfMissing(@Param("teacherId") Long teacherId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select wallet from TeacherPointWallet wallet where wallet.teacherId = :teacherId")
    Optional<TeacherPointWallet> findLockedByTeacherId(@Param("teacherId") Long teacherId);
}