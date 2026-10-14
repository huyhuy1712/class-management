package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.dto.exam.*;
import com.classmanagement.backend.entity.enums.*;
import com.classmanagement.backend.exception.ExamValidationException;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class ExamScoringCalculatorTest {
    private ExamDetailResponse.Option option(long id,boolean correct,String points) {
        return new ExamDetailResponse.Option(id,0,"Option",correct,new BigDecimal(points),null,null);
    }
    private ExamDetailResponse.Answer group(AnswerType type,ScoringType scoring,String points,List<ExamDetailResponse.Option> options,
            List<ExamDetailResponse.ScoringRule> rules,String text,boolean sensitive) {
        return new ExamDetailResponse.Answer(101L,0,type,"Content",new BigDecimal(points),scoring,text,null,sensitive,null,null,options,rules);
    }
    private List<ExamDetailResponse.Section> paper(ExamDetailResponse.Answer group) {
        return List.of(new ExamDetailResponse.Section(1L,0,"Section",null,group.points(),null,null,
                List.of(new ExamDetailResponse.Question(11L,0,"Question",null,group.points(),null,null,List.of(group)))));
    }
    private ExamAttemptPayload.Value choice(Long... ids) { return new ExamAttemptPayload.Value(101L,null,List.of(ids),List.of()); }
    private ExamScoringCalculator.Scores score(ExamDetailResponse.Answer group,ExamAttemptPayload.Value value) {
        var sections=paper(group); return ExamScoringCalculator.score(sections,ExamScoringCalculator.validate(sections,List.of(value)),Map.of());
    }
    @Test void singleChoiceAwardsWholeGroupOnlyForCorrectOption() {
        var group=group(AnswerType.SINGLE_CHOICE,ScoringType.PER_ANSWER,"2",List.of(option(201,true,"0"),option(202,false,"0")),List.of(),null,false);
        assertEquals(0,score(group,choice(201L)).autoScore().compareTo(new BigDecimal("2")));
        assertEquals(0,score(group,choice(202L)).autoScore().signum());
    }
    @Test void multipleChoiceRequiresExactSetRegardlessOfOrder() {
        var group=group(AnswerType.MULTIPLE_CHOICE,ScoringType.PER_ANSWER,"2",List.of(option(201,true,"0"),option(202,true,"0"),option(203,false,"0")),List.of(),null,false);
        assertEquals(0,score(group,choice(202L,201L)).autoScore().compareTo(new BigDecimal("2")));
        assertEquals(0,score(group,choice(201L)).autoScore().signum());
        assertEquals(0,score(group,choice(201L,202L,203L)).autoScore().signum());
    }
    @Test void explicitFalseCanEarnPointsButMissingFalseIsUnanswered() {
        var group=group(AnswerType.TRUE_FALSE,ScoringType.PER_ANSWER,"1",List.of(option(201,false,"0.25"),option(202,true,"0.75")),List.of(),null,false);
        var explicit=new ExamAttemptPayload.Value(101L,null,List.of(),List.of(new ExamAttemptPayload.BooleanAnswer(201L,false)));
        assertEquals(0,score(group,explicit).autoScore().compareTo(new BigDecimal("0.25")));
        assertEquals(0,score(group,choice()).autoScore().signum());
    }
    @Test void trueFalseCorrectCountUsesGroupRule() {
        var group=group(AnswerType.TRUE_FALSE,ScoringType.CORRECT_COUNT,"1",List.of(option(201,false,"0"),option(202,true,"0")),
                List.of(new ExamDetailResponse.ScoringRule(1L,0,BigDecimal.ZERO),new ExamDetailResponse.ScoringRule(2L,1,new BigDecimal("0.4")),new ExamDetailResponse.ScoringRule(3L,2,BigDecimal.ONE)),null,false);
        var value=new ExamAttemptPayload.Value(101L,null,List.of(),List.of(new ExamAttemptPayload.BooleanAnswer(201L,false)));
        assertEquals(0,score(group,value).autoScore().compareTo(new BigDecimal("0.4")));
    }
    @Test void shortAnswerNormalizesUnicodeWhitespaceAndOptionalCase() {
        var group=group(AnswerType.SHORT_ANSWER,ScoringType.PER_ANSWER,"1",List.of(),List.of(),"Été",false);
        var value=new ExamAttemptPayload.Value(101L," e\u0301te\u0301 ",List.of(),List.of());
        assertEquals(0,score(group,value).autoScore().compareTo(BigDecimal.ONE));
        var sensitive=group(AnswerType.SHORT_ANSWER,ScoringType.PER_ANSWER,"1",List.of(),List.of(),"Été",true);
        assertEquals(0,score(sensitive,value).autoScore().signum());
    }
    @Test void nonBlankEssayWaitsForManualScoreAndBlankEssayIsZero() {
        var group=group(AnswerType.ESSAY,ScoringType.PER_ANSWER,"2",List.of(),List.of(),null,false);
        var text=new ExamAttemptPayload.Value(101L,"Essay",List.of(),List.of());
        assertTrue(score(group,text).pending()); assertNull(score(group,text).groups().getFirst().score());
        assertFalse(score(group,new ExamAttemptPayload.Value(101L," ",List.of(),List.of())).pending());
        var graded=ExamScoringCalculator.score(paper(group),Map.of(101L,text),Map.of(101L,new BigDecimal("1.5")));
        assertFalse(graded.pending()); assertEquals(0,graded.manualScore().compareTo(new BigDecimal("1.5")));
    }
    @Test void manualScoreCannotExceedGroupPoints() {
        var group=group(AnswerType.ESSAY,ScoringType.PER_ANSWER,"1",List.of(),List.of(),null,false);
        assertThrows(ExamValidationException.class,()->ExamScoringCalculator.score(paper(group),
                Map.of(101L,new ExamAttemptPayload.Value(101L,"Essay",List.of(),List.of())),Map.of(101L,new BigDecimal("2"))));
    }
    @Test void foreignOptionsDuplicateSelectionsAndDuplicateGroupsAreRejected() {
        var group=group(AnswerType.MULTIPLE_CHOICE,ScoringType.PER_ANSWER,"1",List.of(option(201,true,"0")),List.of(),null,false);
        assertThrows(ExamValidationException.class,()->score(group,choice(999L)));
        assertThrows(ExamValidationException.class,()->score(group,choice(201L,201L)));
        assertThrows(ExamValidationException.class,()->ExamScoringCalculator.validate(paper(group),List.of(choice(201L),choice(201L))));
    }
    @Test void singleChoiceCannotSelectTwoAndWrongAnswerShapeIsRejected() {
        var group=group(AnswerType.SINGLE_CHOICE,ScoringType.PER_ANSWER,"1",List.of(option(201,true,"0"),option(202,false,"0")),List.of(),null,false);
        assertThrows(ExamValidationException.class,()->score(group,choice(201L,202L)));
        assertThrows(ExamValidationException.class,()->score(group,new ExamAttemptPayload.Value(101L,"Injected text",List.of(),List.of())));
    }
    @Test void unansweredGroupsHaveZeroScore() {
        var group=group(AnswerType.SINGLE_CHOICE,ScoringType.PER_ANSWER,"1",List.of(option(201,true,"0")),List.of(),null,false);
        var result=ExamScoringCalculator.score(paper(group),Map.of(),Map.of());
        assertEquals(0,result.autoScore().signum()); assertFalse(result.pending());
        assertEquals(0,result.sections().getFirst().totalScore().signum());
    }
}
