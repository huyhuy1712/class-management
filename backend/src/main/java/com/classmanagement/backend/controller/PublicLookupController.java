package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.publiclookup.PublicStudentLookupResponse;
import com.classmanagement.backend.service.PublicLookupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/lookup")
@RequiredArgsConstructor
public class PublicLookupController {

    private final PublicLookupService publicLookupService;

    @GetMapping("/student")
    public ResponseEntity<PublicStudentLookupResponse> lookupStudent(
            @RequestParam(name = "code") String code) {
        return ResponseEntity.ok(publicLookupService.lookupStudentByCode(code));
    }
}

