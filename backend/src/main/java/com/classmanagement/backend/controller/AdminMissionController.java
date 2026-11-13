package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.billing.MissionAdminResponse;
import com.classmanagement.backend.dto.billing.MissionRequest;
import com.classmanagement.backend.service.billing.BillingService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/missions")
@RequiredArgsConstructor
public class AdminMissionController {
    private final BillingService billingService;

    @GetMapping
    public List<MissionAdminResponse> list() {
        return billingService.adminMissions();
    }

    @PostMapping
    public ResponseEntity<MissionAdminResponse> create(@Valid @RequestBody MissionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(billingService.createMission(request));
    }

    @PutMapping("/{missionId}")
    public MissionAdminResponse update(
            @PathVariable Long missionId, @Valid @RequestBody MissionRequest request) {
        return billingService.updateMission(missionId, request);
    }

    @DeleteMapping("/{missionId}")
    public ResponseEntity<Void> delete(@PathVariable Long missionId) {
        billingService.deleteMission(missionId);
        return ResponseEntity.noContent().build();
    }
}
