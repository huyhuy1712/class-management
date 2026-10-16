package com.classmanagement.backend.dto.publiclookup;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicStudentLookupResponse {

    private Long id;
    private String studentCode;
    private String fullName;
    private String email;
    private String phone;
    private String avatar;
    private List<PublicClassroomResponse> classrooms;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PublicClassroomResponse {
        private Long classId;
        private String classCode;
        private String className;
        private String subjectName;
        private String teacherName;
        private String academicYear;
        private String description;
        private String status;
        private Integer absentCount;
        private Integer totalSessions;
        private List<PublicAbsenceDetail> absenceDetails;
        private List<PublicExamScoreResponse> examScores;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PublicAbsenceDetail {
        private String date;
        private String status;
        private String note;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PublicExamScoreResponse {
        private String examTitle;
        private String examType;
        private String date;
        private Double score;
        private Double maxScore;
        private String status;
        private String teacherComment;
    }
}
