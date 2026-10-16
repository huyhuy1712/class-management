package com.classmanagement.backend.service.exam.pdf;

import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.font.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.Assumptions;
import java.nio.file.*;
import static org.junit.jupiter.api.Assertions.*;
import static com.classmanagement.backend.service.exam.pdf.PdfExamScopeParser.ErrorCode.*;

class PdfExamScopeParserTest {
    @TempDir Path temp;
    private Path pdf(String... pages) throws Exception {
        var path=temp.resolve("source.pdf");
        try(var doc=new PDDocument()) {
            for(String text:pages) {
                var page=new PDPage();doc.addPage(page);
                try(var stream=new PDPageContentStream(doc,page)) {
                    stream.beginText();stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA),12);
                    stream.newLineAtOffset(50,740);stream.setLeading(20);
                    for(String line:text.split("\n")) {stream.showText(line);stream.newLine();}
                    stream.endText();
                }
            }
            doc.save(path.toFile());
        }
        return path;
    }
    private void error(PdfExamScopeParser parser,Path file,int number,PdfExamScopeParser.ErrorCode code) {
        assertEquals(code,assertThrows(PdfExamScopeParser.ScopeException.class,()->parser.select(file,number)).code());
    }
    @Test void selectsOnlyRequestedExamWithPhysicalPagesAndContext() throws Exception {
        var file=pdf("MUC LUC\nDE 1 .... 1\nDE 2 .... 9",
                "MON: TOAN 10 - DE SO: 01\nPHAN I. LUA CHON\nCau 1: Xem de 2 de tham khao\nPage 1",
                "HUONG DAN GIAI CHI TIET\nPHAN I. LUA CHON\nCau 1: A\nPage 2",
                "DE 02\nPHAN I. LUA CHON\nCau 1: Test\nPage 1",
                "HUONG DAN GIAI CHI TIET\nCau 1: B\nPage 2");
        var result=new PdfExamScopeParser().select(file,2);
        assertEquals(4,result.questions().start().page());assertEquals(5,result.solutions().start().page());
        assertEquals(5,result.solutions().end().page());assertEquals(java.util.List.of(1,2),result.availableExamNumbers());
    }
    @Test void boundariesCanBeOnSamePageAndExcludeNextExam() throws Exception {
        var file=pdf("DE 1\nPHAN I. Test\nCau 1: X\nHUONG DAN GIAI CHI TIET\nCau 1: A\nDE SO: 2\nPHAN I. Test\nCau 1: Y\nHUONG DAN GIAI CHI TIET\nCau 1: B");
        var index=new PdfExamScopeParser().inspect(file);var first=index.select(1);var second=index.select(2);
        assertEquals(second.questions().start(),first.solutions().end());
        assertTrue(first.questions().start().y()<first.questions().end().y());
        assertTrue(first.solutions().start().y()<first.solutions().end().y());
    }
    @Test void rejectsMissingDuplicateAndAmbiguousSolutions() throws Exception {
        var parser=new PdfExamScopeParser();
        error(parser,pdf("DE 1\nPHAN I. Test\nHUONG DAN GIAI CHI TIET"),2,EXAM_NOT_FOUND);
        error(parser,pdf("DE 1\nPHAN I. Test\nHUONG DAN GIAI CHI TIET","DE 01\nPHAN I. Test\nHUONG DAN GIAI CHI TIET"),1,EXAM_NUMBER_AMBIGUOUS);
        error(parser,pdf("DE 1\nPHAN I. Test\nCau 1: X"),1,SOLUTION_BOUNDARY_MISSING);
        error(parser,pdf("DE 1\nPHAN I. Test\nHUONG DAN GIAI CHI TIET\nHUONG DAN GIAI CHI TIET"),1,SOLUTION_BOUNDARY_AMBIGUOUS);
    }
    @Test void proseMentionsAndTitleWithoutPartOneAreNotExamHeaders() throws Exception {
        error(new PdfExamScopeParser(),pdf("Noi dung tham khao de 2\nDE 2\nCau 1: X\nHUONG DAN GIAI CHI TIET"),2,EXAM_NOT_FOUND);
    }
    @Test void validatesPdfLimitsAndMissingText() throws Exception {
        var parser=new PdfExamScopeParser();var file=pdf("DE 1\nPHAN I. Test\nHUONG DAN GIAI CHI TIET");
        assertThrows(IllegalArgumentException.class,()->parser.select(file,0));
        error(new PdfExamScopeParser(1,500,2000000),file,1,PDF_LIMIT_EXCEEDED);
        error(new PdfExamScopeParser(1000000,1,2000000),pdf("one","two"),1,PDF_LIMIT_EXCEEDED);
        error(new PdfExamScopeParser(1000000,500,1),file,1,PDF_LIMIT_EXCEEDED);
        error(parser,pdf(""),1,TEXT_LAYER_REQUIRED);
        Files.writeString(file,"invalid");error(parser,file,1,INVALID_PDF);
    }
    @Test void rejectsEncryptedPdfInsteadOfTryingToExtractProtectedContent() throws Exception {
        var file=pdf("DE 1\nPHAN I. Test\nHUONG DAN GIAI CHI TIET");
        try(var document=org.apache.pdfbox.Loader.loadPDF(file.toFile())) {
            var permissions=new org.apache.pdfbox.pdmodel.encryption.AccessPermission();
            var policy=new org.apache.pdfbox.pdmodel.encryption.StandardProtectionPolicy("owner-password","reader-password",permissions);
            document.protect(policy);
            var secured=temp.resolve("secured.pdf"); document.save(secured.toFile());
            error(new PdfExamScopeParser(),secured,1,ENCRYPTED_PDF);
        }
    }
    @Test void allTenExamsMatchLocalSampleWithoutCommittingIt() throws Exception {
        String source=System.getProperty("pdf.scope.sample");
        Assumptions.assumeTrue(source!=null,"Supply -Dpdf.scope.sample=<local PDF> for real-file verification");
        var index=new PdfExamScopeParser().inspect(Path.of(source));
        int[] starts={1,17,30,45,59,73,87,101,115,130},solutions={5,20,34,48,63,77,91,105,119,134};
        for(int i=0;i<10;i++) {
            var result=index.select(i+1);
            assertEquals(145,result.totalPages());assertEquals(starts[i],result.questions().start().page());
            assertEquals(solutions[i],result.solutions().start().page());assertEquals(10,result.availableExamNumbers().size());
            assertEquals(i==9?145:starts[i+1],result.solutions().end().page());
        }
    }
}
