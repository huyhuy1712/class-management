package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.dto.exam.ClassExamResponse;
import com.classmanagement.backend.repository.exam.ExamAttemptDataRepository;
import com.classmanagement.backend.service.impl.ExamServiceImpl;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class ClassExamListTest {
    boolean authorized;
    boolean queried;
    final List<ClassExamResponse> rows = List.of(new ClassExamResponse(12L,7L,"Đề","EX-7","PUBLISHED","OPEN",
            "CLASS",60,null,null,null,3,2));
    ExamServiceImpl service() {
        var data = new ExamAttemptDataRepository(null) {
            @Override public boolean ownsExamClass(String username, Long classId) {
                assertEquals("teacher",username); assertEquals(21L,classId); return authorized;
            }
            @Override public List<ClassExamResponse> classExams(Long id) { queried=true; assertEquals(21L,id); return rows; }
        };
        return new ExamServiceImpl(null,null,null,null,null,null,data);
    }
    @Test void rejectsForeignClassBeforeReadingExamOrGradingData() {
        assertThrows(ResourceNotFoundException.class,() -> service().getClassExams("teacher",21L));
        assertFalse(queried);
        assertThrows(IllegalArgumentException.class,() -> service().getClassExams("teacher",0L));
    }
    @Test void returnsSeparateAssignmentAndGradingCountsFromBackend() {
        authorized=true;
        assertSame(rows,service().getClassExams("teacher",21L));
        assertTrue(queried);
    }
}
