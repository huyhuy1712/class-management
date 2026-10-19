package com.classmanagement.backend.service.impl.material;

import com.classmanagement.backend.entity.Classroom;
import com.classmanagement.backend.entity.User;

import java.util.List;
import java.util.Map;

public record MaterialDistribution(
        List<Classroom> classrooms,
        List<User> students,
        Map<Long, Long> studentClassIds) {
}
