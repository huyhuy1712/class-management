package com.classmanagement.backend.service.exam.pdf;

import java.nio.file.*;
import java.util.*;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.font.*;
import org.apache.pdfbox.pdmodel.graphics.color.*;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotationHighlight;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import static org.junit.jupiter.api.Assertions.*;
import static com.classmanagement.backend.service.exam.pdf.PdfExamStructureParser.*;

class PdfExamSolutionParserTest {
    @TempDir Path temp;
    private record Mark(int page,int line,String text,boolean annotation) {}
    private Path pdf(List<String> pages,Mark... marks) throws Exception {
        var path=temp.resolve(UUID.randomUUID()+".pdf");var font=new PDType1Font(Standard14Fonts.FontName.HELVETICA);
        try(var doc=new PDDocument()) {
            for(int p=0;p<pages.size();p++) {
                var page=new PDPage();doc.addPage(page);var lines=pages.get(p).split("\n");
                try(var out=new PDPageContentStream(doc,page)) {
                    for(var mark:marks) if(mark.page()==p+1) {
                        String line=lines[mark.line()];int at=line.indexOf(mark.text());assertTrue(at>=0);
                        float x=45+font.getStringWidth(line.substring(0,at))*12/1000;
                        float width=font.getStringWidth(mark.text())*12/1000,y=740-mark.line()*18-2;
                        if(mark.annotation()) {
                            var annotation=new PDAnnotationHighlight();
                            annotation.setColor(new PDColor(new float[]{1,1,0},PDDeviceRGB.INSTANCE));
                            annotation.setRectangle(new PDRectangle(x,y,width,14));
                            annotation.setQuadPoints(new float[]{x,y+14,x+width,y+14,x,y,x+width,y});page.getAnnotations().add(annotation);
                        } else {
                            out.setNonStrokingColor(1f,1f,0f);out.addRect(x,y,width,14);out.fill();out.setNonStrokingColor(0f,0f,0f);
                        }
                    }
                    out.beginText();out.setFont(font,12);out.newLineAtOffset(45,740);out.setLeading(18);
                    for(var line:lines) {out.showText(line);out.newLine();}out.endText();
                }
            }
            doc.save(path.toFile());
        }
        return path;
    }
    private PdfExamSolutionParser.Result parse(Path source,int exam) {
        var index=new PdfExamScopeParser().inspectForExam(source,exam,PdfExamLayout.vietnameseThreePart());
        return new PdfExamSolutionParser().parse(index,new PdfExamStructureParser().parse(index,exam));
    }
    private String single(String solution) {
        return "DE 1\nPHAN I. Nhieu phuong an lua chon\nCau 1: Student stem\nA. One B. Two C. Three D. Four\nHUONG DAN GIAI CHI TIET\nPHAN I. Nhieu phuong an lua chon\nCau 1: Solution stem\nA. One B. Two C. Three D. Four\nLoi giai\n"+solution;
    }
    private Question question(PdfExamSolutionParser.Result result,int section) {
        return result.structure().sections().get(section).questions().getFirst();
    }
    private List<Boolean> flags(Question question) {return question.group().options().stream().map(Option::isCorrect).toList();}
    private boolean issue(PdfExamSolutionParser.Result result,String code) {return result.structure().issues().stream().anyMatch(i->i.code().equals(code));}

    @Test void usesYellowContentRectangleAndKeepsStudentSourceClean() throws Exception {
        var result=parse(pdf(List.of(single("Chon B\nExplanation text")),new Mark(1,7,"Two",false)),1);
        var question=question(result,0);
        assertEquals(List.of(false,true,false,false),flags(question));
        assertEquals("Student stem",question.rawStem());assertFalse(question.rawText().contains("Explanation"));
        assertEquals("Chon B\nExplanation text",question.explanation());
        assertTrue(question.explanationSource().start().y()>question.source().end().y());
        assertTrue(result.structure().answersResolved());assertFalse(result.structure().latexChecked());
        assertTrue(result.structure().requiresPoints());assertNull(question.points());assertNull(question.group().points());
        assertTrue(result.evidence().stream().anyMatch(e->e.kind().equals("YELLOW_FILL")));
        assertFalse(issue(result,"ANSWERS_REQUIRED"));assertTrue(issue(result,"LATEX_REVIEW_REQUIRED"));
    }
    @Test void acceptsHighlightAnnotationButRejectsConflictingConclusionAndMultipleHighlights() throws Exception {
        var marked=parse(pdf(List.of(single("Chon C")),new Mark(1,7,"Three",true)),1);
        assertEquals(List.of(false,false,true,false),flags(question(marked,0)));
        assertTrue(marked.evidence().stream().anyMatch(e->e.kind().equals("ANNOTATION_HIGHLIGHT")));
        var conflict=parse(pdf(List.of(single("Chon A")),new Mark(1,7,"Two",false)),1);
        assertTrue(issue(conflict,"ANSWER_CONFLICT"));assertFalse(conflict.structure().answersResolved());
        assertTrue(flags(question(conflict,0)).stream().allMatch(Objects::isNull));
        var multiple=parse(pdf(List.of(single("Reasoning")),new Mark(1,7,"One",false),new Mark(1,7,"Four",false)),1);
        assertTrue(issue(multiple,"ANSWER_CONFLICT"));
    }
    @Test void ignoresYellowInStemAndExplanationAndDoesNotInferAnswer() throws Exception {
        var result=parse(pdf(List.of(single("One is correct")),new Mark(1,6,"Solution stem",false),new Mark(1,9,"One",false)),1);
        assertFalse(result.structure().answersResolved());assertTrue(issue(result,"ANSWER_UNRESOLVED"));
        assertTrue(flags(question(result,0)).stream().allMatch(Objects::isNull));
    }
    @Test void joinsBySectionAndNumberAndKeepsMissingBooleanUnknown() throws Exception {
        String content="DE 1\nPHAN I. Nhieu phuong an lua chon\nCau 1: First\nA. One B. Two C. Three D. Four\n"
                +"PHAN II. Dung sai\nCau 1: Second\na) One\nb) Two\nc) Three\nd) Four\n"
                +"PHAN III. Tra loi ngan\nCau 1: Third\nHUONG DAN GIAI CHI TIET\n"
                +"PHAN I. Nhieu phuong an lua chon\nCau 1: First\nLoi giai\nChon D\n"
                +"PHAN II. Dung sai\nCau 1: Second\nLoi giai\na) Dung b) Sai c) Dung\n"
                +"a) Neu dieu kien dung thi ket qua sai\nPHAN III. Tra loi ngan\nCau 1: Third\nLoi giai\nTra loi: -1,25\nReasoning";
        var result=parse(pdf(List.of(content)),1);
        assertEquals(List.of(false,false,false,true),flags(question(result,0)));
        assertEquals(Boolean.TRUE,flags(question(result,1)).get(0));assertEquals(Boolean.FALSE,flags(question(result,1)).get(1));
        assertEquals(Boolean.TRUE,flags(question(result,1)).get(2));assertNull(flags(question(result,1)).get(3));
        assertEquals("-1,25",question(result,2).group().correctAnswerText());
        assertFalse(result.structure().answersResolved());
    }
    @Test void rejectsContradictoryBooleanAndMalformedOrConflictingShortAnswer() throws Exception {
        String prefix="DE 1\nPHAN I. Dung sai\nCau 1: Stem\na) One\nb) Two\nc) Three\nd) Four\nHUONG DAN GIAI CHI TIET\nPHAN I. Dung sai\nCau 1: Stem\nLoi giai\n";
        var result=parse(pdf(List.of(prefix+"a) Dung b) Sai c) Dung d) Sai\na) Sai.")),1);
        assertTrue(issue(result,"ANSWER_CONFLICT"));assertTrue(flags(question(result,0)).stream().allMatch(Objects::isNull));
        String shortPrefix="DE 1\nPHAN I. Tra loi ngan\nCau 1: Stem\nHUONG DAN GIAI CHI TIET\nPHAN I. Tra loi ngan\nCau 1: Stem\nLoi giai\n";
        var malformed=parse(pdf(List.of(shortPrefix+"Tra loi: 2 m")),1);
        assertNull(question(malformed,0).group().correctAnswerText());assertTrue(issue(malformed,"SHORT_ANSWER_REVIEW_REQUIRED"));
        assertEquals("2 m",malformed.evidence().getFirst().rawValue());
        var conflicting=parse(pdf(List.of(shortPrefix+"Tra loi: 2\nDap an: 3")),1);
        assertTrue(issue(conflicting,"ANSWER_CONFLICT"));assertNull(question(conflicting,0).group().correctAnswerText());
    }
    @Test void rejectsMissingDuplicateAndOrphanSolutionsRatherThanChoosingFirst() throws Exception {
        var duplicate=parse(pdf(List.of(single("Chon B\nCau 1: Duplicate\nLoi giai\nChon A"))),1);
        assertTrue(issue(duplicate,"SOLUTION_AMBIGUOUS"));assertNull(question(duplicate,0).explanation());
        String missing=single("Chon B").replace("Cau 1: Solution stem","Cau 2: Solution stem");
        var result=parse(pdf(List.of(missing)),1);
        assertTrue(issue(result,"SOLUTION_MISSING"));assertTrue(issue(result,"SOLUTION_WITHOUT_QUESTION"));
    }
    @Test void explanationsCanContinueAcrossPagesAndNeverEnterNextExam() throws Exception {
        var result=parse(pdf(List.of(single("Chon C\nStart reasoning"),"Continued reasoning\nDE 2\nPHAN I. Tra loi ngan\nCau 1: Other exam\nHUONG DAN GIAI CHI TIET\nPHAN I. Tra loi ngan\nCau 1: Other\nLoi giai\nTra loi: 99")),1);
        assertEquals("Chon C\nStart reasoning\nContinued reasoning",question(result,0).explanation());
        assertFalse(question(result,0).explanation().contains("99"));assertTrue(result.structure().answersResolved());
    }
    @Test void damagedSolutionLabelAndMissingExplanationBoundaryStayUnresolved() throws Exception {
        var damaged=parse(pdf(List.of(single("Chon B").replace("Cau 1: Solution stem","Ca 1: Solution stem"))),1);
        assertFalse(damaged.structure().answersResolved());assertTrue(issue(damaged,"SOLUTION_LABEL_UNCERTAIN"));
        assertTrue(flags(question(damaged,0)).stream().allMatch(Objects::isNull));
        var missing=parse(pdf(List.of(single("Chon B").replace("Loi giai\n",""))),1);
        assertTrue(issue(missing,"EXPLANATION_BOUNDARY_UNCERTAIN"));assertFalse(missing.structure().answersResolved());
    }
    @Test void selectedExamCollectsNoHighlightsFromOtherExamAndDefaultIndexDoesNotPretendToHaveGraphics() throws Exception {
        var file=pdf(List.of(single("Reasoning"),single("Chon D").replace("DE 1","DE 2")),new Mark(2,7,"Four",false));
        var index=new PdfExamScopeParser().inspectForExam(file,1,PdfExamLayout.vietnameseThreePart());
        assertTrue(index.highlights().isEmpty());
        var first=new PdfExamSolutionParser().parse(index,new PdfExamStructureParser().parse(index,1));
        assertFalse(first.structure().answersResolved());
        var marked=pdf(List.of(single("Reasoning")),new Mark(1,7,"One",false));
        var textOnly=new PdfExamScopeParser().inspect(marked);
        assertFalse(new PdfExamSolutionParser().parse(textOnly,new PdfExamStructureParser().parse(textOnly,1)).structure().answersResolved());
    }
    @Test void anotherLayoutControlsItsOwnBooleanConclusionsWithoutMissingTokensBecomingFalse() throws Exception {
        String content="DE 1\nPHAN I. Dung sai\nCau 1: Stem\na) One\nb) Two\nc) Three\nd) Four\nHUONG DAN GIAI CHI TIET\nPHAN I. Dung sai\nCau 1: Stem\nLoi giai\na) YES b) NO c) YES d) NO";
        var layout=new PdfExamLayout.VietnameseThreePart() {
            public String id() {return "yes-no-test";}
            public java.util.regex.Pattern booleanConclusion() {return java.util.regex.Pattern.compile("([A-D])\\)\\s*(YES|NO)");}
            public Optional<Boolean> booleanValue(String token) {return switch(token) {
                case "YES" -> Optional.of(true);case "NO" -> Optional.of(false);default -> Optional.empty();};}
        };
        var index=new PdfExamScopeParser().inspectForExam(pdf(List.of(content)),1,layout);
        var result=new PdfExamSolutionParser().parse(index,new PdfExamStructureParser().parse(index,1));
        assertEquals(List.of(true,false,true,false),flags(question(result,0)));assertTrue(result.structure().answersResolved());
    }
    @Test void localSampleAssociatesAllTwentyTwoSolutionsWithoutLeakingThemIntoQuestions() {
        var sample=System.getProperty("pdf.scope.sample");Assumptions.assumeTrue(sample!=null&&Files.isRegularFile(Path.of(sample)));
        var result=parse(Path.of(sample),1);var all=result.structure().sections().stream().flatMap(s->s.questions().stream()).toList();
        assertEquals(22,all.size());assertTrue(all.stream().allMatch(q->q.explanation()!=null&&!q.explanation().isBlank()));
        assertTrue(all.stream().noneMatch(q->q.rawText().contains("Lời giải")));
        assertTrue(all.stream().allMatch(q->q.points()==null&&q.group().points()==null));
        assertTrue(result.structure().answersResolved());
        var single=result.structure().sections().get(0).questions();
        var expected=List.of("A","A","D","B","C","B","C","B","A","D","D","C");
        assertEquals(expected,single.stream().map(q->q.group().options().stream().filter(o->Boolean.TRUE.equals(o.isCorrect())).map(Option::label).findFirst().orElse("?")).toList());
        var tf=result.structure().sections().get(1).questions();
        assertEquals(List.of(true,true,false,true),flags(tf.get(0)));
        assertEquals(List.of(false,true,false,false),flags(tf.get(1)));
        assertEquals(List.of(true,false,false,true),flags(tf.get(2)));
        assertEquals(List.of(false,true,false,true),flags(tf.get(3)));
        assertEquals(List.of("16","14","3","142","6","6"),result.structure().sections().get(2).questions().stream().map(q->q.group().correctAnswerText()).toList());
        assertFalse(issue(result,"ANSWER_CONFLICT"));assertFalse(issue(result,"ANSWER_UNRESOLVED"));
        assertTrue(result.evidence().stream().anyMatch(e->e.kind().equals("GREEN_FILL")));

    }
}
