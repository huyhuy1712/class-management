package com.classmanagement.backend.repository.billing;

import com.classmanagement.backend.entity.billing.TeacherPointLedgerEntry;
import java.util.List;
import java.util.Collection;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeacherPointLedgerRepository extends JpaRepository<TeacherPointLedgerEntry, Long> {
	java.util.Optional<TeacherPointLedgerEntry> findByEventKey(String eventKey);
	List<TeacherPointLedgerEntry> findAllByEventKeyIn(Collection<String> eventKeys);

	List<TeacherPointLedgerEntry> findTop20ByTeacherIdOrderByCreatedAtDescIdDesc(Long teacherId);
}