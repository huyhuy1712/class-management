package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.dto.subject.SubjectResponse;
import com.classmanagement.backend.dto.subject.SubjectRequest;
import com.classmanagement.backend.entity.Subject;
import com.classmanagement.backend.exception.ResourceNotFoundException;
import com.classmanagement.backend.repository.SubjectRepository;
import com.classmanagement.backend.service.SubjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubjectServiceImpl implements SubjectService {

    private final SubjectRepository subjectRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SubjectResponse> getAllSubjects() {

        return subjectRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public SubjectResponse createSubject(SubjectRequest request) {
        String code = request.getCode().trim();
        ensureCodeAvailable(code, null);

        Subject subject = Subject.builder()
                .name(request.getName().trim())
                .code(code)
                .description(normalizeDescription(request.getDescription()))
                .build();

        return toResponse(subjectRepository.save(subject));
    }

    @Override
    @Transactional
    public SubjectResponse updateSubject(Long subjectId, SubjectRequest request) {
        Subject subject = findSubject(subjectId);
        String code = request.getCode().trim();
        ensureCodeAvailable(code, subjectId);

        subject.setName(request.getName().trim());
        subject.setCode(code);
        subject.setDescription(normalizeDescription(request.getDescription()));
        return toResponse(subjectRepository.save(subject));
    }

    @Override
    @Transactional
    public void deleteSubject(Long subjectId) {
        subjectRepository.delete(findSubject(subjectId));
        subjectRepository.flush();
    }

    private Subject findSubject(Long subjectId) {
        return subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy môn học"));
    }

    private void ensureCodeAvailable(String code, Long subjectId) {
        boolean exists = subjectId == null
                ? subjectRepository.existsByCode(code)
                : subjectRepository.existsByCodeAndIdNot(code, subjectId);
        if (exists) {
            throw new IllegalArgumentException("Mã môn học đã tồn tại");
        }
    }

    private String normalizeDescription(String description) {
        return description == null || description.isBlank() ? null : description.trim();
    }

    private SubjectResponse toResponse(Subject subject) {

        return SubjectResponse.builder()
                .id(subject.getId())
                .name(subject.getName())
                .code(subject.getCode())
                .description(subject.getDescription())
                .build();
    }
}