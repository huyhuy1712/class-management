package com.classmanagement.backend.service.exam.pdf;

import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.font.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.io.TempDir;
import com.classmanagement.backend.entity.enums.AnswerType;
import java.nio.file.Path;
import static org.junit.jupiter.api.Assertions.*;

class PdfExamStructureParserTest {
    @TempDir Path temp;
    private Path pdf(String... pages) throws Exception {
        var path=temp.resolve("structure.pdf");
        try(var doc=new PDDocument()) {
            for(String content:pages) {
                var page=new PDPage();doc.addPage(page);
                try(var out=new PDPageContentStream(doc,page)) {
                    out.beginText();out.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA),12);out.newLineAtOffset(45,740);out.setLeading(18);
                    for(var line:content.split("\n")) {out.showText(line);out.newLine();}
                    out.endText();
                    out.beginText();out.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA),8);out.newLineAtOffset(45,20);
                    out.showText("Page "+doc.getNumberOfPages());out.newLineAtOffset(0,-10);out.showText("Suu tam va bien soan");out.endText();
                }
            }
            doc.save(path.toFile());
        }
        return path;
    }
    private PdfExamStructureParser.Structure parse(Path file) {
        return new PdfExamStructureParser().parse(new PdfExamScopeParser().inspect(file),1);
    }
    @Test void reusesExtractionAndStructureWithAnotherLayoutWithoutReopeningPdf() throws Exception {
        var layout=new PdfExamLayout.VietnameseThreePart() {
            public String id() { return "english-test"; }
            public java.util.regex.Pattern examTitle() { return java.util.regex.Pattern.compile("^EXAM 0*(\\d+)$"); }
            public java.util.regex.Pattern firstSection() { return java.util.regex.Pattern.compile("^SECTION 1.*"); }
            public java.util.regex.Pattern solutionHeading() { return java.util.regex.Pattern.compile("^SOLUTIONS$"); }
            public java.util.regex.Pattern section() { return java.util.regex.Pattern.compile("^SECTION (\\d+)\\..*"); }
            public java.util.regex.Pattern question() { return java.util.regex.Pattern.compile("Question (\\d+): *"); }
            public AnswerType answerType(String introduction) { return AnswerType.SHORT_ANSWER; }
        };
        var index=new PdfExamScopeParser().inspect(pdf("EXAM 02\nSECTION 1. Short answers\nQuestion 1: Editable stem\nSOLUTIONS\nSecret solution"),layout);
        var result=new PdfExamStructureParser().parse(index,2);
        assertEquals("english-test",index.layout().id());
        assertEquals(1,result.sections().size());
        assertEquals("Editable stem",result.sections().getFirst().questions().getFirst().rawStem());
        assertFalse(result.sections().getFirst().questions().getFirst().rawText().contains("Secret"));
        assertFalse(result.answersResolved()); assertFalse(result.latexChecked());
    }

    @Test void groupsThreeQuestionTypesWithoutResolvingAnswersOrAssigningPoints() throws Exception {
        var result=parse(pdf("DE 1\nPHAN I. Cau trac nghiem nhieu phuong an lua chon. Tu cau 1 den cau 1.\nCau 1: Stem\nA. One B. Two C. Three D. Four\nPHAN II. Cau trac nghiem dung sai. Tu cau 1 den cau 1.\nCau 1: True false stem\na) First\nb) Second\nc) Third\nd) Fourth\nPHAN III. Cau trac nghiem tra loi ngan. Tu cau 1 den cau 1.\nCau 1: Short stem\nHUONG DAN GIAI CHI TIET\nCau 1: secret answer"));
        assertEquals(3,result.sections().size());
        assertEquals(AnswerType.SINGLE_CHOICE,result.sections().get(0).answerType());
        assertEquals(AnswerType.TRUE_FALSE,result.sections().get(1).answerType());
        assertEquals(AnswerType.SHORT_ANSWER,result.sections().get(2).answerType());
        for(var section:result.sections()) {
            assertEquals(1,section.questions().size());
            var q=section.questions().getFirst();assertEquals(1,q.number());assertNull(q.points());assertNull(q.group().points());
            assertNull(q.group().correctAnswerText());assertFalse(q.rawText().contains("secret answer"));
            for(var option:q.group().options()) {assertNull(option.isCorrect());assertNull(option.points());assertFalse(option.textRegions().isEmpty());}
        }
        assertEquals("Stem",result.sections().getFirst().questions().getFirst().rawStem());
        assertEquals(4,result.sections().getFirst().questions().getFirst().group().options().size());
        assertFalse(result.answersResolved());assertFalse(result.latexChecked());assertTrue(result.requiresPoints());
        assertFalse(result.issues().stream().anyMatch(i->i.code().equals("QUESTION_COUNT_MISMATCH")));
    }
    @Test void continuesQuestionAndOptionAcrossPagesAndKeepsHorizontalCoordinates() throws Exception {
        var result=parse(pdf("DE 1\nPHAN I. Cau trac nghiem nhieu phuong an lua chon.\nCau 1: Long stem\nA. First option",
                "continued on next page\nB. Two C. Three D. Four\nHUONG DAN GIAI CHI TIET\nCau 1: A"));
        var q=result.sections().getFirst().questions().getFirst();
        assertTrue(q.group().options().getFirst().rawText().contains("continued on next page"));
        assertFalse(q.rawText().contains("Page 1"));assertFalse(q.rawText().contains("Suu tam"));
        assertEquals(1,q.source().start().page());assertEquals(2,q.source().end().page());
        var b=q.group().options().get(1).textRegions().getFirst();var c=q.group().options().get(2).textRegions().getFirst();
        assertTrue(b.box().left()<c.box().left());
        assertTrue(b.box().right()<=c.box().left()+0.01,"Option regions must not overlap: "+b+" / "+c);
    }
    @Test void reportsMissingDuplicateLabelsAndQuestionSequenceInsteadOfClaimingSuccess() throws Exception {
        var result=parse(pdf("DE 1\nPHAN I. Cau trac nghiem nhieu phuong an lua chon. Tu cau 1 den cau 3.\nCau 1: Stem\nA. One B. Two B. Duplicate D. Four\nCau 3: Missing question\nA. One B. Two C. Three\nHUONG DAN GIAI CHI TIET"));
        assertTrue(result.issues().stream().anyMatch(i->i.code().equals("OPTION_BOUNDARY_UNCERTAIN")));
        assertTrue(result.issues().stream().anyMatch(i->i.code().equals("QUESTION_COUNT_MISMATCH")));
        assertTrue(result.issues().stream().anyMatch(i->i.code().equals("QUESTION_SEQUENCE_UNCERTAIN")));
        assertTrue(result.sections().getFirst().questions().getFirst().rawText().contains("Duplicate"));
    }
    @Test void doesNotConvertChoiceLettersInsideShortAnswerIntoOptions() throws Exception {
        var result=parse(pdf("DE 1\nPHAN I. Cau trac nghiem tra loi ngan.\nCau 1: Cho diem A. Tim B.\nHUONG DAN GIAI CHI TIET"));
        var q=result.sections().getFirst().questions().getFirst();
        assertTrue(q.group().options().isEmpty());assertEquals("Cho diem A. Tim B.",q.rawStem());
    }
    @Test void distinguishesProseReferencesFromQuestionAndOptionLabels() throws Exception {
        var result=parse(pdf("DE 1\nPHAN I. Cau trac nghiem nhieu phuong an lua chon. Tu cau 1 den cau 1.\nCau 1: Tim diem C.\nXem Cau 99: chi la tham khao.\nA. One B. Two C . Three D. Four\nHUONG DAN GIAI CHI TIET"));
        var q=result.sections().getFirst().questions().getFirst();
        assertEquals(1,result.sections().getFirst().questions().size());
        assertTrue(q.rawStem().contains("Tim diem C."));assertTrue(q.rawStem().contains("Cau 99"));
        assertEquals(java.util.List.of("A","B","C","D"),q.group().options().stream().map(PdfExamStructureParser.Option::label).toList());
    }
    @Test void recoversDamagedQuestionLabelsButAlwaysRequiresSourceReview() throws Exception {
        var result=parse(pdf("DE 1\nPHAN I. Cau trac nghiem tra loi ngan. Tu cau 1 den cau 2.\nCa 1: Stem one\nCau 2 Cho stem two\n: tiep tuc\nHUONG DAN GIAI CHI TIET"));
        assertEquals(java.util.List.of(1,2),result.sections().getFirst().questions().stream().map(PdfExamStructureParser.Question::number).toList());
        assertEquals(2,result.issues().stream().filter(i->i.code().equals("QUESTION_LABEL_UNCERTAIN")).count());
    }
    @Test void processesOnlySelectedQuestionsAndAllTenLocalExamsHaveExpectedSections() throws Exception {
        String source=System.getProperty("pdf.scope.sample");Assumptions.assumeTrue(source!=null,"Local PDF property required");
        var index=new PdfExamScopeParser().inspect(Path.of(source));
        var parser=new PdfExamStructureParser();
        for(int number=1;number<=10;number++) {
            var result=parser.parse(index,number);
            assertEquals(3,result.sections().size(),"Exam "+number);
            assertEquals(java.util.List.of(12,4,6),result.sections().stream().map(s->s.questions().size()).toList(),"Exam "+number);
            assertEquals(java.util.List.of(AnswerType.SINGLE_CHOICE,AnswerType.TRUE_FALSE,AnswerType.SHORT_ANSWER),result.sections().stream().map(PdfExamStructureParser.Section::answerType).toList());
            assertFalse(result.issues().stream().anyMatch(i->i.code().equals("QUESTION_COUNT_MISMATCH")),"Exam "+number);
            assertTrue(result.sections().stream().flatMap(s->s.questions().stream()).noneMatch(q->q.rawText().contains("HƯỚNG DẪN GIẢI CHI TIẾT")));
            System.out.println("PDF structure exam "+number+": questions="+result.sections().stream().mapToInt(s->s.questions().size()).sum()+", boundary issues="+result.issues().stream().filter(i->i.code().equals("OPTION_BOUNDARY_UNCERTAIN")).count());
        }
    }
}
