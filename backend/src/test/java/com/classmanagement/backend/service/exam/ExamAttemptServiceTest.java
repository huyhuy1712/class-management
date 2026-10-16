package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.service.exam.ExamAttemptService;
import com.classmanagement.backend.service.exam.attempt.ExamScoringCalculator;

import com.classmanagement.backend.dto.exam.*;
import com.classmanagement.backend.entity.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.exception.*;
import com.classmanagement.backend.repository.UserRepository;
import com.classmanagement.backend.repository.exam.*;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class ExamAttemptServiceTest {
    private final User student=User.builder().id(21L).role(UserRole.STUDENT).status(UserStatus.ACTIVE).build();
    private final User teacher=User.builder().id(11L).role(UserRole.TEACHER).status(UserStatus.ACTIVE).build();
    private final Exam exam=Exam.builder().id(5L).teacher(teacher).status(ExamStatus.PUBLISHED).title("Exam")
            .code("EX-11-ABCDEF").timeLimit(45).maxAttempts(2).maxScore(new BigDecimal("2")).build();
    private final ExamAssignment assignment=ExamAssignment.builder().id(12L).exam(exam).status(ExamAssignmentStatus.OPEN)
            .assignmentType(ExamAssignmentType.ALL).scoreVisibility(ScoreVisibility.AFTER_SUBMIT)
            .answerVisibility(AnswerVisibility.NEVER).hideCorrectAnswerOnWrong(false).build();
    private final ExamAttempt attempt=ExamAttempt.builder().id(10L).assignment(assignment).student(student).attemptCount(1)
            .status(ExamAttemptStatus.IN_PROGRESS).startedAt(now().minusMinutes(5)).deadlineAt(now().plusMinutes(40))
            .tabSwitchCount(0).autoScore(BigDecimal.ZERO).manualScore(BigDecimal.ZERO).totalScore(BigDecimal.ZERO).build();
    private final Map<Long,ExamAttemptPayload.Value> saved=new LinkedHashMap<>();
    private final Map<Long,BigDecimal> manual=new HashMap<>();
    private final Set<UUID> events=new HashSet<>();
    private boolean exists=true,eligible=true,released=false,includeShort,runExpiry;
    private int writes,resets,hidden,structureReads,completionMarks;
    private final ExamAttemptDataRepository data=new ExamAttemptDataRepository(null) {
        @Override public Optional<ClassGradebookResponse.ClassInfo> gradebookClass(Long classId,Long teacherId) {
            return classId==31L&&teacherId==11L?Optional.of(new ClassGradebookResponse.ClassInfo(31L,"Class",1L,"Math")):Optional.empty();
        }
        @Override public ClassGradebookResponse gradebook(ClassGradebookResponse.ClassInfo classroom,Long teacherId,int page,int size,String q,Long subjectId) {
            assertEquals("student",q);
            return new ClassGradebookResponse(classroom,List.of(),List.of(),page,size,0);
        }
        @Override public boolean studentClassAllowed(Long classId,Long studentId,Long teacherId) {
            return classId==31L&&studentId==21L&&teacherId==11L;
        }
        @Override public StudentClassExamResultsResponse studentClassResults(Long classId,Long studentId,Long teacherId,int page,int size) {
            return new StudentClassExamResultsResponse(classId,studentId,List.of(),page,size,0,
                    new StudentClassExamResultsResponse.Summary(0,0,0,0,0,0,null,null,null));
        }
        @Override public boolean classAllowed(Long id,Long classId) { return classId==21L; }
        @Override public ExamAttemptResponse.Page list(Long id,int page,int size,ExamAttemptStatus status,String q,String sort,Long classId) {
            assertEquals("Student",q); assertEquals("name",sort);
            return new ExamAttemptResponse.Page(List.of(new ExamAttemptResponse.Summary(10L,21L,"Student",1,ExamAttemptStatus.GRADED,0,
                    BigDecimal.ONE,"avatar.png","ST-21","student@example.com",null,null,100,null,true,2L)),page,size,1,
                    new ExamAttemptResponse.Stats(1,0,0,1,0,1));
        }
        @Override public List<Ref> expired(LocalDateTime now) { return runExpiry?List.of(new Ref(10L,5L,21L,12L)):List.of(); }
        @Override public Optional<Long> assignmentExamId(Long id) { return Optional.of(5L); }
        @Override public Optional<Ref> ref(Long id) { return Optional.of(new Ref(id,5L,21L,12L)); }
        @Override public void reset(Long id) { resets++; saved.clear(); manual.clear(); events.clear(); hidden=0; }
        @Override public Map<Long,Map<Long,ExamAttemptPayload.Value>> readAnswers(Collection<Long> ids) { return ids.isEmpty()?Map.of():Map.of(10L,new LinkedHashMap<>(saved)); }
        @Override public Map<Long,BigDecimal> manualScores(Long id) { return new HashMap<>(manual); }
        @Override public void write(Long id,Long examId,List<ExamDetailResponse.Section> structure,Map<Long,ExamAttemptPayload.Value> values,
                ExamScoringCalculator.Scores scores,LocalDateTime now,Long teacherId) {
            writes++; saved.clear(); saved.putAll(values);
            if(scores!=null) for(var score:scores.groups()) if(score.answerId()==102L) {
                if(score.score()==null) manual.remove(102L); else manual.put(102L,score.score());
            }
        }
        @Override public int events(Long id,List<ExamAttemptPayload.Event> incoming,LocalDateTime now) {
            if(incoming!=null) for(var item:incoming) if(events.add(item.eventId())&&item.type()==ExamAttemptEventType.TAB_HIDDEN) hidden++;
            return hidden;
        }
        @Override public void completed(Long id,Long studentId,LocalDateTime now) { completionMarks++; }
        @Override public void resetCompletion(Long id,Long studentId) { completionMarks--; }
        @Override public boolean released(Long id,LocalDateTime now) { return released; }
        @Override public List<ExamAttemptResponse.Event> readEvents(Long id) { return List.of(); }
    };
    private static LocalDateTime now() { return LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")); }
    @Test void gradebookRequiresActiveOwnerAndValidFilters() {
        assertEquals(31L,service().gradebook(31L,"teacher",0,20," Student ",null).classroom().id());
        assertThrows(ResourceNotFoundException.class,()->service().gradebook(31L,"otherTeacher",0,20,"Student",null));
        assertThrows(IllegalStateException.class,()->service().gradebook(31L,"student",0,20,"Student",null));
        assertThrows(IllegalArgumentException.class,()->service().gradebook(0L,"teacher",0,20,null,null));
        assertThrows(IllegalArgumentException.class,()->service().gradebook(31L,"teacher",0,101,null,null));
        assertThrows(IllegalArgumentException.class,()->service().gradebook(31L,"teacher",0,20,null,0L));
    }
    @Test void studentScoreOverviewChecksOwnerMembershipRoleAndPagination() {
        var result=service().studentClassResults(31L,21L,"teacher",0,10);
        assertEquals(31L,result.classId()); assertEquals(0,result.totalElements());
        assertThrows(ResourceNotFoundException.class,()->service().studentClassResults(31L,21L,"otherTeacher",0,10));
        assertThrows(ResourceNotFoundException.class,()->service().studentClassResults(31L,99L,"teacher",0,10));
        assertThrows(IllegalStateException.class,()->service().studentClassResults(31L,21L,"student",0,10));
        assertThrows(IllegalArgumentException.class,()->service().studentClassResults(0L,21L,"teacher",0,10));
        assertThrows(IllegalArgumentException.class,()->service().studentClassResults(31L,21L,"teacher",-1,10));
        assertThrows(IllegalArgumentException.class,()->service().studentClassResults(31L,21L,"teacher",0,101));
    }
    @Test void commentOnlyPreservesScoresAndAnswerRowsAndAllowsClear() {
        service().submit(10L,"student",payload(List.of(choice(201))));
        var score=attempt.getTotalScore(); int priorWrites=writes;
        service().grade(10L,"teacher",new ExamAttemptPayload.Grades(1,attempt.getRevision(),null,"  Nhận xét  "));
        assertEquals("Nhận xét",attempt.getTeacherComment());
        assertEquals(score,attempt.getTotalScore()); assertEquals(priorWrites,writes);
        service().grade(10L,"teacher",new ExamAttemptPayload.Grades(1,attempt.getRevision(),List.of(),"  "));
        assertNull(attempt.getTeacherComment()); assertEquals(priorWrites,writes);
    }
    @Test void emptyGradePatchIsRejectedAndCommentCannotBypassRevisionOrState() {
        assertThrows(ConflictException.class,()->service().grade(10L,"teacher",new ExamAttemptPayload.Grades(1,0L,null,"Hi")));
        service().submit(10L,"student",payload(List.of(choice(201))));
        assertThrows(ExamValidationException.class,()->service().grade(10L,"teacher",new ExamAttemptPayload.Grades(1,attempt.getRevision(),List.of(),null)));
        assertThrows(ConflictException.class,()->service().grade(10L,"teacher",new ExamAttemptPayload.Grades(1,999L,null,"Hi")));
    }
    @Test void invalidSubmissionFiltersAreRejectedBeforeRepositoryReads() {
        assertThrows(IllegalArgumentException.class,()->service().list(12L,"teacher",0,20,null,"x","injected sql",null));
        assertThrows(IllegalArgumentException.class,()->service().list(12L,"teacher",0,20,null,"x".repeat(201),"newest",null));
    }
    @Test void ownerCanListCardsAndResolveAvatarButOthersCannot() {
        var result=service().list(12L,"teacher",0,20,null,"  Student  ","name",null);
        assertEquals("https://storage/avatar.png",result.items().getFirst().avatarUrl());
        assertEquals(1,result.totalElements());
        assertThrows(ResourceNotFoundException.class,()->service().list(12L,"otherTeacher",0,20,null,"Student","name",null));
        assertThrows(IllegalStateException.class,()->service().list(12L,"student",0,20,null,"Student","name",null));
    }
    @Test void classFilterMustBePositiveAndBelongToAssignment() {
        assertThrows(IllegalArgumentException.class,()->service().list(12L,"teacher",0,20,null,"Student","name",0L));
        assertThrows(ResourceNotFoundException.class,()->service().list(12L,"teacher",0,20,null,"Student","name",99L));
        assertEquals(1,service().list(12L,"teacher",0,20,null,"Student","name",21L).totalElements());
    }
    @Test void explanationIsHiddenDuringAttemptAndReturnedOnlyWithAnswerPermission() {
        assertNull(service().get(10L,"student").sections().getFirst().questions().getFirst().explanation());
        assertNull(service().get(10L,"student").sections().getFirst().questions().getFirst().explanationImageMedia());
        assertNull(service().get(10L,"student").sections().getFirst().questions().getFirst().explanationAudioMedia());
        var hiddenResult=service().submit(10L,"student",payload(List.of(choice(201))));
        assertTrue(hiddenResult.sections().isEmpty());
        assignment.setAnswerVisibility(AnswerVisibility.AFTER_SUBMIT);
        assertEquals("Explanation secret",service().result(10L,"student").sections().getFirst().questions().getFirst().explanation());
        assertNotNull(service().result(10L,"student").sections().getFirst().questions().getFirst().explanationImageMedia());
        assertNotNull(service().result(10L,"student").sections().getFirst().questions().getFirst().explanationAudioMedia());
    }
    @Test void hideWrongAnswersAlsoHidesQuestionExplanationButTeacherCanReadIt() {
        assignment.setAnswerVisibility(AnswerVisibility.AFTER_SUBMIT);
        assignment.setHideCorrectAnswerOnWrong(true);
        var result=service().submit(10L,"student",payload(List.of(choice(202))));
        assertNull(result.sections().getFirst().questions().getFirst().explanation());
        assertNull(result.sections().getFirst().questions().getFirst().explanationImageMedia());
        assertNull(result.sections().getFirst().questions().getFirst().explanationAudioMedia());
        assertEquals("Explanation secret",service().result(10L,"teacher").sections().getFirst().questions().getFirst().explanation());
    }
    @Test void explanationWaitsForAfterExamRelease() {
        assignment.setAnswerVisibility(AnswerVisibility.AFTER_EXAM);
        service().submit(10L,"student",payload(List.of(choice(201))));
        assertTrue(service().result(10L,"student").sections().isEmpty());
        released=true;
        assertEquals("Explanation secret",service().result(10L,"student").sections().getFirst().questions().getFirst().explanation());
    }
    private ExamAttemptPayload.Value choice(long option) { return new ExamAttemptPayload.Value(101L,null,List.of(option),List.of()); }
    private ExamAttemptPayload.Save payload(List<ExamAttemptPayload.Value> answers) { return new ExamAttemptPayload.Save(1,attempt.getRevision(),answers,List.of()); }

    @Test void firstStartCreatesOneAttemptAndReturnsSafePaper() {
        exists=false; attempt.setAttemptCount(0); attempt.setStatus(ExamAttemptStatus.NOT_STARTED);
        var key=UUID.randomUUID(); var service=service();
        var result=service.start(12L,"student",new ExamAttemptPayload.Start(key,0));
        assertEquals(1,result.attemptNumber()); assertEquals(1,resets); assertFalse(result.sections().isEmpty());
        assertEquals(key,attempt.getStartRequestId()); assertEquals(1L,result.revision());
        service.start(12L,"student",new ExamAttemptPayload.Start(key,0));
        assertEquals(1,resets); assertEquals(1,attempt.getAttemptCount());
    }
    @Test void inProgressStartContinuesWithoutResetOrIncrement() {
        service().start(12L,"student",new ExamAttemptPayload.Start(UUID.randomUUID(),1));
        assertEquals(0,resets); assertEquals(1,attempt.getAttemptCount());
    }
    @Test void oldStartCountOrOldAttemptNumberCannotOverwriteNewAttempt() {
        assertThrows(ConflictException.class,()->service().start(12L,"student",new ExamAttemptPayload.Start(UUID.randomUUID(),0)));
        assertThrows(ConflictException.class,()->service().save(10L,"student",new ExamAttemptPayload.Save(2,0L,List.of(),List.of())));
        assertEquals(0,writes);
    }
    @Test void staleRevisionAndForeignOptionFailBeforeWrite() {
        assertThrows(ConflictException.class,()->service().save(10L,"student",new ExamAttemptPayload.Save(1,999L,List.of(),List.of())));
        assertThrows(ExamValidationException.class,()->service().save(10L,"student",payload(List.of(choice(999)))));
        assertEquals(0,writes);
    }
    @Test void autosaveUsesSnapshotAndDeduplicatesTelemetry() {
        var event=new ExamAttemptPayload.Event(UUID.randomUUID(),ExamAttemptEventType.TAB_HIDDEN);
        var service=service();
        var response=service.save(10L,"student",new ExamAttemptPayload.Save(1,0L,List.of(choice(201)),List.of(event)));
        assertTrue(response.sections().isEmpty()); assertEquals(1,response.tabSwitchCount());
        service.save(10L,"student",new ExamAttemptPayload.Save(1,attempt.getRevision(),List.of(),List.of(event)));
        assertTrue(saved.isEmpty()); assertEquals(1,attempt.getTabSwitchCount());
    }
    @Test void submitAutomaticallyGradesAndRepeatedSubmitDoesNotWriteAgain() {
        var service=service(); var request=payload(List.of(choice(201)));
        var result=service.submit(10L,"student",request);
        assertEquals(ExamAttemptStatus.GRADED,result.status()); assertEquals(0,result.totalScore().compareTo(BigDecimal.ONE));
        assertTrue(result.sections().isEmpty()); assertTrue(result.answers().isEmpty()); assertTrue(result.review().isEmpty());
        assertEquals(1,completionMarks); service.submit(10L,"student",request); assertEquals(1,writes);
    }
    @Test void lateSubmitIgnoresNewAnswersAndGradesSavedSnapshot() {
        saved.put(101L,choice(201)); attempt.setDeadlineAt(now().minusSeconds(1));
        var result=service().submit(10L,"student",new ExamAttemptPayload.Save(1,999L,List.of(choice(202)),List.of()));
        assertEquals(0,result.totalScore().compareTo(BigDecimal.ONE)); assertEquals(List.of(201L),saved.get(101L).selectedOptionIds());
    }
    @Test void essayWaitsForTeacherAndGradingRecalculatesTotals() {
        var service=service();
        var result=service.submit(10L,"student",payload(List.of(choice(201),new ExamAttemptPayload.Value(102L,"Essay",List.of(),List.of()))));
        assertEquals(ExamAttemptStatus.SUBMITTED,result.status()); assertFalse(result.isFinal());
        result=service.grade(10L,"teacher",new ExamAttemptPayload.Grades(1,attempt.getRevision(),List.of(new ExamAttemptPayload.Grade(102L,BigDecimal.ONE)),"Good"));
        assertEquals(ExamAttemptStatus.GRADED,result.status()); assertEquals(0,result.totalScore().compareTo(new BigDecimal("2")));
        assertEquals("Good",result.teacherComment());
    }
    @Test void teacherCannotManuallyGradeObjectiveGroup() {
        attempt.setStatus(ExamAttemptStatus.SUBMITTED);
        assertThrows(ExamValidationException.class,()->service().grade(10L,"teacher",new ExamAttemptPayload.Grades(1,0L,List.of(new ExamAttemptPayload.Grade(101L,BigDecimal.ONE)),null)));
        assertEquals(0,writes);
    }
    @Test void retakeResetsLastResultButKeepsCumulativeAttemptCount() {
        attempt.setStatus(ExamAttemptStatus.GRADED); attempt.setTotalScore(BigDecimal.ONE); attempt.setTeacherComment("Old");
        saved.put(101L,choice(201));
        var result=service().start(12L,"student",new ExamAttemptPayload.Start(UUID.randomUUID(),1));
        assertEquals(2,result.attemptNumber()); assertEquals(0,attempt.getTotalScore().signum());
        assertNull(attempt.getTeacherComment()); assertTrue(saved.isEmpty());
    }
    @Test void foreignStudentCannotAccessAttempt() {
        student.setId(99L);
        assertThrows(ResourceNotFoundException.class,()->service().get(10L,"student")); assertEquals(0,structureReads);
    }
    @Test void missingEligibilityBlocksNewStartButNotFinishingExistingLease() {
        eligible=false;
        var service=service(); assertFalse(service.get(10L,"student").sections().isEmpty());
        attempt.setStatus(ExamAttemptStatus.GRADED);
        assertThrows(ResourceNotFoundException.class,()->service.start(12L,"student",new ExamAttemptPayload.Start(UUID.randomUUID(),1)));
    }
    @Test void paperDoesNotContainAnswerKeyOrShortAnswerContent() {
        includeShort=true;
        var paper=service().get(10L,"student");
        var group=paper.sections().getFirst().questions().getFirst().answers().getLast();
        assertEquals(AnswerType.SHORT_ANSWER,group.answerType()); assertNull(group.content());
        Set<String> fields=new HashSet<>(); for(var component:group.getClass().getRecordComponents()) fields.add(component.getName());
        assertFalse(fields.contains("correctAnswerText")); assertFalse(fields.contains("scoringRules"));
    }
    @Test void hiddenScoreIsNullAndAfterExamUsesFrozenReleaseFlag() {
        var service=service(); service.submit(10L,"student",payload(List.of(choice(201))));
        assignment.setScoreVisibility(ScoreVisibility.AFTER_EXAM);
        assertNull(service.result(10L,"student").totalScore());
        released=true; assertNotNull(service.result(10L,"student").totalScore());
        assignment.setScoreVisibility(ScoreVisibility.NEVER); assertNull(service.result(10L,"student").totalScore());
    }
    @Test void expiryJobGradesSavedAnswersOnlyOnceWithoutBrowserSubmit() {
        runExpiry=true; attempt.setDeadlineAt(now().minusSeconds(1)); saved.put(101L,choice(201));
        var service=service(); service.expireBatch(); service.expireBatch();
        assertEquals(ExamAttemptStatus.GRADED,attempt.getStatus()); assertEquals(1,writes); assertEquals(1,completionMarks);
    }
    @Test void lateAutosaveFinalizesInsteadOfAcceptingNewAnswer() {
        attempt.setDeadlineAt(now().minusSeconds(1)); saved.put(101L,choice(201));
        var response=service().save(10L,"student",payload(List.of(choice(202))));
        assertEquals(ExamAttemptStatus.GRADED,response.status()); assertEquals(List.of(201L),saved.get(101L).selectedOptionIds());
    }
    @Test void attemptLimitAndInactiveAccountBlockStart() {
        attempt.setAttemptCount(2); attempt.setStatus(ExamAttemptStatus.GRADED);
        assertThrows(ConflictException.class,()->service().start(12L,"student",new ExamAttemptPayload.Start(UUID.randomUUID(),2)));
        student.setStatus(UserStatus.BANNED);
        assertThrows(IllegalStateException.class,()->service().start(12L,"student",new ExamAttemptPayload.Start(UUID.randomUUID(),2)));
        assertEquals(0,resets);
    }
    @Test void anotherTeacherCannotReadOrGradeResult() {
        assertThrows(ResourceNotFoundException.class,()->service().result(10L,"otherTeacher"));
        assertThrows(ResourceNotFoundException.class,()->service().grade(10L,"otherTeacher",new ExamAttemptPayload.Grades(1,0L,List.of(new ExamAttemptPayload.Grade(102L,BigDecimal.ONE)),null)));
        assertEquals(0,writes);
    }
    @Test void teacherRetakeClearsOnlyCurrentResultPreservesGenerationAndGrantsNextAttempt() {
        var service=service(); service.submit(10L,"student",payload(List.of(choice(201))));
        attempt.setAttemptCount(2);
        service.resetByTeacher(10L,"teacher",new ExamAttemptPayload.Reset(2,attempt.getRevision(),ExamAttemptPayload.ResetMode.RETAKE));
        assertEquals(2,attempt.getAttemptCount()); assertEquals(3,attempt.getAttemptLimitOverride());
        assertEquals(ExamAttemptStatus.NOT_STARTED,attempt.getStatus()); assertTrue(saved.isEmpty());
        assertNull(attempt.getSubmittedAt()); assertFalse(attempt.isTeacherBlocked());
        service.start(12L,"student",new ExamAttemptPayload.Start(UUID.randomUUID(),2));
        assertEquals(3,attempt.getAttemptCount());
        assertThrows(ConflictException.class,()->service.save(10L,"student",new ExamAttemptPayload.Save(2,attempt.getRevision(),List.of(),List.of())));
    }

    @Test void teacherBlockPreventsStudentRestartAndClosedRoundDoesNotEraseResult() {
        var service=service(); service.submit(10L,"student",payload(List.of(choice(201))));
        assignment.setCloseTime(now().minusMinutes(1));
        int writesBefore=resets;
        assertThrows(ConflictException.class,()->service.resetByTeacher(10L,"teacher",new ExamAttemptPayload.Reset(1,attempt.getRevision(),ExamAttemptPayload.ResetMode.RETAKE)));
        assertEquals(writesBefore,resets);
        assertThrows(ResourceNotFoundException.class,()->service.resetByTeacher(10L,"otherTeacher",new ExamAttemptPayload.Reset(1,attempt.getRevision(),ExamAttemptPayload.ResetMode.BLOCK)));
        assertThrows(ConflictException.class,()->service.resetByTeacher(10L,"teacher",new ExamAttemptPayload.Reset(1,attempt.getRevision()+1,ExamAttemptPayload.ResetMode.BLOCK)));
        service.resetByTeacher(10L,"teacher",new ExamAttemptPayload.Reset(1,attempt.getRevision(),ExamAttemptPayload.ResetMode.BLOCK));
        assertTrue(attempt.isTeacherBlocked());
        assertThrows(ConflictException.class,()->service.start(12L,"student",new ExamAttemptPayload.Start(UUID.randomUUID(),1)));
        assertThrows(ConflictException.class,()->service.result(10L,"student"));
    }

    @Test void teacherReviewEnforcesOwnerAndReturnsFullPaperAndStudent() {
        var service=service(); service.submit(10L,"student",payload(List.of(choice(201))));
        assertThrows(ResourceNotFoundException.class,()->service.teacherReview(10L,"otherTeacher"));
        var review=service.teacherReview(10L,"teacher");
        assertEquals(21L,review.student().id()); assertEquals(12L,review.assignmentId());
        assertTrue(review.result().answersVisible()); assertFalse(review.result().sections().isEmpty());
    }

    private ExamAttemptService service() {
        var paper=new ExamDetailService(null,null,null,null,null,null,null,null) {
            @Override public List<ExamDetailResponse.Section> getStructure(Long id) { structureReads++; return structure(); }
        };
        var access=new StudentExamReadRepository(null) {
            @Override public Optional<Row> findAccessible(long id,long studentId) {
                return eligible?Optional.of(new Row(12L,5L,"Exam",exam.getCode(),null,"PUBLISHED","OPEN","ALL",null,null,
                        45,attempt.getAttemptLimitOverride()==null?2:attempt.getAttemptLimitOverride(),attempt.getAttemptCount(),10L,
                        attempt.isTeacherBlocked()?"TEACHER_BLOCKED":attempt.getStatus().name(),attempt.getStartedAt())):Optional.empty();
            }
        };
        return new ExamAttemptService(repo(UserRepository.class),repo(ExamRepository.class),repo(ExamAssignmentRepository.class),
                repo(ExamAttemptRepository.class),access,paper,data,repo(com.classmanagement.backend.service.StorageService.class));
    }
    private List<ExamDetailResponse.Section> structure() {
        var groups=new ArrayList<ExamDetailResponse.Answer>();
        groups.add(new ExamDetailResponse.Answer(101L,0,AnswerType.SINGLE_CHOICE,null,BigDecimal.ONE,ScoringType.PER_ANSWER,null,null,false,null,null,
                List.of(new ExamDetailResponse.Option(201L,0,"Correct",true,BigDecimal.ZERO,null,null),new ExamDetailResponse.Option(202L,1,"Wrong",false,BigDecimal.ZERO,null,null)),List.of()));
        groups.add(new ExamDetailResponse.Answer(102L,1,AnswerType.ESSAY,"Write",BigDecimal.ONE,ScoringType.PER_ANSWER,null,null,false,null,null,List.of(),List.of()));
        if(includeShort) groups.add(new ExamDetailResponse.Answer(103L,2,AnswerType.SHORT_ANSWER,"secret",BigDecimal.ONE,ScoringType.PER_ANSWER,"secret",null,false,null,null,List.of(),List.of()));
        var points=new BigDecimal(includeShort?"3":"2");
        return List.of(new ExamDetailResponse.Section(1L,0,"Section",null,points,null,null,
                List.of(new ExamDetailResponse.Question(11L,0,"Question","Explanation secret",points,null,null,groups,
                        new ExamDetailResponse.Media(UUID.randomUUID(),"https://example.com/explanation.png"),
                        new ExamDetailResponse.Media(UUID.randomUUID(),"https://example.com/explanation.mp3")))));
    }
    private <T> T repo(Class<T> type) {
        return type.cast(Proxy.newProxyInstance(type.getClassLoader(),new Class<?>[]{type},(p,m,a)->switch(m.getName()) {
            case "findByUsername" -> Optional.of("teacher".equals(a[0])?teacher:"otherTeacher".equals(a[0])?
                    User.builder().id(99L).role(UserRole.TEACHER).status(UserStatus.ACTIVE).build():student);
            case "findSharedLockedById" -> Optional.of(exam);
            case "findSharedLockedBatch" -> List.of(exam);
            case "findAllById" -> List.of(assignment);
            case "findById" -> Optional.of(assignment);
            case "findByIdAndExam_Teacher_Username" -> "teacher".equals(a[1])?Optional.of(assignment):Optional.empty();
            case "getUrl" -> "https://storage/"+a[0];
            case "findLockedById" -> Optional.of(attempt);
            case "findLockedBatch" -> List.of(attempt);
            case "findLockedByAssignment_IdAndStudent_Id" -> exists?Optional.of(attempt):Optional.empty();
            case "insertIfAbsent" -> { exists=true; yield 1; }
            case "flush" -> { attempt.setRevision(attempt.getRevision()+1); yield null; }
            default -> throw new AssertionError(m.getName());
        }));
    }
}
