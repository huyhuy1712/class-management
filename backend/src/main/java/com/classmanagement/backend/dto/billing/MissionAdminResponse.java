package com.classmanagement.backend.dto.billing;

import com.classmanagement.backend.entity.billing.Mission;
import com.classmanagement.backend.entity.enums.MissionType;
import java.time.OffsetDateTime;

public record MissionAdminResponse(
        Long id,
        String code,
        String name,
        String description,
        int rewardPoints,
        MissionType missionType,
        int targetValue,
        String status,
        int sortOrder,
        OffsetDateTime startsAt,
        OffsetDateTime endsAt) {
    public static MissionAdminResponse from(Mission mission) {
        return new MissionAdminResponse(
                mission.getId(), mission.getCode(), mission.getName(), mission.getDescription(),
                mission.getRewardPoints(), mission.getMissionType(), mission.getTargetValue(),
                mission.getStatus(), mission.getSortOrder(), mission.getStartsAt(), mission.getEndsAt());
    }
}
