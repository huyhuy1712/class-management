package com.classmanagement.backend.controller;

import com.classmanagement.backend.dto.billing.MissionAdminResponse;
import com.classmanagement.backend.dto.billing.MissionRequest;
import com.classmanagement.backend.entity.billing.Mission;
import com.classmanagement.backend.repository.billing.MissionRepository;
import com.classmanagement.backend.service.AdminActivityService;
import com.classmanagement.backend.service.billing.BillingService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
    private final MissionRepository missionRepository;
    private final AdminActivityService adminActivityService;

    @GetMapping
    public List<MissionAdminResponse> list() {
        return billingService.adminMissions();
    }

    @PostMapping
    public ResponseEntity<MissionAdminResponse> create(
            @Valid @RequestBody MissionRequest request,
            Authentication authentication) {
        MissionAdminResponse mission = billingService.createMission(request);
        adminActivityService.recordByUsername(
                authentication.getName(), "CREATE", "MISSION", mission.id(),
                "Tạo nhiệm vụ: " + mission.name() + " · " + mission.rewardPoints() + " Point");
        return ResponseEntity.status(HttpStatus.CREATED).body(mission);
    }

    @PutMapping("/{missionId}")
    public MissionAdminResponse update(
            @PathVariable Long missionId,
            @Valid @RequestBody MissionRequest request,
            Authentication authentication) {
        MissionAdminResponse mission = billingService.updateMission(missionId, request);
        adminActivityService.recordByUsername(
                authentication.getName(), "UPDATE", "MISSION", missionId,
                "Cập nhật nhiệm vụ: " + mission.name() + " · " + mission.rewardPoints()
                        + " Point · " + mission.status());
        return mission;
    }

    @DeleteMapping("/{missionId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long missionId,
            Authentication authentication) {
        Mission mission = missionRepository.findById(missionId).orElse(null);
        billingService.deleteMission(missionId);
        adminActivityService.recordByUsername(
                authentication.getName(), "DELETE", "MISSION", missionId,
                "Xóa nhiệm vụ: " + (mission == null ? "nhiệm vụ #" + missionId : mission.getName()));
        return ResponseEntity.noContent().build();
    }
}
