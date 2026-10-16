package com.classmanagement.backend.service.exam.pdf;

import static org.junit.jupiter.api.Assertions.*;
import static com.classmanagement.backend.service.exam.pdf.PdfExamMediaExtractor.*;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import javax.imageio.ImageIO;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.font.*;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;

class PdfExamMediaExtractorTest {
    @TempDir Path temp;
    private void text(PDPageContentStream out,float y,String text) throws Exception {
        out.beginText();out.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA),12);out.newLineAtOffset(45,y);out.showText(text);out.endText();
    }
    private void image(PDDocument doc,PDPageContentStream out,Color color,float x,float y,int width,int height) throws Exception {
        var image=new BufferedImage(10,10,BufferedImage.TYPE_INT_RGB);var g=image.createGraphics();g.setColor(color);g.fillRect(0,0,10,10);g.dispose();
        out.drawImage(LosslessFactory.createFromImage(doc,image),x,y,width,height);image.flush();
    }
    private Path fixture() throws Exception {
        var path=temp.resolve(UUID.randomUUID()+".pdf");
        try(var doc=new PDDocument()) {
            var question=new PDPage();doc.addPage(question);
            try(var out=new PDPageContentStream(doc,question)) {
                text(out,780,"DE 1");text(out,750,"PHAN I. Nhieu phuong an lua chon");
                text(out,720,"Cau 1: Student question with image and vector");text(out,690,"A. One B. Two C. Three D. Four");
                image(doc,out,Color.RED,80,540,80,80);
                out.moveTo(300,540);out.lineTo(340,620);out.lineTo(380,540);out.closePath();out.stroke();
                text(out,480,"Cau 2: Second question");text(out,450,"A. One B. Two C. Three D. Four");
                image(doc,out,Color.BLUE,80,350,70,70);
            }
            var solution=new PDPage();doc.addPage(solution);
            try(var out=new PDPageContentStream(doc,solution)) {
                text(out,780,"HUONG DAN GIAI CHI TIET");text(out,750,"PHAN I. Nhieu phuong an lua chon");
                text(out,720,"Cau 1: Answer source");text(out,690,"A. One B. Two C. Three D. Four");
                text(out,660,"Loi giai");text(out,630,"Chon A");image(doc,out,Color.GREEN,80,480,100,100);
                text(out,420,"Cau 2: Second answer source");text(out,390,"A. One B. Two C. Three D. Four");text(out,360,"Loi giai");text(out,330,"Chon B");
            }
            doc.save(path.toFile());
        }
        return path;
    }
    private record Input(PdfExamScopeParser.Index index,PdfExamStructureParser.Structure structure) {}
    private Input input(Path file) {
        var index=new PdfExamScopeParser().inspectForExam(file,1,PdfExamLayout.vietnameseThreePart());
        return new Input(index,new PdfExamSolutionParser().parse(index,new PdfExamStructureParser().parse(index,1)).structure());
    }
    private Result extract(Path file,PdfExamMediaExtractor extractor) {var input=input(file);return extractor.extract(file,input.index(),input.structure());}
    private boolean hasColor(Asset asset,int red,int green,int blue) throws Exception {
        var image=ImageIO.read(new ByteArrayInputStream(asset.png()));assertNotNull(image);
        try {
            for(int y=0;y<image.getHeight();y++) for(int x=0;x<image.getWidth();x++) {
                int rgb=image.getRGB(x,y);if(Math.abs(((rgb>>16)&255)-red)<20&&Math.abs(((rgb>>8)&255)-green)<20&&Math.abs((rgb&255)-blue)<20) return true;
            }
            return false;
        } finally {image.flush();}
    }
    @Test void extractsEmbeddedImagesAndVectorIntoPrivateAssetsWithoutCrossingQuestionOrSolution() throws Exception {
        var result=extract(fixture(),new PdfExamMediaExtractor());
        assertEquals(2,result.renderedPages());assertTrue(result.assets().stream().allMatch(a->a.teacherOnly()&&a.requiresReview()));
        var question=result.assets().stream().filter(a->a.owner()==Owner.QUESTION&&a.purpose()==Purpose.ILLUSTRATION&&a.ownerId().endsWith("question-1")).findFirst().orElseThrow();
        assertEquals(2,question.sources().size());assertTrue(hasColor(question,255,0,0));assertFalse(hasColor(question,0,255,0));
        // The second illustration is drawn with PDF paths, not an embedded bitmap.
        assertTrue(hasColor(question,0,0,0));
        var explanation=result.assets().stream().filter(a->a.owner()==Owner.EXPLANATION&&a.purpose()==Purpose.ILLUSTRATION).findFirst().orElseThrow();
        assertTrue(hasColor(explanation,0,255,0));assertFalse(hasColor(explanation,255,0,0));
        for(var asset:result.assets()) if(asset.owner()==Owner.QUESTION) assertFalse(hasColor(asset,0,255,0));
        assertTrue(result.issues().stream().anyMatch(i->i.code().equals("MEDIA_TARGET_REVIEW_REQUIRED")));
    }
    @Test void refusesDifferentPdfBytesEvenWhenPageNumbersAndQuestionNumbersMatch() throws Exception {
        var file=fixture();var input=input(file);
        Files.writeString(file,"\n% changed after indexing",StandardOpenOption.APPEND);
        assertThrows(IllegalArgumentException.class,()->new PdfExamMediaExtractor().extract(file,input.index(),input.structure()));
    }
    @Test void boundsPagesAndCropsBeforeAllocatingImages() throws Exception {
        var file=fixture();var limits=new Limits(120,100,100,100,8192,150,1024,1024);
        var result=extract(file,new PdfExamMediaExtractor(limits));
        assertEquals(0,result.renderedPages());assertTrue(result.assets().isEmpty());
        assertTrue(result.issues().stream().anyMatch(i->i.code().equals("MEDIA_PAGE_LIMIT")));
    }
    @Test void limitsPngBytesAndReturnsIssuesInsteadOfPartialOrOversizedAsset() throws Exception {
        var limits=new Limits(120,8_000_000,16_000_000,32_000_000,8192,150,30,300);
        var result=extract(fixture(),new PdfExamMediaExtractor(limits));
        assertTrue(result.assets().isEmpty());assertTrue(result.issues().stream().anyMatch(i->i.code().equals("MEDIA_ENCODING_LIMIT")));
    }
    @Test void validatesLimitsAndHonorsInterruption() throws Exception {
        assertThrows(IllegalArgumentException.class,()->new Limits(1000,1,1,1,1,1,1,1));
        var file=fixture();var input=input(file);Thread.currentThread().interrupt();
        try {assertEquals(PdfExamScopeParser.ErrorCode.IMPORT_INTERRUPTED,assertThrows(PdfExamScopeParser.ScopeException.class,
                ()->new PdfExamMediaExtractor().extract(file,input.index(),input.structure())).code());}
        finally {Thread.interrupted();}
    }
    @Test void rotatedPagesProduceReviewIssuesInsteadOfGuessingCropCoordinates() throws Exception {
        var source=fixture();var rotated=temp.resolve("rotated.pdf");
        try(var doc=org.apache.pdfbox.Loader.loadPDF(source.toFile())) {doc.getPage(0).setRotation(90);doc.save(rotated.toFile());}
        var result=extract(rotated,new PdfExamMediaExtractor());
        assertTrue(result.issues().stream().anyMatch(i->i.code().equals("MEDIA_ROTATION_UNSUPPORTED")));
        assertTrue(result.assets().stream().noneMatch(a->a.sources().stream().anyMatch(r->r.page()==1)));
    }
    @Test void boundsMultiPageCompositesWithoutReturningPartialQuestionReference() throws Exception {
        var file=temp.resolve("long.pdf");
        try(var doc=new PDDocument()) {
            for(int i=0;i<4;i++) {
                var page=new PDPage();doc.addPage(page);
                try(var out=new PDPageContentStream(doc,page)) {
                    if(i==0) {text(out,780,"DE 1");text(out,750,"PHAN I. Tra loi ngan");text(out,720,"Cau 1: Long question");}
                    else if(i<3) text(out,700,"Question continued across page");
                    else {text(out,780,"HUONG DAN GIAI CHI TIET");text(out,750,"PHAN I. Tra loi ngan");text(out,720,"Cau 1: Solution");text(out,690,"Loi giai");text(out,660,"Tra loi: 1");}
                }
            }
            doc.save(file.toFile());
        }
        var limits=new Limits(120,8_000_000,16_000_000,32_000_000,2000,150,5*1024*1024,32*1024*1024);
        var result=extract(file,new PdfExamMediaExtractor(limits));
        assertTrue(result.issues().stream().anyMatch(i->i.code().equals("MEDIA_COMPOSITE_LIMIT")));
        assertTrue(result.assets().stream().noneMatch(a->a.owner()==Owner.QUESTION&&a.purpose()==Purpose.SOURCE_REFERENCE));
        assertTrue(result.assets().stream().anyMatch(a->a.owner()==Owner.EXPLANATION));
    }
    @Test void rejectsOversizedEmbeddedImageBeforeItsPixelsAreDecodedByRenderer() throws Exception {
        var limits=new Limits(120,8_000_000,50,32_000_000,8192,150,5*1024*1024,32*1024*1024);
        var result=extract(fixture(),new PdfExamMediaExtractor(limits));
        assertEquals(0,result.renderedPages());assertTrue(result.assets().isEmpty());
        assertTrue(result.issues().stream().anyMatch(i->i.code().equals("MEDIA_GRAPHICS_LIMIT")));
    }
    @Test void localSampleBuildsSeparateReferencesAndIllustrationsForSelectedExamOnly() throws Exception {
        var sample=System.getProperty("pdf.scope.sample");Assumptions.assumeTrue(sample!=null&&Files.isRegularFile(Path.of(sample)));
        var file=Path.of(sample);var input=input(file);var result=new PdfExamMediaExtractor().extract(file,input.index(),input.structure());
        assertEquals(22,result.assets().stream().filter(a->a.owner()==Owner.QUESTION&&a.purpose()==Purpose.SOURCE_REFERENCE).count());
        assertEquals(22,result.assets().stream().filter(a->a.owner()==Owner.EXPLANATION&&a.purpose()==Purpose.SOURCE_REFERENCE).count());
        assertTrue(result.assets().stream().anyMatch(a->a.purpose()==Purpose.ILLUSTRATION));
        assertTrue(result.assets().stream().allMatch(a->a.sources().stream().allMatch(r->r.page()<=17)));
        assertTrue(result.renderedPages()<=17);
        var output=Path.of("target/pdf-media-review");Files.createDirectories(output);
        var selected=result.assets().stream().filter(a->a.ownerId().endsWith("section-1-question-10")||a.ownerId().endsWith("section-2-question-1")).toList();
        for(var asset:selected) Files.write(output.resolve(asset.ownerId()+"-"+asset.owner()+"-"+asset.purpose()+".png"),asset.png());
        System.out.println("PDF media: assets="+result.assets().size()+", rendered pages="+result.renderedPages()+", issues="+result.issues().stream().map(PdfExamStructureParser.Issue::code).toList());
    }
}
